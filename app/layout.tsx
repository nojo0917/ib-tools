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
          {/* The main content grows to push the footer down */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Professional Footer */}
          <footer className="w-full border-t border-border py-8 mt-auto bg-card/50">
            <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                © 2026 IB Study Tools
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Questions or Feedback?</span>
                <a 
                  href="mailto:ibstudytools.contact@gmail.com" 
                  className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors"
                >
                  ibstudytools.contact@gmail.com
                </a>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}