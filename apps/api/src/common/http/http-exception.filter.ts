import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiError, ApiResponse } from '@orion/shared';

/** Formats every thrown error (HttpException or otherwise) into `{ data, meta, errors }`. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errors = this.buildErrors(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const body: ApiResponse<null> = { data: null, meta: null, errors };
    response.status(status).json(body);
  }

  private buildErrors(exception: unknown, status: number): ApiError[] {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const messages =
        typeof payload === 'string'
          ? [payload]
          : Array.isArray((payload as { message?: unknown }).message)
            ? ((payload as { message: string[] }).message as string[])
            : [((payload as { message?: string }).message ?? exception.message)];

      return messages.map((message) => ({ code: String(status), message }));
    }

    return [{ code: String(status), message: 'Internal server error' }];
  }
}
