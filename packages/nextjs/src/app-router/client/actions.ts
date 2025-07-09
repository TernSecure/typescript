'use server'

import { createSessionCookie, clearSessionCookie } from "@tern-secure/react";
import { NextCookieStore } from "../../utils/NextCookieAdapter";

export async function createSessionCookieServer(idToken: string) {
    const cookieStore = new NextCookieStore();
    return createSessionCookie(idToken, cookieStore);
}

export async function clearSessionCookieServer() {
    const cookieStore = new NextCookieStore();
    return clearSessionCookie(cookieStore);
}