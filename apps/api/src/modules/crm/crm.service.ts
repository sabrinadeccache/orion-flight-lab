import { Injectable } from '@nestjs/common';
import { Account, Pipeline, Proposal } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  createAccount(organizationId: string, dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({ data: { organization_id: organizationId, ...dto } });
  }

  findAccounts(organizationId: string): Promise<Account[]> {
    return this.prisma.account.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  createProposal(organizationId: string, dto: CreateProposalDto): Promise<Proposal> {
    return this.prisma.proposal.create({
      data: {
        organization_id: organizationId,
        client_id: dto.client_id,
        account_id: dto.account_id,
        title: dto.title,
        value: dto.value,
        valid_until: dto.valid_until ? new Date(dto.valid_until) : undefined,
      },
    });
  }

  findProposals(organizationId: string): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  createPipeline(organizationId: string, dto: CreatePipelineDto): Promise<Pipeline> {
    return this.prisma.pipeline.create({
      data: {
        organization_id: organizationId,
        name: dto.name,
        stage: dto.stage,
        proposal_id: dto.proposal_id,
        expected_close_date: dto.expected_close_date ? new Date(dto.expected_close_date) : undefined,
      },
    });
  }

  findPipelines(organizationId: string): Promise<Pipeline[]> {
    return this.prisma.pipeline.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }
}
