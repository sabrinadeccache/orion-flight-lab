import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@orion/shared';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { FinancialService } from './financial.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

/** Mirrors the '/financial' entry in apps/web/src/middleware.ts ROUTE_ROLES. */
@Controller('financial')
@UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
@Roles(Role.ADMIN, Role.FINANCEIRO)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('charges')
  @AuditLog({ action: 'create', entity: 'Charge' })
  createCharge(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateChargeDto) {
    return this.financialService.createCharge(user.organizationId, dto);
  }

  @Get('charges')
  findCharges(@CurrentUser() user: AuthenticatedUser) {
    return this.financialService.findCharges(user.organizationId);
  }

  @Get('charges/:id')
  findCharge(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.financialService.findCharge(user.organizationId, id);
  }

  @Patch('charges/:id')
  @AuditLog({ action: 'update', entity: 'Charge' })
  updateCharge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateChargeDto,
  ) {
    return this.financialService.updateCharge(user.organizationId, id, dto);
  }

  @Post('payments')
  @AuditLog({ action: 'create', entity: 'Payment' })
  createPayment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.financialService.createPayment(user.organizationId, dto);
  }

  @Get('delinquencies')
  findDelinquencies(@CurrentUser() user: AuthenticatedUser) {
    return this.financialService.findDelinquencies(user.organizationId);
  }
}
