import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SgqService } from './sgq.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const ORG_ID = 'org-1';

describe('SgqService', () => {
  let service: SgqService;
  let prisma: {
    nonConformity: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    correctiveAction: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      nonConformity: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      correctiveAction: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [SgqService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SgqService);
  });

  describe('RN-25: closing a non-conformity requires every corrective action completed', () => {
    it('blocks closing when there are zero corrective actions', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue({ id: 'nc-1', correctiveActions: [] });

      await expect(service.closeNonConformity(ORG_ID, 'nc-1')).rejects.toThrow(BadRequestException);
      expect(prisma.nonConformity.update).not.toHaveBeenCalled();
    });

    it('blocks closing while a corrective action is still pending', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue({
        id: 'nc-1',
        correctiveActions: [{ status: 'concluida' }, { status: 'pendente' }],
      });

      await expect(service.closeNonConformity(ORG_ID, 'nc-1')).rejects.toThrow(BadRequestException);
    });

    it('allows closing once every corrective action is completed', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue({
        id: 'nc-1',
        correctiveActions: [{ status: 'concluida' }],
      });
      prisma.nonConformity.update.mockResolvedValue({ id: 'nc-1', status: 'fechada' });

      const result = await service.closeNonConformity(ORG_ID, 'nc-1');

      expect(result).toEqual({ id: 'nc-1', status: 'fechada' });
    });

    it('throws NotFoundException for a non-conformity outside the organization', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue(null);

      await expect(service.closeNonConformity(ORG_ID, 'nc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('RN-26: a corrective action cannot be created already overdue', () => {
    beforeEach(() => {
      prisma.nonConformity.findFirst.mockResolvedValue({ id: 'nc-1' });
    });

    it('blocks creation with a due_date in the past', async () => {
      await expect(
        service.createCorrectiveAction(ORG_ID, {
          non_conformity_id: 'nc-1',
          description: 'Ação teste',
          due_date: '2020-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.correctiveAction.create).not.toHaveBeenCalled();
    });

    it('allows creation with a future due_date', async () => {
      prisma.correctiveAction.create.mockResolvedValue({ id: 'ca-1' });

      const result = await service.createCorrectiveAction(ORG_ID, {
        non_conformity_id: 'nc-1',
        description: 'Ação teste',
        due_date: '2099-01-01',
      });

      expect(result).toEqual({ id: 'ca-1' });
    });

    it('allows creation with no due_date at all', async () => {
      prisma.correctiveAction.create.mockResolvedValue({ id: 'ca-2' });

      const result = await service.createCorrectiveAction(ORG_ID, {
        non_conformity_id: 'nc-1',
        description: 'Ação teste',
      });

      expect(result).toEqual({ id: 'ca-2' });
    });
  });
});
