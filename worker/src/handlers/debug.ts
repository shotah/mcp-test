import { Logger } from '../logger';
import { DebugResponse } from '../types';

/**
 * Debug endpoint handler
 */
export function handleDebug(
  request: Request,
  corsHeaders: Record<string, string>
): Response {
  Logger.debug('Debug endpoint requested');

  const response: DebugResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    origin: request.headers.get('Origin') || 'unknown',
    method: request.method,
    pathname: new URL(request.url).pathname,
    corsHeaders,
  };

  Logger.success('Debug response generated');
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
