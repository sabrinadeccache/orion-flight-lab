import { IsObject } from 'class-validator';

export class SubmitQuizAttemptDto {
  /** Maps QuizQuestion.id -> chosen QuizOption.id. */
  @IsObject()
  answers!: Record<string, string>;
}
