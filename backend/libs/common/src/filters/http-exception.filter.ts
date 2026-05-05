import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { AppException } from '../exceptions/app-exception'
import { ResponseCode } from '../enums/response-code.enum'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof AppException) {
      response.status(HttpStatus.OK).json({
        code: exception.code,
        message: exception.message,
        data: exception.data ?? null,
      })
      return
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message

      response.status(status).json({
        code: status === HttpStatus.UNAUTHORIZED ? ResponseCode.Unauthorized : ResponseCode.UnknownError,
        message: Array.isArray(message) ? message.join(', ') : message,
        data: null,
      })
      return
    }

    const error = exception as Error
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ResponseCode.UnknownError,
      message: error.message || 'Internal server error',
      data: null,
    })
  }
}
