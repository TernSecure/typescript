'use client'

import { useAuth } from "@tern-secure/nextjs";
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  console.log('isAuthenticated:', isAuthenticated);

  if (!user) return null;

  const redirectToMoPage = () => {
    router.push('/mo');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  const createsignOut = async () => {
    await signOut();
  }

  return (
    <div>
      <h1>Welcome, {user?.displayName || user?.email}</h1>
          <button onClick={redirectToMoPage}>
            Visit Mo Page
          </button>

      <button
        onClick={redirectToDashboard}
        className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Dashboard
      </button>
      <button
        onClick={createsignOut}
        className="ml-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Sign Out
      </button>
    </div>
  );
}
