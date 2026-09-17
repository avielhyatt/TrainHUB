import type { ReactNode } from 'react'

export default function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-ink-800">{title}</h1>
      {action}
    </div>
  )
}
