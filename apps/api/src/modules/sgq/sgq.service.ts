import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Audit, AuditProgram, CorrectiveAction, NonConformity } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAuditProgramDto } from './dto/create-audit-program.dto';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CreateNonConformityDto } from './dto/create-non-conformity.dto';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateAuditProgramDto } from './dto/update-audit-program.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';

@Injectable()
export class SgqService {
  constructor(private readonly prisma: PrismaService) {}

  createAuditProgram(organizationId: string, dto: CreateAuditProgramDto): Promise<AuditProgram> {
    return this.prisma.auditProgram.create({ data: { organization_id: organizationId, ...dto } });
  }

  findAuditPrograms(organizationId: string): Promise<AuditProgram[]> {
    return this.prisma.auditProgram.findMany({
      where: { organization_id: organizationId, deleted_at: null },
    });
  }

  async findAuditProgram(organizationId: string, id: string) {
    const auditProgram = await this.prisma.auditProgram.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { audits: { where: { deleted_at: null } } },
    });
    if (!auditProgram) {
      throw new NotFoundException('Audit program not found');
    }
    return auditProgram;
  }

  async updateAuditProgram(
    organizationId: string,
    id: string,
    dto: UpdateAuditProgramDto,
  ): Promise<AuditProgram> {
    await this.assertExists(
      () =>
        this.prisma.auditProgram.findFirst({
          where: { id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Audit program',
    );
    return this.prisma.auditProgram.update({ where: { id }, data: dto });
  }

  async createAudit(organizationId: string, dto: CreateAuditDto): Promise<Audit> {
    await this.assertExists(
      () =>
        this.prisma.auditProgram.findFirst({
          where: { id: dto.audit_program_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Audit program',
    );
    return this.prisma.audit.create({
      data: {
        organization_id: organizationId,
        audit_program_id: dto.audit_program_id,
        scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
        auditor: dto.auditor,
        scope: dto.scope,
      },
    });
  }

  findAudits(organizationId: string): Promise<Audit[]> {
    return this.prisma.audit.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async findAudit(organizationId: string, id: string) {
    const audit = await this.prisma.audit.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        nonConformities: { where: { deleted_at: null } },
        auditProgram: { select: { id: true, year: true } },
      },
    });
    if (!audit) {
      throw new NotFoundException('Audit not found');
    }
    return audit;
  }

  async updateAudit(organizationId: string, id: string, dto: UpdateAuditDto): Promise<Audit> {
    await this.assertExists(
      () =>
        this.prisma.audit.findFirst({
          where: { id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Audit',
    );
    return this.prisma.audit.update({
      where: { id },
      data: {
        scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
        auditor: dto.auditor,
        scope: dto.scope,
      },
    });
  }

  async createNonConformity(
    organizationId: string,
    dto: CreateNonConformityDto,
  ): Promise<NonConformity> {
    await this.assertExists(
      () =>
        this.prisma.audit.findFirst({
          where: { id: dto.audit_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Audit',
    );
    return this.prisma.nonConformity.create({ data: { organization_id: organizationId, ...dto } });
  }

  findNonConformities(organizationId: string): Promise<NonConformity[]> {
    return this.prisma.nonConformity.findMany({
      where: { organization_id: organizationId, deleted_at: null },
    });
  }

  async findNonConformity(organizationId: string, id: string) {
    const nonConformity = await this.prisma.nonConformity.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: {
        correctiveActions: { where: { deleted_at: null } },
        audit: { select: { id: true, scope: true } },
      },
    });
    if (!nonConformity) {
      throw new NotFoundException('Non-conformity not found');
    }

    const canClose =
      nonConformity.correctiveActions.length > 0 &&
      nonConformity.correctiveActions.every((action) => action.status === 'concluida');

    return { ...nonConformity, canClose };
  }

  /**
   * RN-25: a non-conformity can only be closed once every corrective action
   * linked to it has been completed — and at least one must exist.
   */
  async closeNonConformity(organizationId: string, id: string): Promise<NonConformity> {
    const nonConformity = await this.prisma.nonConformity.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { correctiveActions: { where: { deleted_at: null } } },
    });
    if (!nonConformity) {
      throw new NotFoundException('Non-conformity not found');
    }

    const hasOpenActions = nonConformity.correctiveActions.some(
      (action) => action.status !== 'concluida',
    );
    if (nonConformity.correctiveActions.length === 0 || hasOpenActions) {
      throw new BadRequestException(
        'Cannot close non-conformity: it has no completed corrective action covering it (RN-25)',
      );
    }

    return this.prisma.nonConformity.update({ where: { id }, data: { status: 'fechada' } });
  }

  /** RN-26: a corrective action cannot be created already past its own due date. */
  async createCorrectiveAction(
    organizationId: string,
    dto: CreateCorrectiveActionDto,
  ): Promise<CorrectiveAction> {
    await this.assertExists(
      () =>
        this.prisma.nonConformity.findFirst({
          where: { id: dto.non_conformity_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Non-conformity',
    );

    if (dto.due_date && new Date(dto.due_date) < new Date()) {
      throw new BadRequestException('Corrective action due date cannot be in the past (RN-26)');
    }

    return this.prisma.correctiveAction.create({
      data: {
        organization_id: organizationId,
        non_conformity_id: dto.non_conformity_id,
        description: dto.description,
        responsible: dto.responsible,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
      },
    });
  }

  /** Marks a corrective action complete — precondition for RN-25. */
  async completeCorrectiveAction(organizationId: string, id: string): Promise<CorrectiveAction> {
    const action = await this.prisma.correctiveAction.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!action) {
      throw new NotFoundException('Corrective action not found');
    }

    return this.prisma.correctiveAction.update({
      where: { id },
      data: { status: 'concluida', closed_at: new Date() },
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
