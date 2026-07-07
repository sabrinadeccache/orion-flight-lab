import { Injectable, NotFoundException } from '@nestjs/common';
import { Document, DocumentApprovalStatus, DocumentVersion } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';

export interface VersionDiffEntry {
  field: string;
  from: unknown;
  to: unknown;
}

export interface VersionWithDiff extends DocumentVersion {
  diffFromPrevious: VersionDiffEntry[] | null;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  createDocument(organizationId: string, dto: CreateDocumentDto): Promise<Document> {
    return this.prisma.document.create({
      data: {
        organization_id: organizationId,
        title: dto.title,
        category: dto.category,
        status: dto.status ?? DocumentApprovalStatus.EM_ELABORACAO,
      },
    });
  }

  findAll(organizationId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { organization_id: organizationId, deleted_at: null },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async updateDocument(
    organizationId: string,
    id: string,
    dto: UpdateDocumentDto,
  ): Promise<Document> {
    await this.findOne(organizationId, id);
    return this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title,
        category: dto.category,
        status: dto.status,
      },
    });
  }

  async deleteDocument(organizationId: string, id: string): Promise<void> {
    await this.findOne(organizationId, id);
    await this.prisma.document.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /** Every upload creates a new DocumentVersion; history is never overwritten. */
  async addVersion(
    organizationId: string,
    documentId: string,
    dto: CreateDocumentVersionDto,
    file: Buffer,
    uploadedBy: string,
    contentType?: string,
  ): Promise<DocumentVersion> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organization_id: organizationId, deleted_at: null },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const lastVersion = await this.prisma.documentVersion.findFirst({
      where: { document_id: documentId, deleted_at: null },
      orderBy: { version_number: 'desc' },
    });
    const versionNumber = (lastVersion?.version_number ?? 0) + 1;

    const fileUrl = await this.storage.upload(
      'regulatory-docs',
      organizationId,
      `${documentId}/v${versionNumber}`,
      file,
      contentType,
    );

    const version = await this.prisma.documentVersion.create({
      data: {
        organization_id: organizationId,
        document_id: documentId,
        version_number: versionNumber,
        file_url: fileUrl,
        uploaded_by: uploadedBy,
        notes: dto.notes,
      },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentApprovalStatus.EM_REVISAO },
    });

    return version;
  }

  /** GET /documents/:id/download — signed URL for the latest version's file. */
  async getDownloadUrl(
    organizationId: string,
    documentId: string,
  ): Promise<{ url: string; version_number: number } | null> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organization_id: organizationId, deleted_at: null },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const lastVersion = await this.prisma.documentVersion.findFirst({
      where: { document_id: documentId, deleted_at: null },
      orderBy: { version_number: 'desc' },
    });
    if (!lastVersion) {
      return null;
    }

    const url = await this.storage.createSignedUrl('regulatory-docs', lastVersion.file_url);
    if (!url) {
      return null;
    }

    return { url, version_number: lastVersion.version_number };
  }

  /** GET /documents/:id/versions — full version history with a metadata diff. */
  async getVersions(organizationId: string, documentId: string): Promise<VersionWithDiff[]> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organization_id: organizationId, deleted_at: null },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const versions = await this.prisma.documentVersion.findMany({
      where: { document_id: documentId, deleted_at: null },
      orderBy: { version_number: 'asc' },
    });

    return versions.map((version, index) => {
      const previous = index > 0 ? versions[index - 1] : null;
      return {
        ...version,
        diffFromPrevious: previous ? this.diffVersions(previous, version) : null,
      };
    });
  }

  private diffVersions(previous: DocumentVersion, current: DocumentVersion): VersionDiffEntry[] {
    const fields: (keyof DocumentVersion)[] = ['file_url', 'notes', 'uploaded_by'];
    return fields
      .filter((field) => previous[field] !== current[field])
      .map((field) => ({ field, from: previous[field], to: current[field] }));
  }
}
