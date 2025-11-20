import Auth from '@/components/Auth';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-blue-800">Numberly</h1>
                <p className="text-gray-600 mt-2">Financial Modeling Engine</p>
            </div>
            <Auth />
        </main>
    );
}
