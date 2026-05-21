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

          {/* Centered Footer */}
          <footer className="w-full border-t border-border py-10 mt-auto bg-card/20">
            <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center gap-4">
              
              {/* Branding/Copyright */}
              <div className="space-y-1">
                <p className="text-sm font-bold tracking-tight">
                  IB Study Tools
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  © 2026 • Independent Resource
                </p>
              </div>

              {/* Contact Link - Now back in the footer */}
              <a 
                href="mailto:ibstudytools.contact@gmail.com" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                ibstudytools.contact@gmail.com
              </a>

              {/* Ultra-minimal Disclaimer */}
              <p className="text-[10px] text-muted-foreground/40 max-w-sm mt-2">
                Not affiliated with the International Baccalaureate.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}