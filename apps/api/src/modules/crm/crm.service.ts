import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Account, Pipeline, Proposal } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

/** RN-30: a pipeline can't be marked won on an expired or declined proposal. */
const WON_STAGE = 'ganho';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(organizationId: string, dto: CreateAccountDto): Promise<Account> {
    await this.assertExists(
      () =>
        this.prisma.client.findFirst({
          where: { id: dto.client_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Client',
    );
    return this.prisma.account.create({ data: { organization_id: organizationId, ...dto } });
  }

  findAccounts(organizationId: string) {
    return this.prisma.account.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async findAccount(organizationId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        client: { select: { id: true, name: true } },
        proposals: { where: { deleted_at: null } },
      },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async updateAccount(organizationId: string, id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.assertExists(
      () =>
        this.prisma.account.findFirst({
          where: { id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Account',
    );
    return this.prisma.account.update({ where: { id }, data: dto });
  }

  async createProposal(organizationId: string, dto: CreateProposalDto): Promise<Proposal> {
    await this.assertExists(
      () =>
        this.prisma.client.findFirst({
          where: { id: dto.client_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Client',
    );
    if (dto.account_id) {
      await this.assertExists(
        () =>
          this.prisma.account.findFirst({
            where: { id: dto.account_id, organization_id: organizationId, deleted_at: null },
            select: { id: true },
          }),
        'Account',
      );
    }
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

  findProposals(organizationId: string) {
    return this.prisma.proposal.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async findProposal(organizationId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        client: { select: { id: true, name: true } },
        account: { select: { id: true } },
        pipelines: { where: { deleted_at: null } },
      },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return proposal;
  }

  async updateProposal(organizationId: string, id: string, dto: UpdateProposalDto): Promise<Proposal> {
    await this.assertExists(
      () =>
        this.prisma.proposal.findFirst({
          where: { id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Proposal',
    );
    return this.prisma.proposal.update({
      where: { id },
      data: {
        title: dto.title,
        value: dto.value,
        status: dto.status,
        valid_until: dto.valid_until ? new Date(dto.valid_until) : undefined,
      },
    });
  }

  async createPipeline(organizationId: string, dto: CreatePipelineDto): Promise<Pipeline> {
    await this.assertExists(
      () =>
        this.prisma.proposal.findFirst({
          where: { id: dto.proposal_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Proposal',
    );
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

  async findPipeline(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        proposal: { select: { id: true, title: true, status: true, valid_until: true } },
      },
    });
    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }
    return pipeline;
  }

  /** RN-30: winning a pipeline requires its proposal to still be open and unexpired. */
  async updatePipelineStage(
    organizationId: string,
    id: string,
    dto: UpdatePipelineStageDto,
  ): Promise<Pipeline> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { proposal: true },
    });
    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (dto.stage === WON_STAGE && pipeline.proposal) {
      const isExpired = pipeline.proposal.valid_until && pipeline.proposal.valid_until < new Date();
      if (isExpired || pipeline.proposal.status === 'recusada') {
        throw new BadRequestException(
          'Cannot mark pipeline as won: linked proposal is expired or declined (RN-30)',
        );
      }
    }

    return this.prisma.pipeline.update({ where: { id }, data: { stage: dto.stage } });
  }

  /** Prevents linking a record to another organization's parent entity. */
  private async assertExists(
    finder: () => Promise<{ id: string } | null>,
    label: string,
  ): Promise<void> {
    const record = await finder();
    if (!record) throw new NotFoundException(`${label} not found`);
  }
}
