import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventName } from '../../common/events/event.contants';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueJob, QueueName } from '../../integrations/queue/constants';
import { Queue } from 'bullmq';
import { EnvironmentService } from '../../integrations/environment/environment.service';

export class WorkspaceEvent {
  workspaceId: string;
}

@Injectable()
export class WorkspaceListener {
  private readonly logger = new Logger(WorkspaceListener.name);

  constructor(
    private readonly environmentService: EnvironmentService,
    @InjectQueue(QueueName.SEARCH_QUEUE) private searchQueue: Queue,
  ) {}

  @OnEvent(EventName.WORKSPACE_DELETED)
  async handlePageDeleted(event: WorkspaceEvent) {}
}
