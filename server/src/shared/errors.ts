export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 400,
    message?: string,
    public details?: unknown,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: (msg = 'Unauthorized') => new AppError('UNAUTHORIZED', 401, msg),
  forbidden: (msg = 'Forbidden') => new AppError('FORBIDDEN', 403, msg),
  notFound: (msg = 'Not found') => new AppError('NOT_FOUND', 404, msg),
  conflict: (msg = 'Conflict') => new AppError('CONFLICT', 409, msg),
  validation: (msg = 'Validation failed', details?: unknown) =>
    new AppError('VALIDATION_ERROR', 422, msg, details),
  badRequest: (msg = 'Bad request') => new AppError('BAD_REQUEST', 400, msg),
  internal: (msg = 'Internal server error') => new AppError('INTERNAL_ERROR', 500, msg),
};
