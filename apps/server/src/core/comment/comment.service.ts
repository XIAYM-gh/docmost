import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentRepo } from '@docmost/db/repos/comment/comment.repo';
import { Comment, Page, User } from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { PaginationResult } from '@docmost/db/pagination/pagination';
import { PageRepo } from '@docmost/db/repos/page/page.repo';
import { SpaceMemberRepo } from '@docmost/db/repos/space/space-member.repo';

@Injectable()
export class CommentService {
  constructor(
    private commentRepo: CommentRepo,
    private pageRepo: PageRepo,
    private spaceMemberRepo: SpaceMemberRepo,
  ) {}

  async findById(commentId: string) {
    const comment = await this.commentRepo.findById(commentId, {
      includeCreator: true,
      includeResolvedBy: true,
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async create(
    opts: { userId: string; page: Page; workspaceId: string },
    createCommentDto: CreateCommentDto,
  ) {
    const { userId, page, workspaceId } = opts;
    const commentContent = JSON.parse(createCommentDto.content);

    if (createCommentDto.parentCommentId) {
      const parentComment = await this.commentRepo.findById(
        createCommentDto.parentCommentId,
      );

      if (!parentComment || parentComment.pageId !== page.id) {
        throw new BadRequestException('Parent comment not found');
      }

      if (parentComment.parentCommentId !== null) {
        throw new BadRequestException('You cannot reply to a reply');
      }
    }

    return await this.commentRepo.insertComment({
      pageId: page.id,
      content: commentContent,
      selection: createCommentDto?.selection?.substring(0, 250),
      type: 'inline',
      parentCommentId: createCommentDto?.parentCommentId,
      creatorId: userId,
      workspaceId: workspaceId,
      spaceId: page.spaceId,
    });
  }

  async findByPageId(
    pageId: string,
    pagination: PaginationOptions,
  ): Promise<PaginationResult<Comment>> {
    const page = await this.pageRepo.findById(pageId);

    if (!page) {
      throw new BadRequestException('Page not found');
    }

    return await this.commentRepo.findPageComments(pageId, pagination);
  }

  async update(
    comment: Comment,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const commentContent = JSON.parse(updateCommentDto.content);
    const editedAt = new Date();

    await this.commentRepo.updateComment(
      {
        content: commentContent,
        editedAt: editedAt,
        updatedAt: editedAt,
      },
      comment.id,
    );
    comment.content = commentContent;
    comment.editedAt = editedAt;
    comment.updatedAt = editedAt;

    return comment;
  }

  async resolve(
    comment: Comment,
    resolved: boolean,
    authUser: User,
  ): Promise<Comment> {
    if (!!comment.resolvedAt == resolved) {
      return comment;
    }

    let resolvedAt: Date | null = null;
    let resolvedById: string | null = null;

    if (resolved) {
      resolvedAt = new Date();
      resolvedById = authUser.id;
    }

    const updatedAt = resolvedAt ?? new Date();

    await this.commentRepo.updateComment(
      {
        resolvedById,
        resolvedAt,
        updatedAt,
      },
      comment.id,
    );

    comment.resolvedAt = resolvedAt;
    comment.resolvedById = resolvedById;
    comment.updatedAt = updatedAt;

    return comment;
  }
}
