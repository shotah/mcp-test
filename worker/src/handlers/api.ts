import { Logger } from '../logger';
import { ApiResponse } from '../types';

/**
 * API info endpoint handler
 */
export function handleApi(corsHeaders: Record<string, string>): Response {
  Logger.info('API info requested');

  const response: ApiResponse = {
    message: 'MCP Server is running!',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      embed: 'POST /embed',
      search: 'POST /search',
      chat: 'POST /chat',
    },
  };

  Logger.success('API info response generated');
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
