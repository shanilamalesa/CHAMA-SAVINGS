import { cookies } from 'next/headers';
import { query } from '@/app/lib/db';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Verify token in database
    const { rows } = await query(
      `SELECT * FROM dashboard_sessions
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const session = rows[0];

    // Set HttpOnly cookie
    const cookieStore = cookies();
    cookieStore.set('treasurer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    // Mark session as used
    await query(
      'UPDATE dashboard_sessions SET used_at = NOW() WHERE token = $1',
      [token]
    );

    return Response.json(
      { success: true, userId: session.user_id },
      {
        status: 200,
        headers: {
          'Set-Cookie': `treasurer_token=${token}; Path=/; HttpOnly; ${
            process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
          }SameSite=Lax; Max-Age=3600`,
        },
      }
    );
  } catch (err) {
    console.error('Auth error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
