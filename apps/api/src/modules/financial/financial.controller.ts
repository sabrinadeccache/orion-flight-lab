import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { FinancialService } from './financial.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('financial')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
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
