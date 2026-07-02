export const NOTIFICATIONS_QUEUE = 'notifications';

export enum NotificationJobType {
  QUALIFICATION_EXPIRY = 'qualification-expiry',
  INSTRUCTOR_PROFICIENCY = 'instructor-proficiency',
  CMA_EXPIRY = 'cma-expiry',
  CONTRACT_EXPIRY = 'contract-expiry',
  ANAC_COMMUNICATION = 'anac-communication',
  SEMESTRAL_REPORT = 'semestral-report',
  COURSE_INACTIVE = 'course-inactive',
}

export interface NotificationJobPayload {
  organizationId: string;
  entityId: string;
  message: string;
  recipient?: string;
}
