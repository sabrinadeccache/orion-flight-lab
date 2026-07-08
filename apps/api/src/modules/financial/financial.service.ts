import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Charge, Delinquency, Payment } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async createCharge(organizationId: string, dto: CreateChargeDto): Promise<Charge> {
    await this.assertExists(
      () =>
        this.prisma.client.findFirst({
          where: { id: dto.client_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Client',
    );
    if (dto.contract_id) {
      await this.assertExists(
        () =>
          this.prisma.contract.findFirst({
            where: { id: dto.contract_id, organization_id: organizationId, deleted_at: null },
            select: { id: true },
          }),
        'Contract',
      );
    }
    return this.prisma.charge.create({
      data: {
        organization_id: organizationId,
        client_id: dto.client_id,
        contract_id: dto.contract_id,
        description: dto.description,
        amount: dto.amount,
        due_date: new Date(dto.due_date),
      },
    });
  }

  findCharges(organizationId: string) {
    return this.prisma.charge.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async findCharge(organizationId: string, id: string) {
    const charge = await this.prisma.charge.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        client: { select: { id: true, name: true } },
        payments: { where: { deleted_at: null } },
      },
    });
    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    const totalPaid = charge.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Number(charge.amount) - totalPaid;

    return { ...charge, totalPaid, remaining, isFullyPaid: remaining <= 0 };
  }

  async updateCharge(organizationId: string, id: string, dto: UpdateChargeDto): Promise<Charge> {
    await this.assertExists(
      () =>
        this.prisma.charge.findFirst({
          where: { id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Charge',
    );
    return this.prisma.charge.update({
      where: { id },
      data: {
        description: dto.description,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        status: dto.status,
      },
    });
  }

  /** RN-31: a payment can't push the charge's total paid past its amount. */
  async createPayment(organizationId: string, dto: CreatePaymentDto): Promise<Payment> {
    const charge = await this.prisma.charge.findFirst({
      where: { id: dto.charge_id, organization_id: organizationId, deleted_at: null },
      include: { payments: { where: { deleted_at: null } } },
    });
    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    const alreadyPaid = charge.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalAfterPayment = alreadyPaid + dto.amount;
    if (totalAfterPayment > Number(charge.amount)) {
      throw new BadRequestException(
        `Payment would exceed the charge amount (already paid ${alreadyPaid}, charge is ${charge.amount}) (RN-31)`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: { organization_id: organizationId, ...dto },
    });

    if (totalAfterPayment === Number(charge.amount)) {
      await this.prisma.charge.update({ where: { id: charge.id }, data: { status: 'paga' } });
    }

    return payment;
  }

  findDelinquencies(organizationId: string): Promise<Delinquency[]> {
    return this.prisma.delinquency.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      include: { charge: true },
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
