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

  /**
   * Not role-restricted: this is consumed by the main '/dashboard' homepage,
   * which is open to any authenticated staff role (not gated in
   * apps/web/src/middleware.ts ROUTE_ROLES). The '/reports' frontend route
   * listed there is a separate static placeholder page that doesn't call
   * this endpoint — its ROUTE_ROLES entry has no backend counterpart yet.
   */
  @Get('dashboard-summary')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  getDashboardSummary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummary> {
    return this.reportsService.getDashboardSummary(user.organizationId);
  }
}
