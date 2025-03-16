import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MakeX - Generate iOS Apps with AI",
  description: "Create fully functional iOS apps instantly with AI. No coding required.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "32x32",
      },
      {
        url: "/icon.png",
        sizes: "512x512",
      },
    ],
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css"
        />
        <script src="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}



import './globals.css'