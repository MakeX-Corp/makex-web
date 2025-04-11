import { ReactNode } from 'react'

interface MobileMockupProps {
  children: ReactNode
  className?: string
}

export default function MobileMockup({ children, className = '' }: MobileMockupProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative w-[292.6px] h-[595.65px] rounded-[44px] bg-black p-[12px] shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[27.5px] w-[165px] bg-black rounded-b-[14px] z-20" />
        
        {/* Screen */}
        <div className="relative h-full w-full rounded-[32px] overflow-hidden bg-white">
          <div className="flex h-full flex-col">

            {/* App Content */}
            <div className="flex-grow overflow-hidden">
              {children}
            </div>
          </div>
        </div>

        {/* Power Button */}
        <div className="absolute right-[-2px] top-[120px] w-[3px] h-[30px] bg-neutral-800 rounded-l-sm" />
        
        {/* Volume Buttons */}
        <div className="absolute left-[-2px] top-[100px] w-[3px] h-[30px] bg-neutral-800 rounded-r-sm" />
        <div className="absolute left-[-2px] top-[140px] w-[3px] h-[60px] bg-neutral-800 rounded-r-sm" />
      </div>
    </div>
  )
}
