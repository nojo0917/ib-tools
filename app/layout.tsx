import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IB Study Tools",
  description: "AI-powered tools for IB Diploma Programme students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning 
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Main Content Area */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Minimalist Footer */}
          <footer className="w-full border-t border-border py-6 mt-auto bg-card/30">
            <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                © 2026 IB Study Tools
              </p>
              <div className="flex gap-4">
                <span className="text-xs text-muted-foreground/50 italic">
                  Independent Educational Resource
                </span>
              </div>
            </div>
          </footer>

          {/* Floating Contact Button (Option 2) */}
          <div className="fixed bottom-6 right-6 z-50">
            <a 
              href="mailto:ibstudytools.contact@gmail.com"
              className="group relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-primary/20"
            >
              {/* Pulsing Notification Dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-300"></span>
              </span>
              
              <span className="text-xs font-semibold tracking-wide">
                Contact Support
              </span>
            </a>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}