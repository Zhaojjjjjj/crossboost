export enum ResponseCode {
  Success = 0,
  UnknownError = 10000,
  InvalidParam = 10001,
  Unauthorized = 10002,
  NotFound = 10003,
  // Product module: 20000-20999
  ProductNotFound = 20000,
  ProductAlreadyExists = 20001,
  // Content module: 30000-30999
  ContentTaskNotFound = 30000,
  ContentGenerationFailed = 30001,
  // Publish module: 40000-40999
  PublishFailed = 40000,
  PlatformNotSupported = 40001,
  // Account module: 50000-50999
  AccountNotFound = 50000,
  AccountAuthExpired = 50001,
}
