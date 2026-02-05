/**
 * Type definitions and interfaces for Inxtone
 *
 * This module exports all types needed for the application.
 * These interfaces serve as contracts for parallel development.
 */

// Entity types - Data models mapped to SQLite schema
export * from './entities.js';

// Service interfaces - Core business logic contracts
export * from './services.js';

// API types - HTTP API contracts for client/server communication
export * from './api.js';

// Event types - EventBus event definitions
export * from './events.js';
