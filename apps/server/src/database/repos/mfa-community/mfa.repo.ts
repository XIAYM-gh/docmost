import { UserMfa } from '@docmost/db/types/db';
import {
  InsertableUserMFA,
  UpdatableUserMFA,
  UserMFA,
} from '@docmost/db/types/entity.types';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { dbOrTx } from '@docmost/db/utils';
import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';

@Injectable()
export class MFARepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  private baseFields: Array<keyof UserMfa> = [
    'backupCodes',
    'createdAt',
    'id',
    'isEnabled',
    'method',
    'secret',
    'updatedAt',
    'userId',
    'workspaceId',
  ];

  async findById(userId: string, workspaceId: string): Promise<UserMFA> {
    const db = dbOrTx(this.db, null);
    return db
      .selectFrom('userMfa')
      .select(this.baseFields)
      .where('userId', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();
  }

  async updateMFA(
    userId: string,
    workspaceId: string,
    updatableMFA: UpdatableUserMFA,
  ) {
    const db = dbOrTx(this.db, null);
    return db
      .updateTable('userMfa')
      .set({
        ...updatableMFA,
        updatedAt: new Date(),
      })
      .where('userId', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .execute();
  }

  async insertMFA(insertableUser: InsertableUserMFA): Promise<UserMFA> {
    const db = dbOrTx(this.db, null);
    return db
      .insertInto('userMfa')
      .values({
        ...insertableUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning(this.baseFields)
      .executeTakeFirst();
  }
}
