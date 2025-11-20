'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [models, setModels] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                const { data, error } = await supabase
                    .from('models')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (data) setModels(data);
            }
        };
        checkUser();
    }, [router]);

    if (!user) return <div className="p-8">Loading...</div>;

    return (
        <main className="min-h-screen p-8 bg-gray-100 text-black">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{user.email}</span>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">My Models</h2>
                        <button
                            onClick={() => router.push('/editor/new')}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Create New Model
                        </button>
                    </div>

                    {models.length === 0 ? (
                        <p className="text-gray-500">No models yet.</p>
                    ) : (
                        <div className="grid gap-4">
                            {models.map((model: any) => (
                                <div
                                    key={model.id}
                                    className="p-4 border rounded hover:border-blue-500 cursor-pointer transition-colors flex justify-between items-center"
                                    onClick={() => router.push(`/editor/${model.id}`)}
                                >
                                    <div>
                                        <h3 className="font-bold">{model.name}</h3>
                                        <p className="text-xs text-gray-500">Last updated: {new Date(model.updated_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-blue-600 text-sm">Open &rarr;</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
