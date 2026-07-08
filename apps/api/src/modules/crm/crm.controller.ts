import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CrmService } from './crm.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@Controller('crm')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('accounts')
  @AuditLog({ action: 'create', entity: 'Account' })
  createAccount(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAccountDto) {
    return this.crmService.createAccount(user.organizationId, dto);
  }

  @Get('accounts')
  findAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.crmService.findAccounts(user.organizationId);
  }

  @Get('accounts/:id')
  findAccount(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.crmService.findAccount(user.organizationId, id);
  }

  @Patch('accounts/:id')
  @AuditLog({ action: 'update', entity: 'Account' })
  updateAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.crmService.updateAccount(user.organizationId, id, dto);
  }

  @Post('proposals')
  @AuditLog({ action: 'create', entity: 'Proposal' })
  createProposal(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProposalDto) {
    return this.crmService.createProposal(user.organizationId, dto);
  }

  @Get('proposals')
  findProposals(@CurrentUser() user: AuthenticatedUser) {
    return this.crmService.findProposals(user.organizationId);
  }

  @Get('proposals/:id')
  findProposal(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.crmService.findProposal(user.organizationId, id);
  }

  @Patch('proposals/:id')
  @AuditLog({ action: 'update', entity: 'Proposal' })
  updateProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.crmService.updateProposal(user.organizationId, id, dto);
  }

  @Post('pipelines')
  @AuditLog({ action: 'create', entity: 'Pipeline' })
  createPipeline(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePipelineDto) {
    return this.crmService.createPipeline(user.organizationId, dto);
  }

  @Get('pipelines')
  findPipelines(@CurrentUser() user: AuthenticatedUser) {
    return this.crmService.findPipelines(user.organizationId);
  }

  @Get('pipelines/:id')
  findPipeline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.crmService.findPipeline(user.organizationId, id);
  }

  @Patch('pipelines/:id/stage')
  @AuditLog({ action: 'update', entity: 'Pipeline' })
  updatePipelineStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    return this.crmService.updatePipelineStage(user.organizationId, id, dto);
  }
}
