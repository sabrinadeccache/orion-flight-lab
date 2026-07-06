import { Test } from '@nestjs/testing';
import { CourseStatus } from '@prisma/client';
import { NotificationsCron } from './notifications.cron';
import { NotificationsService } from './notifications.service';
import { NotificationJobType } from './notifications.constants';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('NotificationsCron', () => {
  let cron: NotificationsCron;
  let prisma: {
    course: { findMany: jest.Mock; update: jest.Mock };
    semestralReport: { findMany: jest.Mock };
  };
  let notifications: { enqueue: jest.Mock };

  beforeEach(async () => {
    prisma = {
      course: { findMany: jest.fn(), update: jest.fn() },
      semestralReport: { findMany: jest.fn() },
    };
    notifications = { enqueue: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        NotificationsCron,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    cron = module.get(NotificationsCron);
  });

  describe('RN-20: inactive courses alerted at 150 days, suspended at 180 days', () => {
    it('suspends a course inactive for 180+ days and enqueues a notification', async () => {
      prisma.course.findMany
        .mockResolvedValueOnce([
          { id: 'course-1', organization_id: 'org-1', name: 'Curso Suspenso' },
        ])
        .mockResolvedValueOnce([]);
      prisma.course.update.mockResolvedValue({});

      await cron.checkCourseInactivity();

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: { status: CourseStatus.SUSPENSO },
      });
      expect(notifications.enqueue).toHaveBeenCalledWith(
        NotificationJobType.COURSE_INACTIVE,
        expect.objectContaining({ entityId: 'course-1' }),
      );
    });

    it('flags a course inactive for 150+ (but under 180) days instead of suspending it', async () => {
      prisma.course.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'course-2', organization_id: 'org-1', name: 'Curso Alerta' }]);
      prisma.course.update.mockResolvedValue({});

      await cron.checkCourseInactivity();

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-2' },
        data: { status: CourseStatus.ALERTA_INATIVIDADE },
      });
    });

    it('does nothing for courses with recent activity', async () => {
      prisma.course.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await cron.checkCourseInactivity();

      expect(prisma.course.update).not.toHaveBeenCalled();
      expect(notifications.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('RN-22: ANAC communications flagged 60 days ahead of deadline', () => {
    it('enqueues a notification for a report due within 60 days', async () => {
      prisma.semestralReport.findMany.mockResolvedValue([
        {
          id: 'report-1',
          organization_id: 'org-1',
          deadline: new Date('2026-09-01'),
        },
      ]);

      await cron.checkAnacCommunicationDeadlines();

      expect(notifications.enqueue).toHaveBeenCalledWith(
        NotificationJobType.ANAC_COMMUNICATION,
        expect.objectContaining({ organizationId: 'org-1', entityId: 'report-1' }),
      );
    });

    it('does nothing when there are no reports due within the window', async () => {
      prisma.semestralReport.findMany.mockResolvedValue([]);

      await cron.checkAnacCommunicationDeadlines();

      expect(notifications.enqueue).not.toHaveBeenCalled();
    });
  });
});
