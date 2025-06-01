import prisma from './prisma';
import { SystemNotificationType, NotificationPriority } from '@prisma/client';

// Notification templates
const NOTIFICATION_TEMPLATES = {
    SCHEDULE_ASSIGNED: {
        title: 'Nieuwe roostertoewijzing',
        message: 'Je bent toegewezen aan een nieuwe dienst op {date} van {startTime} tot {endTime}',
        priority: 'NORMAL' as NotificationPriority,
    },
    SCHEDULE_CHANGED: {
        title: 'Roosterwijziging',
        message: 'Je dienst op {date} is gewijzigd. Nieuwe tijd: {startTime} - {endTime}',
        priority: 'HIGH' as NotificationPriority,
    },
    SCHEDULE_CANCELLED: {
        title: 'Dienst geannuleerd',
        message: 'Je dienst op {date} van {startTime} tot {endTime} is geannuleerd',
        priority: 'HIGH' as NotificationPriority,
    },
    PROJECT_ASSIGNED: {
        title: 'Toegewezen aan project',
        message: 'Je bent toegewezen aan het project "{projectName}"',
        priority: 'NORMAL' as NotificationPriority,
    },
    PROJECT_UPDATE: {
        title: 'Project update',
        message: 'Er is een update voor project "{projectName}": {updateDetails}',
        priority: 'NORMAL' as NotificationPriority,
    },
    LEAVE_REQUEST_APPROVED: {
        title: 'Verlofaanvraag goedgekeurd',
        message: 'Je verlofaanvraag voor {startDate} tot {endDate} is goedgekeurd',
        priority: 'NORMAL' as NotificationPriority,
    },
    LEAVE_REQUEST_REJECTED: {
        title: 'Verlofaanvraag afgewezen',
        message: 'Je verlofaanvraag voor {startDate} tot {endDate} is afgewezen. Reden: {reason}',
        priority: 'HIGH' as NotificationPriority,
    },
    CONTRACT_EXPIRING: {
        title: 'Contract verloopt binnenkort',
        message: 'Je contract verloopt op {expiryDate}. Neem contact op met HR.',
        priority: 'URGENT' as NotificationPriority,
    },
    TIME_TRACKING_REMINDER: {
        title: 'Vergeten uit te klokken',
        message: 'Je bent vergeten uit te klokken. Laatste ingeklokte tijd: {clockInTime}',
        priority: 'HIGH' as NotificationPriority,
    },
    CHAT_MESSAGE: {
        title: 'Nieuw bericht',
        message: '{senderName}: {messagePreview}',
        priority: 'NORMAL' as NotificationPriority,
    },
    CHAT_MENTION: {
        title: 'Je bent genoemd',
        message: '{senderName} heeft je genoemd in {roomName}',
        priority: 'HIGH' as NotificationPriority,
    },
    SYSTEM_MAINTENANCE: {
        title: 'Systeem onderhoud',
        message: 'Gepland onderhoud op {maintenanceDate} van {startTime} tot {endTime}',
        priority: 'NORMAL' as NotificationPriority,
    },
    APPROVAL_REQUEST: {
        title: 'Goedkeuring vereist',
        message: 'Er is een {requestType} die je goedkeuring vereist',
        priority: 'HIGH' as NotificationPriority,
    },
} as const;

interface NotificationOptions {
    userId: string;
    type: SystemNotificationType;
    templateKey?: keyof typeof NOTIFICATION_TEMPLATES;
    title?: string;
    message?: string;
    priority?: NotificationPriority;
    data?: Record<string, any>;
    sendEmail?: boolean;
    sendPush?: boolean;
    variables?: Record<string, string>;
}

interface NotificationPreferences {
    email: boolean;
    push: boolean;
    inApp: boolean;
    schedule: boolean;
    projects: boolean;
    timeTracking: boolean;
    chat: boolean;
    system: boolean;
    quietHours: {
        enabled: boolean;
        startTime: string; // "22:00"
        endTime: string;   // "08:00"
    };
}

class NotificationManager {
    private emailService: EmailService;
    private pushService: PushNotificationService;

    constructor() {
        this.emailService = new EmailService();
        this.pushService = new PushNotificationService();
    }

    /**
     * Send a notification using template
     */
    async sendNotification(options: NotificationOptions) {
        try {
            // Get notification template
            const template = options.templateKey ? NOTIFICATION_TEMPLATES[options.templateKey] : null;

            const title = options.title || template?.title || 'Melding';
            let message = options.message || template?.message || '';
            const priority = options.priority || template?.priority || 'NORMAL';

            // Replace variables in message
            if (options.variables && message) {
                Object.entries(options.variables).forEach(([key, value]) => {
                    message = message.replace(new RegExp(`{${key}}`, 'g'), value);
                });
            }

            // Check user preferences
            const preferences = await this.getUserNotificationPreferences(options.userId);

            // Check quiet hours
            if (this.isQuietHours(preferences)) {
                console.log(`⏰ Quiet hours active for user ${options.userId}, delaying notification`);
                return await this.scheduleNotification(options, this.getNextActiveTime(preferences));
            }

            // Create in-app notification
            const notification = await prisma.systemNotification.create({
                data: {
                    userId: options.userId,
                    type: options.type,
                    title,
                    message,
                    priority,
                    data: options.data ? JSON.stringify(options.data) : null,
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            name: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            // Send email if enabled
            if (options.sendEmail !== false && preferences.email && this.shouldSendEmail(options.type, preferences)) {
                await this.emailService.sendNotificationEmail(notification);
            }

            // Send push notification if enabled
            if (options.sendPush !== false && preferences.push && this.shouldSendPush(options.type, preferences)) {
                await this.pushService.sendPushNotification(notification);
            }

            // Create activity log
            await this.createActivityLog(options.userId, options.type, title, message);

            console.log(`SUCCESS: Notification sent to user ${options.userId}: ${title}`);
            return notification;

        } catch (error) {
            console.error('ERROR: Failed to send notification:', error);
            throw error;
        }
    }

    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(userIds: string[], notificationData: Omit<NotificationOptions, 'userId'>) {
        const notifications = userIds.map(userId => ({
            ...notificationData,
            userId,
        }));

        const results = await Promise.allSettled(
            notifications.map(notification => this.sendNotification(notification))
        );

        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;

        console.log(`BULK: Bulk notifications: ${successful} successful, ${failed} failed`);
        return { successful, failed };
    }

    /**
     * Schedule notifications for later delivery
     */
    async scheduleNotification(options: NotificationOptions, scheduledTime: Date) {
        // In a real implementation, this would use a job queue like Bull or Agenda
        console.log(`⏰ Scheduling notification for ${scheduledTime.toISOString()}`);

        // For now, store in database with scheduled time
        return await prisma.systemNotification.create({
            data: {
                userId: options.userId,
                type: options.type,
                title: options.title || 'Geplande melding',
                message: options.message || '',
                priority: options.priority || 'NORMAL',
                data: options.data ? JSON.stringify(options.data) : null,
                // Would need a scheduledFor field in the schema
            },
        });
    }

    /**
     * Get unread notifications for user
     */
    async getUnreadNotifications(userId: string, limit: number = 20) {
        return await prisma.systemNotification.findMany({
            where: {
                userId,
                read: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            include: {
                sender: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
    }

    /**
     * Mark notifications as read
     */
    async markAsRead(notificationIds: string[], userId: string) {
        const result = await prisma.systemNotification.updateMany({
            where: {
                id: { in: notificationIds },
                userId, // Security check
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        console.log(`SUCCESS: Marked ${result.count} notifications as read for user ${userId}`);
        return result;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string) {
        const result = await prisma.systemNotification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        console.log(`SUCCESS: Marked all ${result.count} notifications as read for user ${userId}`);
        return result;
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(userId: string) {
        const [total, unread, byType, byPriority] = await Promise.all([
            prisma.systemNotification.count({ where: { userId } }),
            prisma.systemNotification.count({ where: { userId, read: false } }),
            prisma.systemNotification.groupBy({
                by: ['type'],
                where: { userId },
                _count: true,
                orderBy: { _count: { type: 'desc' } },
            }),
            prisma.systemNotification.groupBy({
                by: ['priority'],
                where: { userId, read: false },
                _count: true,
            }),
        ]);

        return {
            total,
            unread,
            byType: byType.map(item => ({ type: item.type, count: item._count })),
            byPriority: byPriority.map(item => ({ priority: item.priority, count: item._count })),
        };
    }

    /**
     * Update user notification preferences
     */
    async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
        // Store in user profile or separate preferences table
        // For now, store as JSON in user record
        await prisma.user.update({
            where: { id: userId },
            data: {
                // Would need a notificationPreferences field
            },
        });

        return preferences;
    }

    /**
     * Process pending notifications
     */
    async processPendingNotifications() {
        console.log('PROCESSING: Processing pending notifications...');

        const pendingNotifications = await prisma.systemNotification.findMany({
            where: {
                read: false,
                createdAt: {
                    lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
                },
            },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return pendingNotifications;
    }

    // Private helper methods
    private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        // Default preferences
        const defaultPreferences: NotificationPreferences = {
            email: true,
            push: true,
            inApp: true,
            schedule: true,
            projects: true,
            timeTracking: true,
            chat: true,
            system: true,
            quietHours: {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
            },
        };

        // In real implementation, fetch from database
        return defaultPreferences;
    }

    private isQuietHours(preferences: NotificationPreferences): boolean {
        if (!preferences.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = preferences.quietHours.startTime.split(':').map(Number);
        const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    private getNextActiveTime(preferences: NotificationPreferences): Date {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
        tomorrow.setHours(endHour, endMin, 0, 0);

        return tomorrow;
    }

    private shouldSendEmail(type: SystemNotificationType, preferences: NotificationPreferences): boolean {
        switch (type) {
            case 'SCHEDULE_UPDATE':
                return preferences.schedule;
            case 'PROJECT_UPDATE':
            case 'PROJECT_ASSIGNMENT':
                return preferences.projects;
            case 'TIME_TRACKING':
                return preferences.timeTracking;
            case 'CHAT_MESSAGE':
            case 'CHAT_MENTION':
                return preferences.chat;
            default:
                return preferences.system;
        }
    }

    private shouldSendPush(type: SystemNotificationType, preferences: NotificationPreferences): boolean {
        // Same logic as email for now
        return this.shouldSendEmail(type, preferences);
    }

    private async createActivityLog(userId: string, type: SystemNotificationType, title: string, message: string) {
        await prisma.activityFeed.create({
            data: {
                userId,
                actorId: userId, // System notifications are self-directed
                type: 'NOTIFICATION_SENT',
                title,
                description: message,
                data: JSON.stringify({ notificationType: type }),
            },
        });
    }
}

// Email service for notification emails
class EmailService {
    async sendNotificationEmail(notification: any) {
        // Integration with email service (SendGrid, Mailgun, etc.)
        console.log(`📧 Sending email notification to ${notification.user.email}: ${notification.title}`);

        // Implementation would depend on email service
        // For now, just log
    }
}

// Push notification service
class PushNotificationService {
    async sendPushNotification(notification: any) {
        console.log(`📱 Sending push notification: ${notification.title}`);

        // Get user's push subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                userId: notification.userId,
                isActive: true,
            },
        });

        // Send to each subscription
        for (const subscription of subscriptions) {
            try {
                await this.sendToSubscription(subscription, notification);
            } catch (error) {
                console.error(`Failed to send push to subscription ${subscription.id}:`, error);

                // Mark subscription as inactive if it fails
                await prisma.pushSubscription.update({
                    where: { id: subscription.id },
                    data: { isActive: false },
                });
            }
        }
    }

    private async sendToSubscription(subscription: any, notification: any) {
        // Implementation would use web-push library
        console.log(`Sending to subscription: ${subscription.id}`);
    }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// Helper functions for common notification scenarios
export const NotificationHelpers = {
    scheduleAssigned: (userId: string, scheduleData: any) =>
        notificationManager.sendNotification({
            userId,
            type: 'SCHEDULE_UPDATE',
            templateKey: 'SCHEDULE_ASSIGNED',
            variables: scheduleData,
        }),

    projectAssigned: (userId: string, projectName: string) =>
        notificationManager.sendNotification({
            userId,
            type: 'PROJECT_ASSIGNMENT',
            templateKey: 'PROJECT_ASSIGNED',
            variables: { projectName },
        }),

    contractExpiring: (userId: string, expiryDate: string) =>
        notificationManager.sendNotification({
            userId,
            type: 'SYSTEM_ALERT',
            templateKey: 'CONTRACT_EXPIRING',
            variables: { expiryDate },
            priority: 'URGENT',
        }),

    timeTrackingReminder: (userId: string, clockInTime: string) =>
        notificationManager.sendNotification({
            userId,
            type: 'TIME_TRACKING',
            templateKey: 'TIME_TRACKING_REMINDER',
            variables: { clockInTime },
        }),
};

export type { NotificationOptions, NotificationPreferences }; 