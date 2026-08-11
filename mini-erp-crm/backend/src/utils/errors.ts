export class HttpError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(statusCode: number, message: string, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, errorCode = 'BAD_REQUEST') {
    super(400, message, errorCode);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
    super(401, message, errorCode);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Access forbidden', errorCode = 'FORBIDDEN') {
    super(403, message, errorCode);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string, errorCode = 'NOT_FOUND') {
    super(404, message, errorCode);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, errorCode = 'CONFLICT') {
    super(409, message, errorCode);
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message: string, errorCode = 'VALIDATION_ERROR') {
    super(422, message, errorCode);
  }
}
