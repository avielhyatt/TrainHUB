import { useTranslation } from 'react-i18next'

const LANGS: { code: string; label: string }[] = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
]

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()

  return (
    <div className={`inline-flex rounded-full border border-ink-200 bg-white p-0.5 text-xs ${className}`}>
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors ${
            i18n.resolvedLanguage === lang.code
              ? 'bg-brand-600 text-white'
              : 'text-ink-500 hover:bg-ink-50'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
