export function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      ⭐ {rating}/10
    </span>
  )
}

export function RatingPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const scores = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div className="flex flex-wrap gap-1.5">
      {scores.map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className={`h-9 w-9 cursor-pointer rounded-lg border text-sm font-semibold transition-colors ${
            value === score
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-ink-200 text-ink-500 hover:border-amber-300'
          }`}
        >
          {score}
        </button>
      ))}
    </div>
  )
}
