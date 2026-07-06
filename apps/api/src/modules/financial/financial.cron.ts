import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** RN-32: daily job — flags overdue charges and tracks their delinquency. */
@Injectable()
export class FinancialCron {
  private readonly logger = new Logger(FinancialCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async checkOverdueCharges(): Promise<void> {
    const now = new Date();

    const overdueCharges = await this.prisma.charge.findMany({
      where: { deleted_at: null, status: 'pendente', due_date: { lt: now } },
      include: { delinquencies: { where: { deleted_at: null } } },
    });

    for (const charge of overdueCharges) {
      const daysOverdue = Math.floor((now.getTime() - charge.due_date.getTime()) / MS_PER_DAY);
      const existing = charge.delinquencies[0];

      if (existing) {
        await this.prisma.delinquency.update({
          where: { id: existing.id },
          data: { days_overdue: daysOverdue, notified_at: now },
        });
      } else {
        await this.prisma.delinquency.create({
          data: {
            organization_id: charge.organization_id,
            charge_id: charge.id,
            days_overdue: daysOverdue,
            notified_at: now,
          },
        });
      }
    }

    this.logger.log(`RN-32 delinquency sweep: ${overdueCharges.length} overdue charges processed`);
  }
}
