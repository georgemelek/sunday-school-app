import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

const STREAM_API_KEY = '3sfz9pb7ep69'
const STREAM_API_SECRET = Deno.env.get('STREAM_API_SECRET')!

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(STREAM_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

// Server-side token (no user_id) for calling Stream's REST API
async function mintServerToken(): Promise<string> {
  const key = await getSigningKey()
  // iat 5s in the past to avoid clock-skew rejection from Stream's servers
  return create({ alg: 'HS256', typ: 'JWT' }, { iat: getNumericDate(-5) }, key)
}

// Client token for a specific user
async function mintUserToken(userId: string): Promise<string> {
  const key = await getSigningKey()
  return create({ alg: 'HS256', typ: 'JWT' }, { user_id: userId, iat: getNumericDate(-5) }, key)
}

async function upsertStreamUser(userId: string, name: string) {
  const serverToken = await mintServerToken()
  const res = await fetch(`https://chat.stream-io-api.com/users?api_key=${STREAM_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverToken}`,
      'stream-auth-type': 'jwt',
    },
    // Stream expects a map of { [userId]: userObject }, not an array
    body: JSON.stringify({ users: { [userId]: { id: userId, name, role: 'user' } } }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Stream upsert failed: ${res.status} ${text}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return new Response('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const displayName = profile?.full_name ?? user.email ?? user.id

    await upsertStreamUser(user.id, displayName)
    const token = await mintUserToken(user.id)

    return new Response(
      JSON.stringify({ token, userId: user.id, apiKey: STREAM_API_KEY }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
