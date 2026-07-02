import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { OrganizationGuard } from './guards/organization.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard, OrganizationGuard, RolesGuard, AuditLogInterceptor],
  exports: [AuthService, SupabaseAuthGuard, OrganizationGuard, RolesGuard, AuditLogInterceptor],
})
export class AuthModule {}
