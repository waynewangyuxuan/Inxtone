/**
 * Response Utilities
 *
 * Helper functions for creating standardized API responses.
 * Uses the ApiResponse types from @inxtone/core.
 */

import type { ApiResponse, ApiErrorResponse } from '@inxtone/core';

/**
 * Wrap data in standard success response format.
 *
 * @param data - The data to wrap
 * @returns Formatted API response
 *
 * @example
 * ```typescript
 * const character = await service.getCharacter(id);
 * return reply.send(success(character));
 * ```
 */
export function success<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create standard error response format.
 *
 * @param code - Error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @returns Formatted API error response
 *
 * @example
 * ```typescript
 * return reply.status(404).send(error('NOT_FOUND', 'Character not found'));
 * ```
 */
export function error(code: string, message: string, details?: unknown): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}
