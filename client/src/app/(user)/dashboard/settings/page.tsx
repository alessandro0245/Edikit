'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { Eye, EyeOff } from 'lucide-react'
import SettingsSidebar from './settings-sidebar'
import ProfileSection from './settings-profile'
import PasswordSection from './settings-password'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const user = useSelector((state: RootState) => state.user.user)

  const username = user?.fullName || ''
  const email = user?.email || ''

  return (
    <div className="flex h-full flex-col lg:flex-row bg-background">
      <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and account settings</p>
          </div>

          {/* Content based on active section */}
          {activeSection === 'profile' && (
            <ProfileSection username={username} email={email} />
          )}
          
          {activeSection === 'password' && (
            <PasswordSection />
          )}

          {/* Placeholder for other sections */}
          {!['profile', 'password'].includes(activeSection) && (
            <div className="text-muted-foreground">
              This section is coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}