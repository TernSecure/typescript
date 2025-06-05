"use client"

import { useAuth } from "@tern-secure/nextjs"
import { redirect } from "next/navigation"

export default function Dashboard() {
 const { user } = useAuth();

    if (!user) {
      redirect('/sign-in');
    }

    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user.displayName || user.email}!</p>
        <button 
          onClick={() => redirect('/mo')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Back to Mo page
        </button>
     </div>
    );
}