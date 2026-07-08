import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@orion/shared';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LmsService } from './lms.service';
import { MarkLessonProgressDto } from './dto/mark-lesson-progress.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { CreateQuizOptionDto } from './dto/create-quiz-option.dto';
import { UpdateQuizOptionDto } from './dto/update-quiz-option.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

/** Staff roles allowed to see a course's progress dashboard. */
const PROGRESS_VIEWER_ROLES = [Role.ADMIN, Role.COORDENADOR_ACADEMICO, Role.INSTRUTOR];
/** Staff roles allowed to author quizzes — same as course-content authors. */
const QUIZ_AUTHOR_ROLES = [Role.ADMIN, Role.COORDENADOR_ACADEMICO, Role.INSTRUTOR];

@Controller('lms')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('my-enrollments')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  getMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.lmsService.getMyEnrollments(user.organizationId, user.id);
  }

  @Get('enrollments/:id/content')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  getEnrollmentContent(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.getEnrollmentContent(user.organizationId, user.id, id);
  }

  @Post('lessons/:id/progress')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  @AuditLog({ action: 'update', entity: 'LessonProgress' })
  markLessonProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MarkLessonProgressDto,
  ) {
    return this.lmsService.markLessonProgress(user.organizationId, user.id, id, dto);
  }

  @Get('courses/:id/progress')
  @UseGuards(RolesGuard)
  @Roles(...PROGRESS_VIEWER_ROLES)
  getCourseProgress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.getCourseProgress(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // Quiz authoring (staff)
  // ---------------------------------------------------------------------

  @Post('quizzes')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'Quiz' })
  createQuiz(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuizDto) {
    return this.lmsService.createQuiz(user.organizationId, dto);
  }

  @Get('lessons/:lessonId/quiz')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  getQuizByLesson(@CurrentUser() user: AuthenticatedUser, @Param('lessonId') lessonId: string) {
    return this.lmsService.getQuizByLesson(user.organizationId, lessonId);
  }

  /** Staff-only, full detail (includes the answer key) — for authoring, not for a student taking the quiz. */
  @Get('quizzes/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  findQuiz(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.findQuiz(user.organizationId, id);
  }

  @Patch('quizzes/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'Quiz' })
  updateQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.lmsService.updateQuiz(user.organizationId, id, dto);
  }

  @Delete('quizzes/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'Quiz' })
  deleteQuiz(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.deleteQuiz(user.organizationId, id);
  }

  @Post('quiz-questions')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'QuizQuestion' })
  createQuizQuestion(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuizQuestionDto) {
    return this.lmsService.createQuizQuestion(user.organizationId, dto);
  }

  @Patch('quiz-questions/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'QuizQuestion' })
  updateQuizQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.lmsService.updateQuizQuestion(user.organizationId, id, dto);
  }

  @Delete('quiz-questions/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'QuizQuestion' })
  deleteQuizQuestion(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.deleteQuizQuestion(user.organizationId, id);
  }

  @Post('quiz-options')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'QuizOption' })
  createQuizOption(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuizOptionDto) {
    return this.lmsService.createQuizOption(user.organizationId, dto);
  }

  @Patch('quiz-options/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'QuizOption' })
  updateQuizOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuizOptionDto,
  ) {
    return this.lmsService.updateQuizOption(user.organizationId, id, dto);
  }

  @Delete('quiz-options/:id')
  @UseGuards(RolesGuard)
  @Roles(...QUIZ_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'QuizOption' })
  deleteQuizOption(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.deleteQuizOption(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // Quiz attempts (student)
  // ---------------------------------------------------------------------

  /** Answer-key-free view used to render the attempt form in the portal. */
  @Get('quizzes/:id/attempt')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  getQuizForAttempt(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.getQuizForAttempt(user.organizationId, user.id, id);
  }

  @Post('quizzes/:id/attempts')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  @AuditLog({ action: 'create', entity: 'QuizAttempt' })
  submitQuizAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    return this.lmsService.submitQuizAttempt(user.organizationId, user.id, id, dto);
  }
}
