import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/app/lib/db';
import Link from 'next/link';

export default async function TreasurerPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('treasurer_token')?.value;

  if (!token) {
    redirect('/treasurer/login');
  }

  const { rows: session } = await query(
    'SELECT user_id FROM dashboard_sessions WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  if (!session[0]) {
    redirect('/treasurer/login');
  }
  const userId = session[0].user_id;

  const { rows: chamas } = await query(
    'SELECT * FROM chamas WHERE treasurer_user_id = $1',
    [userId]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Chama Treasurer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your savings groups</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {chamas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">You don't manage any chamas yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chamas.map((c) => (
              <Link
                key={c.chat_id}
                href={`/treasurer/${c.chat_id}`}
                className="block bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="font-medium text-lg">{c.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  KSh {(c.monthly_amount_cents / 100).toLocaleString()} per cycle on day {c.cycle_day}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}