'use client'

interface SettingsSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const personalSections = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
  ]

  return (
    <div className="w-full shrink-0 border-b border-border bg-sidebar p-4 lg:w-72 lg:border-b-0 lg:border-r lg:p-6 flex flex-col">
      {/* Personal Section */}
      <div className="mb-2 lg:mb-8">
        <h3 className="hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 lg:block">
          Personal
        </h3>
        <nav className="flex space-x-2 overflow-x-auto pb-2 lg:block lg:space-x-0 lg:space-y-2 lg:overflow-visible lg:pb-0">
          {personalSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-colors lg:w-full lg:text-left ${
                activeSection === section.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:bg-opacity-50'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}