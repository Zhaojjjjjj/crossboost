export class AppException extends Error {
  constructor(
    public readonly code: number,
    public readonly data?: Record<string, any>,
  ) {
    super(`AppException: ${code}`)
  }
}
