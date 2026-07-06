import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialCron } from './financial.cron';

@Module({
  controllers: [FinancialController],
  providers: [FinancialService, FinancialCron],
  exports: [FinancialService],
})
export class FinancialModule {}
