import { MFARepo } from '@docmost/db/repos/mfa-community/mfa.repo';
import { User, Workspace } from '@docmost/db/types/entity.types';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { AuthWorkspace } from 'src/common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { authenticator } from 'otplib';
import { MFAService } from './mfa.service';
import { comparePasswordHash } from 'src/common/helpers';
import { UserRepo } from '@docmost/db/repos/user/user.repo';
import { FastifyReply, FastifyRequest } from 'fastify';
import { EnvironmentService } from 'src/integrations/environment/environment.service';
import { TokenService } from '../auth/services/token.service';
import { JwtPayload, JwtType } from '../auth/dto/jwt-payload';
import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';

interface MfaStatusResponse {
  isEnabled?: boolean;
  method?: string | null;
  backupCodesCount?: number;
}

interface MfaSetupResponse {
  method: string;
  secret: string;
  fullUri: string;
}

interface MfaEnableResponse {
  success: boolean;
  backupCodes: string[];
}

interface MfaBackupCodesResponse {
  backupCodes: string[];
}

interface MfaAccessValidationResponse {
  valid: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('mfa')
export class MFAController {
  constructor(
    private readonly mfaRepo: MFARepo,
    private readonly mfaService: MFAService,
    private readonly userRepo: UserRepo,
    private readonly workspaceRepo: WorkspaceRepo,
    private readonly tokenService: TokenService,
    private readonly environmentService: EnvironmentService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('status')
  async getMfaStatus(
    @AuthUser() authUser: User,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<MfaStatusResponse> {
    const mfa = await this.mfaRepo.findById(authUser.id, workspace.id);
    if (!mfa || !mfa.isEnabled) {
      return { isEnabled: false };
    }

    return {
      isEnabled: true,
      method: mfa.method,
      backupCodesCount: mfa.backupCodes ? mfa.backupCodes.length : 0,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('setup')
  async setupMfa(
    @Body('method') method: string,
    @AuthUser(true) authUser: User,
    @Req() request: FastifyRequest,
  ): Promise<MfaSetupResponse> {
    if (method != 'totp') {
      throw new BadRequestException('Unsupported MFA type');
    }

    const user = await this.fetchValidUser(request, authUser);
    const workspace = await this.workspaceRepo.findById(user.workspaceId);

    const mfa = await this.mfaRepo.findById(user.id, workspace.id);
    if (mfa && mfa.isEnabled) {
      throw new BadRequestException('Your MFA is already enabled');
    }

    const secret = authenticator.generateSecret();
    if (!mfa) {
      await this.mfaRepo.insertMFA({
        userId: user.id,
        workspaceId: workspace.id,
        isEnabled: false,
        method,
        secret,
      });
    } else {
      await this.mfaRepo.updateMFA(user.id, workspace.id, {
        method,
        secret,
      });
    }

    return {
      method: 'totp',
      secret,
      fullUri: this.mfaService
        .getAuthenticator()
        .keyuri(user.email, workspace.name + ' (Docmost)', secret),
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('enable')
  async enableMfa(
    @Body('verificationCode') code: string,
    @AuthUser(true) authUser: User,
    @Req() request: FastifyRequest,
  ): Promise<MfaEnableResponse> {
    const user = await this.fetchValidUser(request, authUser);
    const workspace = await this.workspaceRepo.findById(user.workspaceId);

    const mfa = await this.mfaRepo.findById(user.id, workspace.id);
    if (mfa && mfa.isEnabled) {
      throw new BadRequestException('Your MFA is already enabled');
    }

    if (!(await this.mfaService.validate(user.id, workspace.id, code, false))) {
      throw new BadRequestException('Invalid code, please try again.');
    }

    const backupCodes = this.generateBackupCodes();
    await this.mfaRepo.updateMFA(user.id, workspace.id, {
      backupCodes,
      isEnabled: true,
    });

    return { success: true, backupCodes };
  }

  @HttpCode(HttpStatus.OK)
  @Post('disable')
  async disableMfa(
    @Body('confirmPassword') password: string,
    @AuthUser() authUser: User,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<{ success: boolean }> {
    if (!password) {
      throw new BadRequestException(
        'Password confirmation is required to disable MFA',
      );
    }

    const mfa = await this.mfaRepo.findById(authUser.id, workspace.id);
    if (!mfa || !mfa.isEnabled) {
      throw new BadRequestException('Your MFA is already disabled');
    }

    const userPwd = (
      await this.userRepo.findById(authUser.id, workspace.id, {
        includePassword: true,
      })
    ).password;
    if (!(await comparePasswordHash(password, userPwd))) {
      return { success: false };
    }

    await this.mfaRepo.updateMFA(authUser.id, workspace.id, {
      backupCodes: [],
      secret: '',
      isEnabled: false,
    });

    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('generate-backup-codes')
  async regenerateBackupCodes(
    @Body('confirmPassword') password: string,
    @AuthUser() authUser: User,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<MfaBackupCodesResponse> {
    if (!password) {
      throw new BadRequestException(
        'Password confirmation is required to regenerate backup codes',
      );
    }

    const mfa = await this.mfaRepo.findById(authUser.id, workspace.id);
    if (!mfa || !mfa.isEnabled) {
      throw new BadRequestException('Your MFA is not enabled');
    }

    const userPwd = (
      await this.userRepo.findById(authUser.id, workspace.id, {
        includePassword: true,
      })
    ).password;
    if (!(await comparePasswordHash(password, userPwd))) {
      throw new BadRequestException('Incorrect password');
    }

    const backupCodes = this.generateBackupCodes();
    await this.mfaRepo.updateMFA(authUser.id, workspace.id, {
      backupCodes,
      isEnabled: true,
    });

    return { backupCodes };
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verifyMfa(
    @Body('code') code: string,
    @AuthUser(true) authUser: User,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<any> {
    const user = await this.fetchValidUser(request, authUser);
    const workspace = await this.workspaceRepo.findById(user.workspaceId);

    const mfa = await this.mfaRepo.findById(user.id, workspace.id);
    if (!mfa || !mfa.isEnabled) {
      throw new BadRequestException('Your MFA is not enabled');
    }

    if (!(await this.mfaService.validate(user.id, workspace.id, code))) {
      throw new BadRequestException('Invalid verification code');
    }

    // Returning nothing as the verification is successful
    this.setAuthCookie(res, await this.tokenService.generateAccessToken(user));
    if (!authUser) {
      res.clearCookie('mfaToken');
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('validate-access')
  async validateMfaAccess(
    @AuthUser(true) authUser: User,
    @Req() request: FastifyRequest,
  ): Promise<MfaAccessValidationResponse> {
    if (authUser) {
      return { valid: false };
    }

    const user = await this.fetchValidUser(request, authUser);
    const workspace = await this.workspaceRepo.findById(user.workspaceId);

    const mfaStatus = await this.mfaService.getMfaStatus(user.id, workspace);
    return { valid: mfaStatus.requiresMfaSetup || mfaStatus.userHasMfa };
  }

  generateBackupCodes(): string[] {
    const backupCodes = new Array(10);
    for (let i = 0; i < 10; i++) {
      const generated = authenticator.generateSecret(10);
      const splited = [generated.substring(0, 5), generated.substring(5, 10)];
      backupCodes[i] = splited.join('-');
    }

    return backupCodes;
  }

  setAuthCookie(res: FastifyReply, token: string) {
    res.setCookie('authToken', token, {
      httpOnly: true,
      path: '/',
      expires: this.environmentService.getCookieExpiresIn(),
      secure: this.environmentService.isHttps(),
    });
  }

  async fetchValidUser(req: FastifyRequest, user?: User) {
    if (user) {
      return user;
    }

    if (!req.cookies['mfaToken']) {
      throw new ForbiddenException('Login required');
    }

    const mfaToken = (await this.tokenService.verifyJwt(
      req.cookies['mfaToken'],
      JwtType.MFA_TOKEN,
    )) as JwtPayload;

    return await this.userRepo.findById(mfaToken.sub, mfaToken.workspaceId, {
      includeUserMfa: true,
    });
  }
}
