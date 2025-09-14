import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';

@Injectable()
export class DomainMiddleware implements NestMiddleware {
  constructor(private workspaceRepo: WorkspaceRepo) {}
  async use(req: FastifyRequest['raw'], _res: any, next: () => void) {
    const workspace = await this.workspaceRepo.findFirst();
    if (!workspace) {
      //throw new NotFoundException('Workspace not found');
      (req as any).workspaceId = null;
      return next();
    }

    // TODO: unify
    (req as any).workspaceId = workspace.id;
    (req as any).workspace = workspace;

    next();
  }
}
