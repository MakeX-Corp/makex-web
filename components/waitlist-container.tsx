'use client'

import { AppleIcon } from '@/components/icon-utils'
import { Button } from '@/components/ui/button'

export default function WaitlistContainer() {
  return (
    <div className="w-full flex justify-center my-8">
      <Button asChild size="lg" className="text-lg">
        <a
          href="https://testflight.apple.com/join/yuPwpH4t"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppleIcon className="w-6 h-6" />
          Download Beta
        </a>
      </Button>
    </div>
  )
} 