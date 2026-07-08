import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SgqService } from './sgq.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const ORG_ID = 'org-1';

describe('SgqService', () => {
  let service: SgqService;
  let prisma: {
    auditProgram: { findFirst: jest.Mock; update: jest.Mock };
    audit: { findFirst: jest.Mock; update: jest.Mock };
    nonConformity: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    correctiveAction: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      auditProgram: { findFirst: jest.fn(), update: jest.fn() },
      audit: { findFirst: jest.fn(), update: jest.fn() },
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

  describe('updateAuditProgram', () => {
    it('throws NotFoundException for a program outside the organization', async () => {
      prisma.auditProgram.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAuditProgram(ORG_ID, 'ap-1', { year: 2027 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.auditProgram.update).not.toHaveBeenCalled();
    });

    it('updates the program when found', async () => {
      prisma.auditProgram.findFirst.mockResolvedValue({ id: 'ap-1' });
      prisma.auditProgram.update.mockResolvedValue({ id: 'ap-1', year: 2027 });

      const result = await service.updateAuditProgram(ORG_ID, 'ap-1', { year: 2027 });

      expect(result).toEqual({ id: 'ap-1', year: 2027 });
    });
  });

  describe('updateAudit', () => {
    it('throws NotFoundException for an audit outside the organization', async () => {
      prisma.audit.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAudit(ORG_ID, 'audit-1', { scope: 'novo escopo' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.audit.update).not.toHaveBeenCalled();
    });

    it('updates the audit when found', async () => {
      prisma.audit.findFirst.mockResolvedValue({ id: 'audit-1' });
      prisma.audit.update.mockResolvedValue({ id: 'audit-1', scope: 'novo escopo' });

      const result = await service.updateAudit(ORG_ID, 'audit-1', { scope: 'novo escopo' });

      expect(result).toEqual({ id: 'audit-1', scope: 'novo escopo' });
    });
  });

  describe('findAuditProgram', () => {
    it('throws NotFoundException for a program outside the organization', async () => {
      prisma.auditProgram.findFirst.mockResolvedValue(null);

      await expect(service.findAuditProgram(ORG_ID, 'ap-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the program with its audits when found', async () => {
      prisma.auditProgram.findFirst.mockResolvedValue({ id: 'ap-1', audits: [{ id: 'audit-1' }] });

      const result = await service.findAuditProgram(ORG_ID, 'ap-1');

      expect(result).toEqual({ id: 'ap-1', audits: [{ id: 'audit-1' }] });
    });
  });

  describe('findAudit', () => {
    it('throws NotFoundException for an audit outside the organization', async () => {
      prisma.audit.findFirst.mockResolvedValue(null);

      await expect(service.findAudit(ORG_ID, 'audit-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the audit with its non-conformities when found', async () => {
      prisma.audit.findFirst.mockResolvedValue({ id: 'audit-1', nonConformities: [] });

      const result = await service.findAudit(ORG_ID, 'audit-1');

      expect(result).toEqual({ id: 'audit-1', nonConformities: [] });
    });
  });

  describe('findNonConformity: derived canClose flag (RN-25)', () => {
    it('throws NotFoundException for a non-conformity outside the organization', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue(null);

      await expect(service.findNonConformity(ORG_ID, 'nc-1')).rejects.toThrow(NotFoundException);
    });

    it('sets canClose=false when there are zero corrective actions', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue({ id: 'nc-1', correctiveActions: [] });

      const result = await service.findNonConformity(ORG_ID, 'nc-1');

      expect(result.canClose).toBe(false);
    });

    it('sets canClose=false while a corrective action is still pending', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue({
        id: 'nc-1',
        correctiveActions: [{ status: 'concluida' }, { status: 'pendente' }],
      });

      const result = await service.findNonConformity(ORG_ID, 'nc-1');

      expect(result.canClose).toBe(false);
    });

    it('sets canClose=true once every corrective action is completed', async () => {
      prisma.nonConformity.findFirst.mockResolvedValue({
        id: 'nc-1',
        correctiveActions: [{ status: 'concluida' }],
      });

      const result = await service.findNonConformity(ORG_ID, 'nc-1');

      expect(result.canClose).toBe(true);
    });
  });
});
