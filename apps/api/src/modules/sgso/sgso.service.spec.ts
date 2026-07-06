import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SgsoService } from './sgso.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const ORG_ID = 'org-1';

describe('SgsoService', () => {
  let service: SgsoService;
  let prisma: {
    hazard: { findFirst: jest.Mock };
    risk: { findFirst: jest.Mock; update: jest.Mock };
    safetyOccurrence: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      hazard: { findFirst: jest.fn() },
      risk: { findFirst: jest.fn(), update: jest.fn() },
      safetyOccurrence: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [SgsoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SgsoService);
  });

  describe('RN-27: a high-level risk needs a mitigation before it can be accepted/mitigated', () => {
    it('blocks accepting a high risk (probability x severity >= 15) with zero mitigations', async () => {
      prisma.risk.findFirst.mockResolvedValue({
        id: 'risk-1',
        probability: 5,
        severity: 5,
        mitigations: [],
      });

      await expect(
        service.updateRiskStatus(ORG_ID, 'risk-1', { status: 'aceito' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.risk.update).not.toHaveBeenCalled();
    });

    it('allows accepting a high risk once a mitigation is registered', async () => {
      prisma.risk.findFirst.mockResolvedValue({
        id: 'risk-1',
        probability: 5,
        severity: 5,
        mitigations: [{ id: 'mitigation-1' }],
      });
      prisma.risk.update.mockResolvedValue({ id: 'risk-1', status: 'aceito' });

      const result = await service.updateRiskStatus(ORG_ID, 'risk-1', { status: 'aceito' });

      expect(result).toEqual({ id: 'risk-1', status: 'aceito' });
    });

    it('allows accepting a low risk with zero mitigations', async () => {
      prisma.risk.findFirst.mockResolvedValue({
        id: 'risk-2',
        probability: 1,
        severity: 2,
        mitigations: [],
      });
      prisma.risk.update.mockResolvedValue({ id: 'risk-2', status: 'aceito' });

      const result = await service.updateRiskStatus(ORG_ID, 'risk-2', { status: 'aceito' });

      expect(result).toEqual({ id: 'risk-2', status: 'aceito' });
    });

    it('throws NotFoundException for a risk outside the organization', async () => {
      prisma.risk.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRiskStatus(ORG_ID, 'risk-1', { status: 'aceito' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('RN-28: "alta"/"critica" severity occurrences require a linked hazard', () => {
    it('blocks a high severity occurrence with no hazard_id', async () => {
      await expect(
        service.createSafetyOccurrence(ORG_ID, {
          description: 'Ocorrência grave',
          occurred_at: '2026-01-01',
          severity: 'alta',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.safetyOccurrence.create).not.toHaveBeenCalled();
    });

    it('is case-insensitive on severity ("CRITICA" also blocks)', async () => {
      await expect(
        service.createSafetyOccurrence(ORG_ID, {
          description: 'Ocorrência grave',
          occurred_at: '2026-01-01',
          severity: 'CRITICA',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows a high severity occurrence when a hazard_id is linked', async () => {
      prisma.hazard.findFirst.mockResolvedValue({ id: 'hazard-1' });
      prisma.safetyOccurrence.create.mockResolvedValue({ id: 'occurrence-1' });

      const result = await service.createSafetyOccurrence(ORG_ID, {
        description: 'Ocorrência grave',
        occurred_at: '2026-01-01',
        severity: 'alta',
        hazard_id: 'hazard-1',
      });

      expect(result).toEqual({ id: 'occurrence-1' });
    });

    it('allows a low severity occurrence with no hazard_id at all', async () => {
      prisma.safetyOccurrence.create.mockResolvedValue({ id: 'occurrence-2' });

      const result = await service.createSafetyOccurrence(ORG_ID, {
        description: 'Ocorrência leve',
        occurred_at: '2026-01-01',
        severity: 'baixa',
      });

      expect(result).toEqual({ id: 'occurrence-2' });
    });
  });
});
