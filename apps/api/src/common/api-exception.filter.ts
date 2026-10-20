import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

type RequestWithId = Request & { requestId?: string };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined;
    const rawMessage =
      typeof exceptionBody === 'string'
        ? exceptionBody
        : exceptionBody && typeof exceptionBody === 'object' && 'message' in exceptionBody
          ? (exceptionBody as { message: unknown }).message
          : undefined;
    const message =
      statusCode >= 500
        ? 'Internal server error.'
        : Array.isArray(rawMessage)
          ? rawMessage.join(' ')
          : typeof rawMessage === 'string'
            ? rawMessage
            : 'Request failed.';

    if (statusCode >= 500) {
      this.logger.error(
        JSON.stringify({
          requestId: request.requestId,
          method: request.method,
          path: request.path,
          statusCode,
          exceptionType: exception instanceof Error ? exception.constructor.name : 'UnknownError',
        }),
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      ...(request.requestId ? { requestId: request.requestId } : {}),
      timestamp: new Date().toISOString(),
    });
  }
}
