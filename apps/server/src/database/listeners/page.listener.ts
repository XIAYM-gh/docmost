import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventName } from '../../common/events/event.contants';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueJob, QueueName } from '../../integrations/queue/constants';
import { Queue } from 'bullmq';
import { EnvironmentService } from '../../integrations/environment/environment.service';

export class PageEvent {
  pageIds: string[];
  workspaceId: string;
}

@Injectable()
export class PageListener {
  private readonly logger = new Logger(PageListener.name);

  constructor(
    private readonly environmentService: EnvironmentService,
    @InjectQueue(QueueName.SEARCH_QUEUE) private searchQueue: Queue,
  ) {}

  @OnEvent(EventName.PAGE_CREATED)
  async handlePageCreated(event: PageEvent) {}

  @OnEvent(EventName.PAGE_UPDATED)
  async handlePageUpdated(event: PageEvent) {
    const { pageIds } = event;

    await this.searchQueue.add(QueueJob.PAGE_UPDATED, { pageIds });
  }

  @OnEvent(EventName.PAGE_DELETED)
  async handlePageDeleted(event: PageEvent) {}

  @OnEvent(EventName.PAGE_SOFT_DELETED)
  async handlePageSoftDeleted(event: PageEvent) {}

  @OnEvent(EventName.PAGE_RESTORED)
  async handlePageRestored(event: PageEvent) {}
}
