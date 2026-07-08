import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Hazard, Mitigation, Risk, SafetyOccurrence } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { CreateRiskDto } from './dto/create-risk.dto';
import { CreateMitigationDto } from './dto/create-mitigation.dto';
import { CreateSafetyOccurrenceDto } from './dto/create-safety-occurrence.dto';
import { UpdateRiskStatusDto } from './dto/update-risk-status.dto';
import { UpdateHazardDto } from './dto/update-hazard.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

/** RN-27: probability x severity >= this, on the 5x5 matrix, is a "high" risk. */
const HIGH_RISK_THRESHOLD = 15;
/** RN-28: severities that mandate a linked hazard for reactive SMS investigation. */
const MANDATORY_HAZARD_SEVERITIES = ['alta', 'critica'];

@Injectable()
export class SgsoService {
  constructor(private readonly prisma: PrismaService) {}

  createHazard(organizationId: string, dto: CreateHazardDto): Promise<Hazard> {
    return this.prisma.hazard.create({ data: { organization_id: organizationId, ...dto } });
  }

  findHazards(organizationId: string): Promise<Hazard[]> {
    return this.prisma.hazard.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async findHazard(organizationId: string, id: string) {
    const hazard = await this.prisma.hazard.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { risks: { where: { deleted_at: null } } },
    });
    if (!hazard) {
      throw new NotFoundException('Hazard not found');
    }
    return hazard;
  }

  async updateHazard(organizationId: string, id: string, dto: UpdateHazardDto): Promise<Hazard> {
    await this.assertExists(
      () =>
        this.prisma.hazard.findFirst({
          where: { id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Hazard',
    );
    return this.prisma.hazard.update({ where: { id }, data: dto });
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

  async findRisk(organizationId: string, id: string) {
    const risk = await this.prisma.risk.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        mitigations: { where: { deleted_at: null } },
        hazard: { select: { id: true, description: true } },
      },
    });
    if (!risk) {
      throw new NotFoundException('Risk not found');
    }

    const isHighRisk = risk.probability * risk.severity >= HIGH_RISK_THRESHOLD;
    const canChangeStatus = !isHighRisk || risk.mitigations.length > 0;

    return { ...risk, isHighRisk, canChangeStatus };
  }

  async updateRisk(organizationId: string, id: string, dto: UpdateRiskDto): Promise<Risk> {
    const risk = await this.prisma.risk.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      select: { id: true, probability: true, severity: true },
    });
    if (!risk) {
      throw new NotFoundException('Risk not found');
    }

    const probability = dto.probability ?? risk.probability;
    const severity = dto.severity ?? risk.severity;

    return this.prisma.risk.update({
      where: { id },
      data: { probability, severity, risk_level: String(probability * severity) },
    });
  }

  /**
   * RN-27: a high-risk (probability x severity >= 15) can only move to
   * "aceito"/"mitigado" once at least one mitigation has been registered.
   */
  async updateRiskStatus(
    organizationId: string,
    id: string,
    dto: UpdateRiskStatusDto,
  ): Promise<Risk> {
    const risk = await this.prisma.risk.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { mitigations: { where: { deleted_at: null } } },
    });
    if (!risk) {
      throw new NotFoundException('Risk not found');
    }

    const isHighRisk = risk.probability * risk.severity >= HIGH_RISK_THRESHOLD;
    if (isHighRisk && risk.mitigations.length === 0) {
      throw new BadRequestException(
        'Cannot accept/mitigate a high-level risk without a registered mitigation (RN-27)',
      );
    }

    return this.prisma.risk.update({ where: { id }, data: { status: dto.status } });
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

  /** RN-28: "alta"/"critica" severity occurrences must link a hazard for reactive SMS investigation. */
  async createSafetyOccurrence(
    organizationId: string,
    dto: CreateSafetyOccurrenceDto,
  ): Promise<SafetyOccurrence> {
    const severity = dto.severity?.toLowerCase();
    if (severity && MANDATORY_HAZARD_SEVERITIES.includes(severity) && !dto.hazard_id) {
      throw new BadRequestException(
        'Occurrences of "alta"/"critica" severity must link a hazard for investigation (RN-28)',
      );
    }

    if (dto.hazard_id) {
      await this.assertExists(
        () =>
          this.prisma.hazard.findFirst({
            where: { id: dto.hazard_id, organization_id: organizationId, deleted_at: null },
            select: { id: true },
          }),
        'Hazard',
      );
    }

    return this.prisma.safetyOccurrence.create({
      data: {
        organization_id: organizationId,
        description: dto.description,
        occurred_at: new Date(dto.occurred_at),
        severity: dto.severity,
        hazard_id: dto.hazard_id,
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
