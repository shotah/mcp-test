/**
 * MCP (Model Context Protocol) Server - Cloudflare Worker
 *
 * This is a Cloudflare Worker, not a traditional Express server. Key differences:
 *
 * 🚀 **Why Cloudflare Workers?**
 * - Edge computing: Runs at 200+ locations worldwide for ultra-low latency
 * - Serverless: No server management, auto-scaling, pay-per-request
 * - Global distribution: Requests served from nearest edge location
 * - Built-in security: DDoS protection, WAF, and security features
 * - Cost-effective: Only pay for actual usage, no idle server costs
 *
 * 🏗️ **Architecture Differences from Express:**
 * - Uses `fetch()` handler instead of Express middleware
 * - No file system access (stateless)
 * - Request/Response objects are Web API standard
 * - Deployed via Wrangler CLI, not traditional hosting
 * - Environment variables injected at runtime
 *
 * 📦 **Deployment:**
 * - Built with `wrangler deploy` command
 * - Runs on Cloudflare's global network
 * - Automatically scales to handle traffic spikes
 * - Zero cold start issues (unlike AWS Lambda)
 */

import OpenAI from 'openai';
import { createSupabaseClient, validateAuth } from './auth';
import { createCorsResponse, getCorsHeaders } from './cors';
import { handleApi } from './handlers/api';
import { handleChat } from './handlers/chat';
import { handleDebug } from './handlers/debug';
import { handleEmbed } from './handlers/embed';
import { handleHealth } from './handlers/health';
import { handleSearch } from './handlers/search';
import { Logger } from './logger';
import { checkRateLimit, getClientIP } from './rate-limit';
import { Env } from './types';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    Logger.request(method, url.pathname);
    Logger.info('Environment check', {
      SUPABASE_URL: env.SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      OPENAI_API_KEY: env.OPENAI_API_KEY ? 'Set' : 'Missing',
      ALLOWED_ORIGINS: env.ALLOWED_ORIGINS || 'Using default',
      OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL || 'Using default',
      OPENAI_CHAT_MODEL: env.OPENAI_CHAT_MODEL || 'Using default',
    });

    const clientIP = getClientIP(request);
    Logger.info('Client IP', { ip: clientIP });

    const corsHeaders = getCorsHeaders(request, env);
    Logger.cors('CORS headers set', corsHeaders);

    // Handle preflight requests
    if (method === 'OPTIONS') {
      Logger.info('Handling OPTIONS preflight request');
      return createCorsResponse(corsHeaders);
    }

    // Rate limiting check
    const rateLimitOk = await checkRateLimit(clientIP);
    Logger.rateLimit('Rate limit check', {
      allowed: rateLimitOk,
      ip: clientIP,
    });

    if (!rateLimitOk) {
      Logger.warning('Rate limit exceeded', { ip: clientIP });
      return new Response('Rate limited', {
        status: 429,
        headers: corsHeaders,
      });
    }

    try {
      // Initialize Supabase client
      Logger.database('Initializing Supabase client');
      const supabase = createSupabaseClient(env);
      Logger.success('Supabase client initialized');

      // Initialize OpenAI client
      Logger.ai('Initializing OpenAI client');
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      Logger.success('OpenAI client initialized');

      // Authentication for protected endpoints
      let userId: string | null = null;
      if (['/chat', '/search'].includes(url.pathname)) {
        Logger.auth('Checking authentication for protected endpoint');
        userId = await validateAuth(request, supabase);
        if (!userId) {
          Logger.warning('Authentication failed');
          return new Response('Unauthorized', {
            status: 401,
            headers: corsHeaders,
          });
        }
        Logger.success('Authentication successful', { userId });
      }

      // Route handling
      switch (url.pathname) {
        case '/health':
          return handleHealth();

        case '/debug':
          return handleDebug(request, corsHeaders);

        case '/':
          return handleApi(corsHeaders);

        case '/embed':
          if (method !== 'POST') {
            Logger.warning('Method not allowed for embed', { method });
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleEmbed(request, openai, corsHeaders, env);

        case '/search':
          if (method !== 'POST') {
            Logger.warning('Method not allowed for search', { method });
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleSearch(request, supabase, openai, corsHeaders, env);

        case '/chat':
          if (method !== 'POST') {
            Logger.warning('Method not allowed for chat', { method });
            return new Response('Method not allowed', {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleChat(
            request,
            supabase,
            openai,
            corsHeaders,
            userId!,
            env
          );

        default:
          Logger.warning('Route not found', { pathname: url.pathname });
          return new Response('Not found', {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      Logger.error('Worker error occurred', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
