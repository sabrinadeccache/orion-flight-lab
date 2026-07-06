import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const ORG_ID = 'org-1';
const SUBSCRIPTION_DTO = {
  contract_id: 'contract-1',
  plan_id: 'plan-1',
  start_date: '2026-01-01',
};

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: {
    contract: { findFirst: jest.Mock };
    plan: { findFirst: jest.Mock };
    subscription: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      contract: { findFirst: jest.fn() },
      plan: { findFirst: jest.fn() },
      subscription: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [ContractsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ContractsService);
  });

  describe('RN-29: a subscription can only be created against an active contract', () => {
    it('blocks creating a subscription for a non-"ativo" contract', async () => {
      prisma.contract.findFirst.mockResolvedValue({ id: 'contract-1', status: 'encerrado' });

      await expect(service.createSubscription(ORG_ID, SUBSCRIPTION_DTO)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('allows creating a subscription for an "ativo" contract', async () => {
      prisma.contract.findFirst.mockResolvedValue({ id: 'contract-1', status: 'ativo' });
      prisma.plan.findFirst.mockResolvedValue({ id: 'plan-1' });
      prisma.subscription.create.mockResolvedValue({ id: 'subscription-1' });

      const result = await service.createSubscription(ORG_ID, SUBSCRIPTION_DTO);

      expect(result).toEqual({ id: 'subscription-1' });
    });

    it('throws NotFoundException for a contract outside the organization', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);

      await expect(service.createSubscription(ORG_ID, SUBSCRIPTION_DTO)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the plan does not belong to the organization', async () => {
      prisma.contract.findFirst.mockResolvedValue({ id: 'contract-1', status: 'ativo' });
      prisma.plan.findFirst.mockResolvedValue(null);

      await expect(service.createSubscription(ORG_ID, SUBSCRIPTION_DTO)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });
  });
});
