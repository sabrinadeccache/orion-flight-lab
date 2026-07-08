import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MaterialType } from '@prisma/client';
import { TrainingService } from './training.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

const ORG_ID = 'org-1';

describe('TrainingService — content hierarchy (Segment -> Material)', () => {
  let service: TrainingService;
  let prisma: {
    course: { findFirst: jest.Mock };
    segment: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    module: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    unit: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    subUnit: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    lesson: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    material: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      course: { findFirst: jest.fn() },
      segment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      module: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      unit: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      subUnit: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      lesson: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      material: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        TrainingService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { upload: jest.fn(), createSignedUrl: jest.fn() } },
      ],
    }).compile();

    service = module.get(TrainingService);
  });

  describe('createSegment', () => {
    it('rejects a course belonging to another organization (IDOR)', async () => {
      prisma.course.findFirst.mockResolvedValue(null);

      await expect(
        service.createSegment(ORG_ID, { course_id: 'course-1', name: 'Segmento 1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.segment.create).not.toHaveBeenCalled();
    });

    it('creates when the course belongs to the same organization', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'course-1' });
      prisma.segment.create.mockResolvedValue({ id: 'segment-1' });

      const result = await service.createSegment(ORG_ID, {
        course_id: 'course-1',
        name: 'Segmento 1',
      });

      expect(result).toEqual({ id: 'segment-1' });
    });
  });

  describe('createModule', () => {
    it('rejects a segment belonging to another organization (IDOR)', async () => {
      prisma.segment.findFirst.mockResolvedValue(null);

      await expect(
        service.createModule(ORG_ID, { segment_id: 'segment-1', name: 'Módulo 1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.module.create).not.toHaveBeenCalled();
    });

    it('creates when the segment belongs to the same organization', async () => {
      prisma.segment.findFirst.mockResolvedValue({ id: 'segment-1' });
      prisma.module.create.mockResolvedValue({ id: 'module-1' });

      const result = await service.createModule(ORG_ID, {
        segment_id: 'segment-1',
        name: 'Módulo 1',
      });

      expect(result).toEqual({ id: 'module-1' });
    });
  });

  describe('createUnit', () => {
    it('rejects a module belonging to another organization (IDOR)', async () => {
      prisma.module.findFirst.mockResolvedValue(null);

      await expect(
        service.createUnit(ORG_ID, { module_id: 'module-1', name: 'Unidade 1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.unit.create).not.toHaveBeenCalled();
    });
  });

  describe('createSubUnit', () => {
    it('rejects a unit belonging to another organization (IDOR)', async () => {
      prisma.unit.findFirst.mockResolvedValue(null);

      await expect(
        service.createSubUnit(ORG_ID, { unit_id: 'unit-1', name: 'Subunidade 1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.subUnit.create).not.toHaveBeenCalled();
    });
  });

  describe('createLesson', () => {
    it('rejects a sub-unit belonging to another organization (IDOR)', async () => {
      prisma.subUnit.findFirst.mockResolvedValue(null);

      await expect(
        service.createLesson(ORG_ID, { sub_unit_id: 'sub-unit-1', name: 'Lição 1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.lesson.create).not.toHaveBeenCalled();
    });
  });

  describe('createMaterial', () => {
    beforeEach(() => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'lesson-1' });
    });

    it('rejects a lesson belonging to another organization (IDOR)', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(
        service.createMaterial(ORG_ID, { lesson_id: 'lesson-1', name: 'Slide 1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.material.create).not.toHaveBeenCalled();
    });

    it('rejects VIDEO_EXTERNO without a file_url', async () => {
      await expect(
        service.createMaterial(ORG_ID, {
          lesson_id: 'lesson-1',
          name: 'Vídeo 1',
          type: MaterialType.VIDEO_EXTERNO,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.material.create).not.toHaveBeenCalled();
    });

    it('allows creating ARQUIVO without a file_url (uploaded separately afterwards)', async () => {
      prisma.material.create.mockResolvedValue({ id: 'material-3' });

      const result = await service.createMaterial(ORG_ID, {
        lesson_id: 'lesson-1',
        name: 'Slide 1',
        type: MaterialType.ARQUIVO,
      });

      expect(result).toEqual({ id: 'material-3' });
    });

    it('rejects TEXTO without content_html', async () => {
      await expect(
        service.createMaterial(ORG_ID, {
          lesson_id: 'lesson-1',
          name: 'Texto 1',
          type: MaterialType.TEXTO,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.material.create).not.toHaveBeenCalled();
    });

    it('accepts VIDEO_EXTERNO with a file_url', async () => {
      prisma.material.create.mockResolvedValue({ id: 'material-1' });

      const result = await service.createMaterial(ORG_ID, {
        lesson_id: 'lesson-1',
        name: 'Vídeo 1',
        type: MaterialType.VIDEO_EXTERNO,
        file_url: 'https://youtube.com/embed/xyz',
      });

      expect(result).toEqual({ id: 'material-1' });
    });

    it('accepts TEXTO with content_html', async () => {
      prisma.material.create.mockResolvedValue({ id: 'material-2' });

      const result = await service.createMaterial(ORG_ID, {
        lesson_id: 'lesson-1',
        name: 'Texto 1',
        type: MaterialType.TEXTO,
        content_html: '<p>Conteúdo</p>',
      });

      expect(result).toEqual({ id: 'material-2' });
    });
  });

  describe('uploadMaterialFile / getMaterialDownloadUrl', () => {
    it('uploads to the lms-materials bucket and forces type ARQUIVO', async () => {
      prisma.material.findFirst.mockResolvedValue({ id: 'material-1' });
      prisma.material.update.mockResolvedValue({ id: 'material-1', type: 'ARQUIVO' });
      const storage = { upload: jest.fn().mockResolvedValue('org-1/material-1'), createSignedUrl: jest.fn() };
      const moduleRef = await Test.createTestingModule({
        providers: [
          TrainingService,
          { provide: PrismaService, useValue: prisma },
          { provide: StorageService, useValue: storage },
        ],
      }).compile();
      const svc = moduleRef.get(TrainingService);

      await svc.uploadMaterialFile(ORG_ID, 'material-1', Buffer.from('data'), 'application/pdf');

      expect(storage.upload).toHaveBeenCalledWith(
        'lms-materials',
        ORG_ID,
        'material-1',
        Buffer.from('data'),
        'application/pdf',
      );
      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'material-1' },
        data: { type: 'ARQUIVO', file_url: 'org-1/material-1' },
      });
    });

    it('rejects uploading to a material outside the organization', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadMaterialFile(ORG_ID, 'material-1', Buffer.from('data')),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSegment', () => {
    it('soft-deletes (sets deleted_at) rather than removing the row', async () => {
      prisma.segment.findFirst.mockResolvedValue({ id: 'segment-1' });
      prisma.segment.update.mockResolvedValue({ id: 'segment-1' });

      await service.deleteSegment(ORG_ID, 'segment-1');

      expect(prisma.segment.update).toHaveBeenCalledWith({
        where: { id: 'segment-1' },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('throws NotFoundException for a segment outside the organization', async () => {
      prisma.segment.findFirst.mockResolvedValue(null);

      await expect(service.deleteSegment(ORG_ID, 'segment-1')).rejects.toThrow(NotFoundException);
      expect(prisma.segment.update).not.toHaveBeenCalled();
    });
  });
});
