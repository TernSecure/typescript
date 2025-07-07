'use client'

import { useAuth } from "@tern-secure/nextjs";
import { useRouter, redirect } from "next/navigation"

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  console.log('isAuthenticated:', isAuthenticated);

  if (!user) return null;


  const redirectToMoPage = () => {
    router.push('/mo');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

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
    </div>
  );
}
