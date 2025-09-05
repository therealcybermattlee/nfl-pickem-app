/**
 * TypeScript declarations for Cloudflare Functions API endpoints
 * These types ensure proper contracts between frontend and backend
 */

import { 
  D1GameWithTeamsRaw, 
  GameWithTeamsForAPI, 
  GamesApiResponse, 
  ApiErrorResponse 
} from '../../types/index.js';

/**
 * Cloudflare Pages Functions context object
 */
interface CloudflareContext {
  env: {
    /** D1 database binding */
    DB: D1Database;
    /** The Odds API key */
    THE_ODDS_API_KEY?: string;
    /** The Odds API base URL (optional) */
    THE_ODDS_API_BASE_URL?: string;
  };
  request: Request;
  params: Record<string, string>;
}

/**
 * D1 Database interface (Cloudflare)
 */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all(): Promise<D1Result<any>>;
  first(): Promise<any>;
  run(): Promise<D1RunResult>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1RunResult {
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

/**
 * Games API GET handler
 * 
 * @param context Cloudflare Pages Functions context
 * @returns Promise<Response> with GamesApiResponse or ApiErrorResponse
 */
export function onRequestGet(context: CloudflareContext): Promise<Response>;

/**
 * Games API POST handler (sync from external API)
 * 
 * @param context Cloudflare Pages Functions context
 * @returns Promise<Response> with sync status or ApiErrorResponse
 */
export function onRequestPost(context: CloudflareContext): Promise<Response>;

/**
 * Games API OPTIONS handler (CORS)
 * 
 * @returns Promise<Response> with CORS headers
 */
export function onRequestOptions(): Promise<Response>;

/**
 * Helper function to transform raw D1 data to API format
 * 
 * @param rawGame Raw game data from D1 query
 * @returns Transformed game data for API response
 */
export function transformD1GameToAPIFormat(rawGame: D1GameWithTeamsRaw): GameWithTeamsForAPI;

/**
 * Helper function to get current NFL week
 * 
 * @param date Current date
 * @returns NFL week number (1-18)
 */
export function getCurrentNFLWeek(date: Date): number;

/**
 * Helper function to create standardized success responses
 * 
 * @param data Response data
 * @returns Response object with proper headers
 */
export function createSuccessResponse(data: any): Response;

/**
 * Helper function to create standardized error responses
 * 
 * @param message Error message
 * @param status HTTP status code
 * @param details Optional error details
 * @returns Response object with error data
 */
export function createErrorResponse(message: string, status?: number, details?: string): Response;