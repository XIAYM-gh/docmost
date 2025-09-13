import { Global, Module } from '@nestjs/common';
import { MFAController } from './mfa.controller';
import { MFARepo } from '@docmost/db/repos/mfa-community/mfa.repo';
import { MFAService } from './mfa.service';
import { TokenModule } from '../auth/token.module';
import { EnvironmentModule } from 'src/integrations/environment/environment.module';

@Global()
@Module({
  controllers: [MFAController],
  providers: [MFARepo, MFAService],
  exports: [MFARepo, MFAService],
  imports: [TokenModule, EnvironmentModule],
})
export class MFAModule {}
