'use client'

import { useAuth } from "@tern-secure/nextjs";
import { redirect } from "next/navigation"

export default function Home() {
  const { user, token } = useAuth();
  console.log("User:", user);
  //console.log("Token:", token);

  if (!user) {
    redirect('/sign-in');
  }

  const redirectToMoPage = () => {
    redirect('/mo');
  };

  return (
    <div>
      <h1>Welcome, {user.displayName || user.email}</h1>
          <button onClick={redirectToMoPage}>
            Visit Mo Page
          </button>
    </div>
  );
}
