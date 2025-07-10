"use client"

import { useAuth } from "@tern-secure/nextjs"
import { useRouter } from "next/navigation"

export default function Dashboard() {
 const router = useRouter();
 const { user, signOut } = useAuth();

 //console.log('Dashboard user:', user);

   if (!user) return null;
   
    const redirectToHome = () => {
      router.push('/');
    };

    const redirectToMoPage = () => {
      router.push('/mo');
    };
    
    const redirectToProtected = () => {
      router.push('/protected');
    };

  const createsignOut = async () => {
    await signOut();
  }

    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.displayName || user?.email}!</p>
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
        onClick={redirectToProtected}
        className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Server Side Page
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