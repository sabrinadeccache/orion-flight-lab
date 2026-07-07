import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Student } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller()
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class StudentsController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('students')
  @AuditLog({ action: 'create', entity: 'Student' })
  createStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentDto,
  ): Promise<Student> {
    return this.academicService.createStudent(user.organizationId, dto);
  }

  @Get('students')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Student[]> {
    return this.academicService.findStudents(user.organizationId);
  }

  @Get('students/:id/history')
  getHistory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academicService.getStudentHistory(user.organizationId, id);
  }

  @Get('students/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Student> {
    return this.academicService.findStudent(user.organizationId, id);
  }

  @Patch('students/:id')
  @AuditLog({ action: 'update', entity: 'Student' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<Student> {
    return this.academicService.updateStudent(user.organizationId, id, dto);
  }

  @Delete('students/:id')
  @AuditLog({ action: 'delete', entity: 'Student' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.academicService.deleteStudent(user.organizationId, id);
  }
}
