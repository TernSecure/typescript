import { auth } from "@tern-secure/nextjs/server"
import { SecondProtected } from "./second-protected"

export default async function ProtectedPage() {
    const session = await auth();

    if (!session || !session.user) return null

    const user = session.user;

    return <SecondProtected user={user} />
}