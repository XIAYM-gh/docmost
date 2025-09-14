import { MFARepo } from '@docmost/db/repos/mfa-community/mfa.repo';
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { Authenticator, AuthenticatorOptions } from '@otplib/core';
import { UserMFA, Workspace } from '@docmost/db/types/entity.types';

export interface MfaStatus {
  userHasMfa: boolean;
  requiresMfaSetup: boolean;
}

@Injectable()
export class MFAService {
  constructor(private mfaRepo: MFARepo) {}

  getAuthenticator(): Authenticator<AuthenticatorOptions<string>> {
    return authenticator.create({
      ...authenticator.allOptions(),
      window: 3,
    });
  }

  async validate(
    userId: string,
    workspaceId: string,
    code: string,
  ): Promise<boolean> {
    const mfa = await this.mfaRepo.findById(userId, workspaceId);
    return (
      mfa &&
      (this.getAuthenticator().verify({
        token: code,
        secret: mfa.secret,
      }) ||
        (await this.validateBackupCode(userId, workspaceId, mfa, code)))
    );
  }

  private async validateBackupCode(
    userId: string,
    workspaceId: string,
    mfa: UserMFA,
    code: string,
  ) {
    if (mfa.backupCodes.includes(code)) {
      await this.mfaRepo.updateMFA(userId, workspaceId, {
        backupCodes: mfa.backupCodes.filter((it) => it != code),
      });

      return true;
    }

    return false;
  }

  async getMfaStatus(userId: string, workspace: Workspace): Promise<MfaStatus> {
    const mfa = await this.mfaRepo.findById(userId, workspace.id);

    return {
      userHasMfa: mfa && mfa.isEnabled,
      requiresMfaSetup: workspace.enforceMfa && !(mfa && mfa.isEnabled),
    };
  }
}
