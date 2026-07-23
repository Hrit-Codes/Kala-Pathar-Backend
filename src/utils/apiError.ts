export class ApiError extends Error {
  statusCode: number;
  success: boolean;
  stack: string | undefined;
  code?: number;
  constructor(
    statusCode: number,
    message: string = "Process Execution Failed",
    code?: number,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.code = code;
    stack
      ? (this.stack = stack)
      : Error.captureStackTrace(this, this.constructor);
  }


}
