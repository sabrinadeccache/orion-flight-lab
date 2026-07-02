import { Injectable } from '@nestjs/common';
import { Charge, Delinquency, Payment } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  createCharge(organizationId: string, dto: CreateChargeDto): Promise<Charge> {
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

  findCharges(organizationId: string): Promise<Charge[]> {
    return this.prisma.charge.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  createPayment(organizationId: string, dto: CreatePaymentDto): Promise<Payment> {
    return this.prisma.payment.create({
      data: { organization_id: organizationId, ...dto },
    });
  }

  findDelinquencies(organizationId: string): Promise<Delinquency[]> {
    return this.prisma.delinquency.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      include: { charge: true },
    });
  }
}
