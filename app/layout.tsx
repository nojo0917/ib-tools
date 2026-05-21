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

// Comprehensive SEO Metadata
export const metadata: Metadata = {
  title: "IB Study Tools | AI Tutor, Practice Papers & AI Checker",
  description: "The all-in-one AI toolkit for IB students: AI Tutor, Exam Checker, AI Polisher, and custom Practice Papers. Built by an IB student to help you excel.",
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

          {/* Centered Professional Footer */}
          <footer className="w-full border-t border-border py-10 mt-auto bg-card/20">
            <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center gap-4">
              
              {/* Branding and Copyright */}
              <div className="space-y-1">
                <p className="text-sm font-bold tracking-tight">
                  IB Study Tools
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  © 2026 • Independent Resource
                </p>
              </div>

              {/* Contact Link with Email SVG Icon */}
              <a 
                href="mailto:ibstudytools.contact@gmail.com" 
                className="group text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="group-hover:scale-110 transition-transform duration-200"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="font-medium">ibstudytools.contact@gmail.com</span>
              </a>

              {/* Minimal Disclaimer */}
              <p className="text-[10px] text-muted-foreground/40 max-w-sm mt-2 leading-relaxed">
                Not affiliated with the International Baccalaureate.
                <br />
                Built for students by an IB student.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}