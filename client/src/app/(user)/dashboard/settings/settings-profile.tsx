'use client'

import EdikitButton from '@/components/ShimmerButton/ShimmerButton'
import { useProfileSettings } from '@/hooks/useProfileSettings'

interface ProfileSectionProps {
  username: string
  email: string
}

export default function ProfileSection({ username, email }: ProfileSectionProps) {
  const {
    name,
    setName,
    emailValue,
    isSaving,
    error,
    success,
    handleSave,
    handleDeleteAccount,
  } = useProfileSettings(username, email)

  return (
    <div className="space-y-8">
      {/* Profile Update Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Profile</h2>
        <p className="text-muted-foreground text-sm mb-6">Update your name and email address</p>

        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
              placeholder="Your name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={emailValue}
              disabled
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input/50 text-muted-foreground focus:outline-none cursor-not-allowed transition-colors"
              placeholder="your@email.com"
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">{success}</p>
            </div>
          )}

          
          <EdikitButton 
          onClick={handleSave}
          disabled={isSaving}
          size='md'
          variant='secondary'
          >
            {isSaving ? 'Saving...' : 'Save'}
          </EdikitButton>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="border-t border-border pt-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">Delete account</h2>
        <p className="text-muted-foreground text-sm mb-6">Delete your account and all of its resources</p>

        <button
          onClick={handleDeleteAccount}
          className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-80 cursor-pointer transition-opacity"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}