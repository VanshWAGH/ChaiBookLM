import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthTokenProvider } from "@/components/providers/auth-token-provider";
import QueryProvider from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const figtreeHeading = Figtree({ subsets: ['latin'], variable: '--font-heading' });

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LexAssist - Legal AI for Startups",
  description: "Your AI Legal Co-founder — upload contracts and get instant legal analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable, figtreeHeading.variable)}
      suppressHydrationWarning
    >
  <body className="min-h-full flex flex-col">
    <ClerkProvider>
      <AuthTokenProvider>
      <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      >
      <QueryProvider>
      <ToastProvider />
      {children}
      </QueryProvider>
      </ThemeProvider>
      </AuthTokenProvider>
    </ClerkProvider>
  </body>
    </html >
  );
}