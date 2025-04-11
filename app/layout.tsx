import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "MakeX | Anyone can build",
  description:
    "Create fully functional iOS apps instantly with AI. No coding required.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MakeX",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* External stylesheets and scripts */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css"
        />
        <script src="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js"></script>
      </head>
      <body className="overflow-x-hidden antialiased min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="py-8 border-t mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-muted-foreground">© 2025 MakeX</div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="/terms" className="hover:text-foreground">
                  Terms
                </a>
                <a href="/privacy" className="hover:text-foreground">
                  Privacy
                </a>
                <a href="/refund" className="hover:text-foreground">
                  Refund Policy
                </a>
              </div>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
