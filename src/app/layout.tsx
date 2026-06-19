import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { NavAuth } from "@/components/NavAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeBody } from "@/components/ThemeBody";
import { ThemeStyles } from "@/components/ThemeStyles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hades Star Market",
  description: "Trade Hades Star artifacts between players",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#282a36",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme="dracula">
          <ThemeStyles />
          <AuthProvider>
            <NotificationProvider>
              <ThemeBody>
              <header className="border-b backdrop-blur-sm sticky top-0 z-50">
                <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
                  <Link href="/" className="text-lg sm:text-xl font-bold text-amber-400 shrink-0">
                    ⭐ Hades Star
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium overflow-x-auto">
                    <Link href="/" className="opacity-70 hover:opacity-100 transition whitespace-nowrap px-1">
                      Browse
                    </Link>
                    <Link href="/players" className="opacity-70 hover:opacity-100 transition whitespace-nowrap px-1">
                      Players
                    </Link>
                    <NavAuth />
                  </div>
                </nav>
              </header>
              <main className="flex-1 mx-auto w-full max-w-6xl px-3 sm:px-4 py-4 sm:py-8">
                {children}
              </main>
              <footer className="border-t py-3 sm:py-4 text-center text-xs opacity-40">
                Hades Star Market — Trade artifacts across the galaxy
              </footer>
              </ThemeBody>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
