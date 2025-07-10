'use client'
import { useRouter } from "next/navigation";
import type { BaseUser } from "@tern-secure/nextjs/server";

interface ProtectedPageClientProps {
    user: BaseUser;
}

export function ProtectedPageClient({ user }: ProtectedPageClientProps) {
    const router = useRouter();

    const redirectToHome = () => {
        router.push('/');
    };

    const redirectToMoPage = () => {
        router.push('/mo');
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.email}!</p>
            
            <button
                onClick={redirectToMoPage}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                Back to Mo page
            </button>

            <button
                onClick={redirectToHome}
                className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
                Back to Home
            </button>
        </div>
    );
}