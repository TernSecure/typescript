'use client'

import { useAuth } from "@tern-secure/nextjs";

export default function Home() {
  const { user, token, signOut } = useAuth();
  return (
    <div>
      {user ? (
        <>
          <h1>Welcome, {user.displayName || user.email}</h1>
          {/*<button onClick={signOut}>Sign out</button>*/}
        </>
      ) : (
        <>
          <h1>Welcome to the Auth Test App</h1>
          <p>Please sign in.</p>
        </>
      )}
    </div>
  );
}
