import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CrmService } from './crm.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const ORG_ID = 'org-1';

describe('CrmService', () => {
  let service: CrmService;
  let prisma: {
    client: { findFirst: jest.Mock };
    account: { findFirst: jest.Mock; update: jest.Mock };
    proposal: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    pipeline: { findFirst: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      client: { findFirst: jest.fn() },
      account: { findFirst: jest.fn(), update: jest.fn() },
      proposal: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      pipeline: { findFirst: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [CrmService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CrmService);
  });

  describe('regression: createProposal must not require an Account when account_id is omitted', () => {
    it('creates a proposal with no account_id without ever checking for an Account', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      prisma.proposal.create.mockResolvedValue({ id: 'proposal-1' });

      const result = await service.createProposal(ORG_ID, {
        client_id: 'client-1',
        title: 'Proposta sem conta',
        value: 1000,
      });

      expect(result).toEqual({ id: 'proposal-1' });
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    });

    it('still validates the account when account_id is provided', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(
        service.createProposal(ORG_ID, {
          client_id: 'client-1',
          account_id: 'account-from-another-org',
          title: 'Proposta com conta inválida',
          value: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.proposal.create).not.toHaveBeenCalled();
    });
  });

  describe('RN-30: winning a pipeline requires its proposal to be open and unexpired', () => {
    it('blocks marking a pipeline "ganho" when the linked proposal is expired', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({
        id: 'pipeline-1',
        proposal: { valid_until: new Date('2020-01-01'), status: 'aberta' },
      });

      await expect(
        service.updatePipelineStage(ORG_ID, 'pipeline-1', { stage: 'ganho' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.pipeline.update).not.toHaveBeenCalled();
    });

    it('blocks marking a pipeline "ganho" when the linked proposal was declined', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({
        id: 'pipeline-1',
        proposal: { valid_until: null, status: 'recusada' },
      });

      await expect(
        service.updatePipelineStage(ORG_ID, 'pipeline-1', { stage: 'ganho' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows marking a pipeline "ganho" when the proposal is open and unexpired', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({
        id: 'pipeline-1',
        proposal: { valid_until: new Date('2099-01-01'), status: 'aberta' },
      });
      prisma.pipeline.update.mockResolvedValue({ id: 'pipeline-1', stage: 'ganho' });

      const result = await service.updatePipelineStage(ORG_ID, 'pipeline-1', { stage: 'ganho' });

      expect(result).toEqual({ id: 'pipeline-1', stage: 'ganho' });
    });

    it('allows any other stage transition regardless of the proposal state', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({
        id: 'pipeline-1',
        proposal: { valid_until: new Date('2020-01-01'), status: 'recusada' },
      });
      prisma.pipeline.update.mockResolvedValue({ id: 'pipeline-1', stage: 'negociacao' });

      const result = await service.updatePipelineStage(ORG_ID, 'pipeline-1', {
        stage: 'negociacao',
      });

      expect(result).toEqual({ id: 'pipeline-1', stage: 'negociacao' });
    });

    it('throws NotFoundException for a pipeline outside the organization', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePipelineStage(ORG_ID, 'pipeline-1', { stage: 'ganho' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccount', () => {
    it('throws NotFoundException for an account outside the organization', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAccount(ORG_ID, 'account-1', { status: 'inativo' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.account.update).not.toHaveBeenCalled();
    });
  });

  describe('updateProposal', () => {
    it('throws NotFoundException for a proposal outside the organization', async () => {
      prisma.proposal.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProposal(ORG_ID, 'proposal-1', { title: 'Nova proposta' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.proposal.update).not.toHaveBeenCalled();
    });
  });
});
