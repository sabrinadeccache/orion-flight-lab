import { Injectable } from '@nestjs/common';
import { Course } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  name(): string {
    return 'training';
  }

  findCourses(organizationId: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
  }
}
