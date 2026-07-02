import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';

@Controller('documents')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Document' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDocumentDto) {
    return this.documentsService.createDocument(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findAll(user.organizationId);
  }

  @Get(':id/versions')
  getVersions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documentsService.getVersions(user.organizationId, id);
  }

  @Post(':id/versions')
  @AuditLog({ action: 'create', entity: 'DocumentVersion' })
  @UseInterceptors(FileInterceptor('file'))
  addVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateDocumentVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.addVersion(
      user.organizationId,
      id,
      dto,
      file?.buffer ?? Buffer.from(''),
      user.id,
      file?.mimetype,
    );
  }
}
