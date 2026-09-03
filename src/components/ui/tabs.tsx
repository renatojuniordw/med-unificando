'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultValue?: string
}

export function Tabs({ tabs, defaultValue }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.id)

  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0]

  return (
    <div>
      <div role="tablist" aria-label="Configuração por cliente" className="flex flex-wrap gap-1 border-b border-[var(--color-border)] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab?.id}
            onClick={() => setActive(tab.id)}
            className={`px-3 py-2 text-sm font-medium rounded-t-sm -mb-px border-b-2 transition-colors ${
              tab.id === activeTab?.id
                ? 'border-brand-yellow text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab && <div role="tabpanel">{activeTab.content}</div>}
    </div>
  )
}