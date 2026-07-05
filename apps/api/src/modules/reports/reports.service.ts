import { Injectable } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface DashboardSummary {
  activeStudents: number;
  activeCourses: number;
  instructors: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  name(): string {
    return 'reports';
  }

  async getDashboardSummary(organizationId: string): Promise<DashboardSummary> {
    const [activeStudents, activeCourses, instructors] = await Promise.all([
      this.prisma.student.count({
        where: { organization_id: organizationId, active: true, deleted_at: null },
      }),
      this.prisma.course.count({
        where: { organization_id: organizationId, status: CourseStatus.ATIVO, deleted_at: null },
      }),
      this.prisma.instructor.count({
        where: { organization_id: organizationId, active: true, deleted_at: null },
      }),
    ]);

    return { activeStudents, activeCourses, instructors };
  }
}
