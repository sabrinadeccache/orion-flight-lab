import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsCron } from './notifications.cron';
import { EmailProvider } from './providers/email.provider';
import { NOTIFICATIONS_QUEUE } from './notifications.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
            // Managed Redis (Upstash, Railway) is exposed over TLS via the
            // rediss:// scheme — ioredis needs an explicit tls option or the
            // handshake fails, plain redis:// (local/docker-compose) needs none.
            tls: url.protocol === 'rediss:' ? {} : undefined,
            lazyConnect: true,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  providers: [NotificationsService, NotificationsProcessor, NotificationsCron, EmailProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
