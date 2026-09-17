export default function StatTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: string
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm shadow-ink-900/[0.03]">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-ink-900">{value}</div>
    </div>
  )
}
