import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const AuthUser = createParamDecorator(
  (failSafe: boolean = false, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request?.user?.user && !failSafe) {
      throw new BadRequestException('Invalid User');
    }

    return request.user.user;
  },
);
