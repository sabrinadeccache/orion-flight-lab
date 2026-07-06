import { Test } from '@nestjs/testing';
import { FinancialCron } from './financial.cron';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('FinancialCron', () => {
  let cron: FinancialCron;
  let prisma: {
    charge: { findMany: jest.Mock };
    delinquency: { create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      charge: { findMany: jest.fn() },
      delinquency: { create: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [FinancialCron, { provide: PrismaService, useValue: prisma }],
    }).compile();

    cron = module.get(FinancialCron);
  });

  describe('RN-32: daily overdue-charge sweep', () => {
    it('creates a new Delinquency for a charge with none yet', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10);
      prisma.charge.findMany.mockResolvedValue([
        { id: 'charge-1', organization_id: 'org-1', due_date: dueDate, delinquencies: [] },
      ]);

      await cron.checkOverdueCharges();

      expect(prisma.delinquency.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            charge_id: 'charge-1',
            organization_id: 'org-1',
            days_overdue: 10,
          }),
        }),
      );
      expect(prisma.delinquency.update).not.toHaveBeenCalled();
    });

    it('updates days_overdue on an existing Delinquency instead of duplicating it', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 20);
      prisma.charge.findMany.mockResolvedValue([
        {
          id: 'charge-1',
          organization_id: 'org-1',
          due_date: dueDate,
          delinquencies: [{ id: 'delinquency-1' }],
        },
      ]);

      await cron.checkOverdueCharges();

      expect(prisma.delinquency.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'delinquency-1' },
          data: expect.objectContaining({ days_overdue: 20 }),
        }),
      );
      expect(prisma.delinquency.create).not.toHaveBeenCalled();
    });

    it('does nothing when there are no overdue charges', async () => {
      prisma.charge.findMany.mockResolvedValue([]);

      await cron.checkOverdueCharges();

      expect(prisma.delinquency.create).not.toHaveBeenCalled();
      expect(prisma.delinquency.update).not.toHaveBeenCalled();
    });
  });
});
