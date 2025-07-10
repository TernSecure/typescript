'use client'
import { useRouter } from "next/navigation";
import type { BaseUser } from "@tern-secure/nextjs/server";

interface ProtectedPageClientProps {
    user: BaseUser;
}

export function SecondProtected({ user }: ProtectedPageClientProps) {
        console.log('User in second protected page:', user)
    const router = useRouter();

    const redirectToHome = () => {
        router.push('/');
    };

    const redirectToMoPage = () => {
        router.push('/mo');
    };

    const redirectToFirstProtectedPage = () => {
        router.push('/protected');
    }

    return (
        <div>
            <h1>Second Protected Page</h1>
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
                    <button
                onClick={redirectToFirstProtectedPage}
                className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
               First Protected Page
            </button>
        </div>
    );
}