import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { SplashGate } from "@/components/SplashGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loop — Revise Smarter",
  description: "Stop forgetting what you solved. Loop helps you save, revisit, and master every DSA problem. Email reminders, smart tracking, all in one place.",
  icons: {
    icon: "/loop-icon.svg",
    apple: "/loop-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SplashGate>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto w-full">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4 h-full">
                  {children}
                </div>
              </main>
            </div>
          </SplashGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
