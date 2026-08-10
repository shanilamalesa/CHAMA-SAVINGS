'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TreasurerLogin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Send token to verify endpoint
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => {
          if (res.ok) {
            router.push('/treasurer');
          } else {
            // Invalid token
          }
        })
        .catch((err) => console.error('Auth error:', err));
    }
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Chama Savings</h1>
        {token ? (
          <p className="text-gray-600">Verifying your access...</p>
        ) : (
          <p className="text-gray-600">Use /dashboard in Telegram to get started</p>
        )}
      </div>
    </div>
  );
}
