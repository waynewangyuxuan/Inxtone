/**
 * Error Handler Middleware
 *
 * Global error handling for Fastify that maps InxtoneError types to HTTP responses.
 * Uses the error types system from @inxtone/core for consistent error handling.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  isInxtoneError,
  getStatusCode,
  getErrorCode,
  wrapError,
  type ApiErrorResponse,
} from '@inxtone/core';

/**
 * Global error handler for Fastify.
 *
 * Maps InxtoneError types to appropriate HTTP status codes and response formats.
 * Unknown errors are wrapped as internal server errors.
 *
 * Error handling strategy:
 * - InxtoneError subclasses: Use their statusCode and code
 * - Fastify validation errors: Return 400 with validation details
 * - Unknown errors: Return 500 INTERNAL_ERROR (hide details)
 */
export function errorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply): void {
  // Log error for debugging (Fastify logger)
  request.log.error(error);

  // Handle Fastify validation errors (from JSON Schema validation)
  if (isFastifyValidationError(error)) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      },
    };
    reply.status(400).send(response);
    return;
  }

  // Handle InxtoneError types
  if (isInxtoneError(error)) {
    const statusCode = error.statusCode;
    const isServerError = statusCode >= 500;

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        // Hide detailed message for server errors
        message: isServerError ? 'Internal server error' : error.message,
        // Hide context for server errors to prevent information leakage
        ...(isServerError ? {} : error.context && { details: error.context }),
      },
    };
    reply.status(statusCode).send(response);
    return;
  }

  // Wrap unknown errors - always return 500
  const wrapped = wrapError(error, 'An unexpected error occurred');
  const statusCode = getStatusCode(wrapped);
  const errorCode = getErrorCode(wrapped);

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: 'Internal server error',
      // No details for unknown errors
    },
  };
  reply.status(statusCode).send(response);
}

/**
 * Type guard for Fastify validation errors.
 */
function isFastifyValidationError(error: unknown): error is Error & { validation: unknown[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'validation' in error &&
    Array.isArray((error as { validation: unknown }).validation)
  );
}
