import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogInterceptor } from './modules/auth/interceptors/audit-log.interceptor';
import { OrganizationModule } from './modules/organization/organization.module';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { TrainingModule } from './modules/training/training.module';
import { AcademicModule } from './modules/academic/academic.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SgqModule } from './modules/sgq/sgq.module';
import { SgsoModule } from './modules/sgso/sgso.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CrmModule } from './modules/crm/crm.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { FinancialModule } from './modules/financial/financial.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    AuthModule,
    OrganizationModule,
    PersonnelModule,
    TrainingModule,
    AcademicModule,
    DocumentsModule,
    SgqModule,
    SgsoModule,
    ClientsModule,
    CrmModule,
    ContractsModule,
    FinancialModule,
    NotificationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }],
})
export class AppModule {}
