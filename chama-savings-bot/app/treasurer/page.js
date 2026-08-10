import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TreasurerPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('treasurer_token')?.value;

  if (!token) {
    redirect('/treasurer/login');
  }

  // TODO: Fetch user's chamas from API using token
  // For now, show placeholder

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Chama Treasurer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your savings groups</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Placeholder - Will be replaced with actual chama list */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">
            Loading your chamas...
          </p>
          <p className="text-sm text-gray-500">
            Dashboard will display your chama groups here
          </p>
        </div>
      </div>
    </div>
  );
}
