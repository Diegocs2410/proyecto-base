import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Toaster } from "@/components/ui/toaster";
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
  title: "Proyecto Base Multitenant",
  description: "SaaS multitenant con Next.js, Vercel y Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full">
        <Suspense>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
