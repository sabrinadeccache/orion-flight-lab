import { Injectable } from '@nestjs/common';
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

  createRisk(organizationId: string, dto: CreateRiskDto): Promise<Risk> {
    const riskLevel = dto.probability * dto.severity;
    return this.prisma.risk.create({
      data: { organization_id: organizationId, ...dto, risk_level: String(riskLevel) },
    });
  }

  findRisks(organizationId: string): Promise<Risk[]> {
    return this.prisma.risk.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  createMitigation(organizationId: string, dto: CreateMitigationDto): Promise<Mitigation> {
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
}
