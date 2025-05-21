import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Twitter } from 'lucide-react'

function DiscordIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const imageUrl = `https://makex.app/share.png?v=4`;
  
  return {
    title: 'Check out my app built with MakeX',
    description: 'I created this app using MakeX - a powerful platform for building and deploying applications. Try it out!',
    openGraph: {
      title: 'Check out my app built with MakeX',
      description: 'I created this app using MakeX - a powerful platform for building and deploying applications. Try it out!',
      siteName: 'MakeX',
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: 'MakeX Shared Content',
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Check out my app built with MakeX',
      description: 'I created this app using MakeX - a powerful platform for building and deploying applications. Try it out!',
      images: [imageUrl],
      creator: '@makexapp',
    },
    other: {
      'og:image:secure_url': imageUrl,
      'og:image:type': 'image/png',
      'og:image:width': '1200',
      'og:image:height': '630',
    },
  }
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        {children}
      </main>

      {/* Custom Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="MakeX Logo"
                width={24}
                height={24}
                className="h-6 w-auto"
              />
              <span className="text-sm text-muted-foreground">© 2025 MakeX. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <div className="flex items-center space-x-4">
                <a
                  href="https://twitter.com/makexapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://discord.com/invite/3EsUgb53Zp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <DiscordIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
