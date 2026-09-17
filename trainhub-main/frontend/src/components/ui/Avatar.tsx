const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

const BADGE_SIZES = {
  sm: 'h-3.5 w-3.5 text-[8px]',
  md: 'h-4.5 w-4.5 text-[10px]',
  lg: 'h-6 w-6 text-xs',
  xl: 'h-8 w-8 text-sm',
}

interface Props {
  photoUrl?: string | null
  firstName?: string
  lastName?: string
  size?: keyof typeof SIZES
  verified?: boolean
  className?: string
}

export default function Avatar({
  photoUrl,
  firstName = '',
  lastName = '',
  size = 'md',
  verified = false,
  className = '',
}: Props) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${firstName} ${lastName}`.trim()}
          className={`${SIZES[size]} rounded-full object-cover`}
        />
      ) : (
        <span className={`flex ${SIZES[size]} items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700`}>
          {initials}
        </span>
      )}
      {verified && (
        <span
          title="Verified"
          className={`absolute -bottom-0.5 -end-0.5 flex ${BADGE_SIZES[size]} items-center justify-center rounded-full bg-brand-600 font-bold text-white ring-2 ring-white`}
        >
          ✓
        </span>
      )}
    </span>
  )
}
