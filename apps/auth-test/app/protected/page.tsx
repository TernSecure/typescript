import { auth } from "@tern-secure/nextjs/server"
import { redirect} from "next/navigation";

export default async function ProtectedPage() {
    const { user } = await auth();

    if (!user) return null

    const redirectToHome = () => {
      redirect('/');
    };

    const redirectToMoPage = () => {
      redirect('/mo');
    };

    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.email}!</p>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Back to Mo page
        </button>

        <button 
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
            Back to Home
        </button>
     </div>
    );
}