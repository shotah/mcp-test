import { Env } from './types';

/**
 * Generates CORS headers based on request origin and environment
 */
export function getCorsHeaders(
  request: Request,
  env: Env
): Record<string, string> {
  const requestOrigin = request.headers.get('Origin');
  console.log('🔧 CORS Debug:', {
    requestOrigin,
    allowedOrigins: env.ALLOWED_ORIGINS,
    envKeys: Object.keys(env)
  });
  const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:3000').split(
    ','
  );

  // For development, allow any localhost origin
  const isLocalhost =
    requestOrigin?.startsWith('http://localhost:') ||
    requestOrigin?.startsWith('http://127.0.0.1:');

  const allowedOrigin =
    allowedOrigins.includes(requestOrigin || '') || isLocalhost
      ? requestOrigin
      : allowedOrigins[0]; // fallback to first allowed origin

  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Creates a CORS response for preflight requests
 */
export function createCorsResponse(
  corsHeaders: Record<string, string>
): Response {
  return new Response(null, { status: 200, headers: corsHeaders });
}
