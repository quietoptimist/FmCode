'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-900 to-black text-white">
      <h1 className="text-6xl font-bold mb-4">Numberly</h1>
      <p className="text-xl text-gray-300 mb-8 max-w-2xl text-center">
        The next generation financial modeling engine. Build complex models with simple text.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-8 py-3 bg-blue-600 rounded-full font-semibold hover:bg-blue-500 transition-all"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 bg-transparent border border-white rounded-full font-semibold hover:bg-white/10 transition-all"
        >
          Log In
        </Link>
      </div>
    </main>
  );
}
