import { createClient } from '@supabase/supabase-js';

/**
 * Validates authentication token and returns user ID
 */
export async function validateAuth(
  request: Request,
  supabase: any
): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

/**
 * Creates a Supabase client with service role key
 */
export function createSupabaseClient(env: any) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
