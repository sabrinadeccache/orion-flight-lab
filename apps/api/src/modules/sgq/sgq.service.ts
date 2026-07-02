import { Injectable } from '@nestjs/common';
import { Audit, AuditProgram, CorrectiveAction, NonConformity } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAuditProgramDto } from './dto/create-audit-program.dto';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CreateNonConformityDto } from './dto/create-non-conformity.dto';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';

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

  createAudit(organizationId: string, dto: CreateAuditDto): Promise<Audit> {
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

  createNonConformity(
    organizationId: string,
    dto: CreateNonConformityDto,
  ): Promise<NonConformity> {
    return this.prisma.nonConformity.create({ data: { organization_id: organizationId, ...dto } });
  }

  findNonConformities(organizationId: string): Promise<NonConformity[]> {
    return this.prisma.nonConformity.findMany({
      where: { organization_id: organizationId, deleted_at: null },
    });
  }

  createCorrectiveAction(
    organizationId: string,
    dto: CreateCorrectiveActionDto,
  ): Promise<CorrectiveAction> {
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
}
