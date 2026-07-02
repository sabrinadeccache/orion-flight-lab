import { Injectable } from '@nestjs/common';
import { Contract, ContractAmendment, Plan, Subscription } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractAmendmentDto } from './dto/create-contract-amendment.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  createContract(organizationId: string, dto: CreateContractDto): Promise<Contract> {
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

  createAmendment(
    organizationId: string,
    dto: CreateContractAmendmentDto,
  ): Promise<ContractAmendment> {
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

  createSubscription(organizationId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
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
}
