'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Loader2 } from 'lucide-react'

export default function WaitlistContainer() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('https://api.getwaitlist.com/api/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          waitlist_id: 26328, // Your waitlist ID
          referral_link: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join waitlist')
      }

      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Waitlist'
            )}
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        {success && (
          <p className="text-sm text-primary">
            Thanks for joining! Check your email for confirmation.
          </p>
        )}
      </form>
    </div>
  )
} 