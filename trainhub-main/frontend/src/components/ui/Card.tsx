import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ children, className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-2xl border border-ink-100 bg-white p-5 shadow-sm shadow-ink-900/[0.03] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
