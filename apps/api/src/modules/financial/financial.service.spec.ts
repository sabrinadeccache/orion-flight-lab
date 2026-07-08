import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FinancialService } from './financial.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const ORG_ID = 'org-1';

describe('FinancialService', () => {
  let service: FinancialService;
  let prisma: {
    charge: { findFirst: jest.Mock; update: jest.Mock };
    payment: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      charge: { findFirst: jest.fn(), update: jest.fn() },
      payment: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [FinancialService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FinancialService);
  });

  describe('findCharge', () => {
    it('computes totalPaid, remaining and isFullyPaid from the linked payments', async () => {
      prisma.charge.findFirst.mockResolvedValue({
        id: 'charge-1',
        amount: 1000,
        payments: [{ amount: 400 }, { amount: 200 }],
      });

      const result = await service.findCharge(ORG_ID, 'charge-1');

      expect(result).toMatchObject({ totalPaid: 600, remaining: 400, isFullyPaid: false });
    });

    it('marks isFullyPaid when payments cover the full amount', async () => {
      prisma.charge.findFirst.mockResolvedValue({
        id: 'charge-1',
        amount: 1000,
        payments: [{ amount: 1000 }],
      });

      const result = await service.findCharge(ORG_ID, 'charge-1');

      expect(result).toMatchObject({ totalPaid: 1000, remaining: 0, isFullyPaid: true });
    });

    it('throws NotFoundException for a charge outside the organization', async () => {
      prisma.charge.findFirst.mockResolvedValue(null);

      await expect(service.findCharge(ORG_ID, 'charge-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCharge', () => {
    it('throws NotFoundException for a charge outside the organization', async () => {
      prisma.charge.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCharge(ORG_ID, 'charge-1', { description: 'Nova descrição' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.charge.update).not.toHaveBeenCalled();
    });
  });

  describe("RN-31: a payment can't push a charge's total paid past its amount", () => {
    it('blocks a payment that would exceed the remaining balance', async () => {
      prisma.charge.findFirst.mockResolvedValue({ id: 'charge-1', amount: 1000, payments: [] });

      await expect(
        service.createPayment(ORG_ID, { charge_id: 'charge-1', amount: 1500 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('blocks a second payment that would push the total over the amount', async () => {
      prisma.charge.findFirst.mockResolvedValue({
        id: 'charge-1',
        amount: 1000,
        payments: [{ amount: 600 }],
      });

      await expect(
        service.createPayment(ORG_ID, { charge_id: 'charge-1', amount: 500 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows a partial payment and leaves the charge "pendente"', async () => {
      prisma.charge.findFirst.mockResolvedValue({ id: 'charge-1', amount: 1000, payments: [] });
      prisma.payment.create.mockResolvedValue({ id: 'payment-1' });

      const result = await service.createPayment(ORG_ID, { charge_id: 'charge-1', amount: 600 });

      expect(result).toEqual({ id: 'payment-1' });
      expect(prisma.charge.update).not.toHaveBeenCalled();
    });

    it('marks the charge "paga" once the payment exactly completes the amount', async () => {
      prisma.charge.findFirst.mockResolvedValue({
        id: 'charge-1',
        amount: 1000,
        payments: [{ amount: 600 }],
      });
      prisma.payment.create.mockResolvedValue({ id: 'payment-2' });

      await service.createPayment(ORG_ID, { charge_id: 'charge-1', amount: 400 });

      expect(prisma.charge.update).toHaveBeenCalledWith({
        where: { id: 'charge-1' },
        data: { status: 'paga' },
      });
    });

    it('throws NotFoundException for a charge outside the organization', async () => {
      prisma.charge.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayment(ORG_ID, { charge_id: 'charge-1', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
