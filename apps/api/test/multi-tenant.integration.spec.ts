import { NotFoundException } from '@nestjs/common';
import { AcademicService } from '../src/modules/academic/academic.service';
import { SgsoService } from '../src/modules/sgso/sgso.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { StorageService } from '../src/common/storage/storage.service';
import { SupabaseAdminService } from '../src/common/supabase-admin/supabase-admin.service';

/**
 * Runs against a real, ephemeral Postgres (see .github/workflows/ci.yml) with
 * `prisma migrate deploy` applied — never the Supabase project used for
 * manual validation (see CLAUDE.md §11/§15). Skipped locally unless
 * DATABASE_URL is set, since it needs a real database to talk to.
 *
 * This exercises the exact bug class found in production (CLAUDE.md §13.9:
 * systemic IDOR) with the real Prisma client, not a mock — creating an
 * entity while pretending to be organization B, but pointing at a parent
 * resource that actually belongs to organization A, must be rejected.
 */
const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('multi-tenant isolation (integration)', () => {
  let prisma: PrismaService;
  let academicService: AcademicService;
  let sgsoService: SgsoService;

  let orgA: { id: string };
  let orgB: { id: string };

  beforeAll(async () => {
    prisma = new PrismaService();
    academicService = new AcademicService(prisma, {} as StorageService, {} as SupabaseAdminService);
    sgsoService = new SgsoService(prisma);

    orgA = await prisma.organization.create({
      data: {
        name: 'Multi-tenant Test Org A',
        cnpj: '11111111000101',
        anac_ctac_code: 'ANAC-TEST-A',
      },
    });
    orgB = await prisma.organization.create({
      data: {
        name: 'Multi-tenant Test Org B',
        cnpj: '22222222000102',
        anac_ctac_code: 'ANAC-TEST-B',
      },
    });
  });

  afterAll(async () => {
    await prisma.risk.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.hazard.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.enrollment.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.course.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.curriculum.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.trainingProgram.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.student.deleteMany({ where: { organization_id: { in: [orgA.id, orgB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prisma.$disconnect();
  });

  it('rejects creating a Risk against another organization\'s Hazard', async () => {
    const hazardInOrgA = await prisma.hazard.create({
      data: { organization_id: orgA.id, description: 'Hazard pertencente à org A' },
    });

    await expect(
      sgsoService.createRisk(orgB.id, { hazard_id: hazardInOrgA.id, probability: 3, severity: 3 }),
    ).rejects.toThrow(NotFoundException);

    const leaked = await prisma.risk.findFirst({ where: { hazard_id: hazardInOrgA.id } });
    expect(leaked).toBeNull();
  });

  it('rejects enrolling another organization\'s Student into a Course', async () => {
    const studentInOrgA = await prisma.student.create({
      data: { organization_id: orgA.id, full_name: 'Aluno Org A', cpf: '11122233344' },
    });

    const trainingProgram = await prisma.trainingProgram.create({
      data: { organization_id: orgB.id, name: 'Programa Org B', code: 'PROG-B' },
    });
    const curriculum = await prisma.curriculum.create({
      data: {
        organization_id: orgB.id,
        training_program_id: trainingProgram.id,
        name: 'Curriculo Org B',
        version: 'v1',
      },
    });
    const courseInOrgB = await prisma.course.create({
      data: {
        organization_id: orgB.id,
        curriculum_id: curriculum.id,
        name: 'Curso Org B',
        code: 'CRS-B',
      },
    });

    await expect(
      academicService.createEnrollment(orgB.id, {
        student_id: studentInOrgA.id,
        course_id: courseInOrgB.id,
      }),
    ).rejects.toThrow(NotFoundException);

    const leaked = await prisma.enrollment.findFirst({ where: { student_id: studentInOrgA.id } });
    expect(leaked).toBeNull();
  });
});
