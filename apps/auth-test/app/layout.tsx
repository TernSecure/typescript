import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TernSecureProvider, UserButton } from "@tern-secure/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TernSecureProvider requireverification={false} customDomain="http://localhost:4000">
        <UserButton />
        {children}
        </TernSecureProvider>
      </body>
    </html>
  );
}
