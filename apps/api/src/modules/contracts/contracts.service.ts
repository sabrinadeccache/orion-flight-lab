import { Injectable, NotFoundException } from '@nestjs/common';
import { Contract, ContractAmendment, Plan, Subscription } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractAmendmentDto } from './dto/create-contract-amendment.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async createContract(organizationId: string, dto: CreateContractDto): Promise<Contract> {
    await this.assertExists(
      () =>
        this.prisma.client.findFirst({
          where: { id: dto.client_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Client',
    );
    return this.prisma.contract.create({
      data: {
        organization_id: organizationId,
        client_id: dto.client_id,
        contract_number: dto.contract_number,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        value: dto.value,
      },
    });
  }

  findContracts(organizationId: string): Promise<Contract[]> {
    return this.prisma.contract.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async createAmendment(
    organizationId: string,
    dto: CreateContractAmendmentDto,
  ): Promise<ContractAmendment> {
    await this.assertExists(
      () =>
        this.prisma.contract.findFirst({
          where: { id: dto.contract_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Contract',
    );
    return this.prisma.contractAmendment.create({
      data: {
        organization_id: organizationId,
        contract_id: dto.contract_id,
        description: dto.description,
        effective_date: new Date(dto.effective_date),
      },
    });
  }

  createPlan(organizationId: string, dto: CreatePlanDto): Promise<Plan> {
    return this.prisma.plan.create({ data: { organization_id: organizationId, ...dto } });
  }

  findPlans(organizationId: string): Promise<Plan[]> {
    return this.prisma.plan.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async createSubscription(organizationId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    await this.assertExists(
      () =>
        this.prisma.contract.findFirst({
          where: { id: dto.contract_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Contract',
    );
    await this.assertExists(
      () =>
        this.prisma.plan.findFirst({
          where: { id: dto.plan_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Plan',
    );
    return this.prisma.subscription.create({
      data: {
        organization_id: organizationId,
        contract_id: dto.contract_id,
        plan_id: dto.plan_id,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
    });
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
