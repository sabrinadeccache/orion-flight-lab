import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DashboardSummary, ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.reportsService.name() };
  }

  @Get('dashboard-summary')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  getDashboardSummary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummary> {
    return this.reportsService.getDashboardSummary(user.organizationId);
  }
}
