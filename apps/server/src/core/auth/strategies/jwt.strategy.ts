import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { EnvironmentService } from '../../../integrations/environment/environment.service';
import { JwtApiKeyPayload, JwtPayload, JwtType } from '../dto/jwt-payload';
import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';
import { UserRepo } from '@docmost/db/repos/user/user.repo';
import { FastifyRequest } from 'fastify';
import { extractBearerTokenFromHeader } from '../../../common/helpers';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private logger = new Logger('JwtStrategy');

  constructor(
    private userRepo: UserRepo,
    private workspaceRepo: WorkspaceRepo,
    private readonly environmentService: EnvironmentService,
    private moduleRef: ModuleRef,
  ) {
    super({
      jwtFromRequest: (req: FastifyRequest) => {
        return req.cookies?.authToken || extractBearerTokenFromHeader(req);
      },
      ignoreExpiration: false,
      secretOrKey: environmentService.getAppSecret(),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload | JwtApiKeyPayload) {
    if (!payload.workspaceId) {
      throw new UnauthorizedException();
    }

    if (req.raw.workspaceId && req.raw.workspaceId !== payload.workspaceId) {
      throw new UnauthorizedException('Workspace does not match');
    }

    if (payload.type === JwtType.API_KEY) {
      return this.validateApiKey(req, payload as JwtApiKeyPayload);
    }

    if (payload.type !== JwtType.ACCESS) {
      throw new UnauthorizedException();
    }

    const workspace = await this.workspaceRepo.findById(payload.workspaceId);

    if (!workspace) {
      throw new UnauthorizedException();
    }
    const user = await this.userRepo.findById(payload.sub, payload.workspaceId);

    if (!user || user.deactivatedAt || user.deletedAt) {
      throw new UnauthorizedException();
    }

    return { user, workspace };
  }

  private async validateApiKey(req: any, payload: JwtApiKeyPayload) {
    throw new UnauthorizedException('Not implemented yet');
  }
}
