import { Injectable, NotFoundException } from '@nestjs/common';
import { Hazard, Mitigation, Risk, SafetyOccurrence } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { CreateRiskDto } from './dto/create-risk.dto';
import { CreateMitigationDto } from './dto/create-mitigation.dto';
import { CreateSafetyOccurrenceDto } from './dto/create-safety-occurrence.dto';

@Injectable()
export class SgsoService {
  constructor(private readonly prisma: PrismaService) {}

  createHazard(organizationId: string, dto: CreateHazardDto): Promise<Hazard> {
    return this.prisma.hazard.create({ data: { organization_id: organizationId, ...dto } });
  }

  findHazards(organizationId: string): Promise<Hazard[]> {
    return this.prisma.hazard.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async createRisk(organizationId: string, dto: CreateRiskDto): Promise<Risk> {
    await this.assertExists(
      () =>
        this.prisma.hazard.findFirst({
          where: { id: dto.hazard_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Hazard',
    );
    const riskLevel = dto.probability * dto.severity;
    return this.prisma.risk.create({
      data: { organization_id: organizationId, ...dto, risk_level: String(riskLevel) },
    });
  }

  findRisks(organizationId: string): Promise<Risk[]> {
    return this.prisma.risk.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async createMitigation(organizationId: string, dto: CreateMitigationDto): Promise<Mitigation> {
    await this.assertExists(
      () =>
        this.prisma.risk.findFirst({
          where: { id: dto.risk_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Risk',
    );
    return this.prisma.mitigation.create({ data: { organization_id: organizationId, ...dto } });
  }

  createSafetyOccurrence(
    organizationId: string,
    dto: CreateSafetyOccurrenceDto,
  ): Promise<SafetyOccurrence> {
    return this.prisma.safetyOccurrence.create({
      data: {
        organization_id: organizationId,
        description: dto.description,
        occurred_at: new Date(dto.occurred_at),
        severity: dto.severity,
      },
    });
  }

  findSafetyOccurrences(organizationId: string): Promise<SafetyOccurrence[]> {
    return this.prisma.safetyOccurrence.findMany({
      where: { organization_id: organizationId, deleted_at: null },
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
