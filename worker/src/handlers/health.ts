import { Logger } from '../logger';
import { HealthResponse } from '../types';

/**
 * Health check endpoint handler
 */
export function handleHealth(): Response {
  Logger.info('Health check requested');

  const response: HealthResponse = { status: 'ok' };

  Logger.success('Health check completed');
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}
