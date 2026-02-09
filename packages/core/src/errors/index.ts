/**
 * Error Types for Inxtone
 *
 * Provides a structured error hierarchy for consistent error handling
 * across all layers (Repository, Service, API).
 *
 * Design principles:
 * - Each error type maps to a specific HTTP status code
 * - Errors are serializable for API responses
 * - Errors carry enough context for debugging
 * - Extensible for domain-specific errors
 */

/**
 * Base error class for all Inxtone errors.
 * Provides common structure and serialization.
 */
export abstract class InxtoneError extends Error {
  /** HTTP status code for API responses */
  abstract readonly statusCode: number;

  /** Error code for programmatic handling */
  abstract readonly code: string;

  /** Additional context for debugging */
  readonly context: Record<string, unknown> | undefined;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Serialize error for API response.
   */
  toJSON(): {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  } {
    return {
      code: this.code,
      message: this.message,
      ...(this.context && { context: this.context }),
    };
  }
}

// ============================================
// 4xx Client Errors
// ============================================

/**
 * Entity not found (404).
 *
 * @example
 * throw new EntityNotFoundError('Character', 'C001');
 */
export class EntityNotFoundError extends InxtoneError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(
    public readonly entityType: string,
    public readonly entityId: string | number
  ) {
    super(`${entityType} ${entityId} not found`, { entityType, entityId });
  }
}

/**
 * Validation error (400).
 *
 * @example
 * throw new ValidationError('Character name is required');
 * throw new ValidationError('Invalid role', { field: 'role', value: 'invalid' });
 */
export class ValidationError extends InxtoneError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, ...(field && { field }) });
  }
}

/**
 * Duplicate entity error (409).
 *
 * @example
 * throw new DuplicateEntityError('Relationship', 'C001-C002');
 */
export class DuplicateEntityError extends InxtoneError {
  readonly statusCode = 409;
  readonly code = 'DUPLICATE_ENTITY';

  constructor(
    public readonly entityType: string,
    public readonly identifier: string,
    context?: Record<string, unknown>
  ) {
    super(`${entityType} already exists: ${identifier}`, {
      entityType,
      identifier,
      ...context,
    });
  }
}

/**
 * Invalid operation error (400).
 * For operations that are not allowed in the current state.
 *
 * @example
 * throw new InvalidOperationError('Cannot delete main arc while chapters reference it');
 */
export class InvalidOperationError extends InxtoneError {
  readonly statusCode = 400;
  readonly code = 'INVALID_OPERATION';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Reference error (400).
 * When a referenced entity does not exist.
 *
 * @example
 * throw new ReferenceError('Character', 'C001', 'leaderId');
 */
export class ReferenceNotFoundError extends InxtoneError {
  readonly statusCode = 400;
  readonly code = 'REFERENCE_NOT_FOUND';

  constructor(
    public readonly referencedType: string,
    public readonly referencedId: string | number,
    public readonly field: string
  ) {
    super(`Referenced ${referencedType} ${referencedId} not found (field: ${field})`, {
      referencedType,
      referencedId,
      field,
    });
  }
}

/**
 * Self-reference error (400).
 * When an entity cannot reference itself.
 *
 * @example
 * throw new SelfReferenceError('Relationship', 'sourceId', 'targetId');
 */
export class SelfReferenceError extends InxtoneError {
  readonly statusCode = 400;
  readonly code = 'SELF_REFERENCE';

  constructor(
    public readonly entityType: string,
    public readonly field1: string,
    public readonly field2: string
  ) {
    super(`${entityType}: ${field1} and ${field2} cannot be the same`, {
      entityType,
      field1,
      field2,
    });
  }
}

// ============================================
// 5xx Server Errors
// ============================================

/**
 * Database error (500).
 *
 * @example
 * throw new DatabaseError('Failed to insert character', originalError);
 */
export class DatabaseError extends InxtoneError {
  readonly statusCode = 500;
  readonly code = 'DATABASE_ERROR';

  constructor(
    message: string,
    public readonly originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, {
      ...context,
      ...(originalError && { originalMessage: originalError.message }),
    });
  }
}

/**
 * Transaction error (500).
 *
 * @example
 * throw new TransactionError('Transaction rolled back', originalError);
 */
export class TransactionError extends InxtoneError {
  readonly statusCode = 500;
  readonly code = 'TRANSACTION_ERROR';

  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message, originalError ? { originalMessage: originalError.message } : undefined);
  }
}

/**
 * AI provider error (502).
 * For errors from upstream AI providers (Gemini, etc.).
 *
 * @example
 * throw new AIProviderError('AI_PROVIDER_ERROR', 'Invalid API key');
 * throw new AIProviderError('AI_RATE_LIMITED', 'Rate limit exceeded', true);
 */
export class AIProviderError extends InxtoneError {
  readonly statusCode = 502;

  constructor(
    readonly code:
      | 'AI_PROVIDER_ERROR'
      | 'AI_RATE_LIMITED'
      | 'AI_CONTEXT_TOO_LARGE'
      | 'AI_CONTENT_FILTERED',
    message: string,
    public readonly retriable = false,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if an error is an InxtoneError.
 */
export function isInxtoneError(error: unknown): error is InxtoneError {
  return error instanceof InxtoneError;
}

/**
 * Check if an error is a specific type.
 */
export function isEntityNotFound(error: unknown): error is EntityNotFoundError {
  return error instanceof EntityNotFoundError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isDuplicateEntity(error: unknown): error is DuplicateEntityError {
  return error instanceof DuplicateEntityError;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Wrap an error with context.
 * Useful for adding context to caught errors.
 */
export function wrapError(
  error: unknown,
  message: string,
  context?: Record<string, unknown>
): InxtoneError {
  if (error instanceof InxtoneError) {
    // Preserve original error type and add context
    return error;
  }

  const originalError = error instanceof Error ? error : new Error(String(error));
  return new DatabaseError(message, originalError, context);
}

/**
 * Get HTTP status code from an error.
 * Returns 500 for unknown errors.
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof InxtoneError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error code from an error.
 * Returns 'INTERNAL_ERROR' for unknown errors.
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof InxtoneError) {
    return error.code;
  }
  return 'INTERNAL_ERROR';
}
