import { Controller, Get, UseGuards } from '@nestjs/common';
import { Course } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.trainingService.name() };
  }

  @Get('courses')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findCourses(@CurrentUser() user: AuthenticatedUser): Promise<Course[]> {
    return this.trainingService.findCourses(user.organizationId);
  }
}
