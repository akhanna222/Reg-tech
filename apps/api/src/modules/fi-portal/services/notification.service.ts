import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Notification entity is expected to be created by the database/entities agent.
 * It should have: id, userId, type, title, body, resourceType, resourceId, isRead, createdAt.
 * We define a local interface for now and use a raw query approach via QueryRunner if entity is not yet available.
 */
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository('notifications')
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.debug(`Notification created: ${saved.id} for user ${params.userId}`);
    return saved as Notification;
  }

  async getUserNotifications(
    userId: string,
    unreadOnly = false,
  ): Promise<Notification[]> {
    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    }) as Promise<Notification[]>;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id } as any,
    });

    if (!notification) {
      throw new NotFoundException(`Notification not found: ${id}`);
    }

    (notification as any).isRead = true;
    return this.notificationRepository.save(notification) as Promise<Notification>;
  }
}
