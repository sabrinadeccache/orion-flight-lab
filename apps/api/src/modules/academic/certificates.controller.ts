import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@Controller('certificates')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class CertificatesController {
  constructor(private readonly academicService: AcademicService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Certificate' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCertificateDto) {
    return this.academicService.issueCertificate(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.academicService.findCertificates(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academicService.findCertificate(user.organizationId, id);
  }

  @Get(':id/download')
  getDownloadUrl(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academicService.getCertificateDownloadUrl(user.organizationId, id);
  }
}
