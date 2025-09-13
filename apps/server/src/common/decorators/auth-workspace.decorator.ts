import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const AuthWorkspace = createParamDecorator(
  (failSafe: boolean = false, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace = request.raw?.workspace ?? request?.user?.workspace;

    if (!workspace && !failSafe) {
      throw new BadRequestException('Invalid workspace');
    }

    return workspace;
  },
);
