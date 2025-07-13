import type React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Footer } from "../components/footer";
import { Header } from "../components/header";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "MakeX | Anyone can build",
  description:
    "Create fully functional iOS apps instantly with AI. No coding required.",
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
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Analytics />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
