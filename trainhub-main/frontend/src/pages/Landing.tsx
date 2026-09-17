import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'

const FEATURES = [
  { icon: '🗓️', titleKey: 'feature_schedule_title', descKey: 'feature_schedule_desc' },
  { icon: '🧑‍🤝‍🧑', titleKey: 'feature_patients_title', descKey: 'feature_patients_desc' },
  { icon: '💳', titleKey: 'feature_payments_title', descKey: 'feature_payments_desc' },
  { icon: '🎉', titleKey: 'feature_holidays_title', descKey: 'feature_holidays_desc' },
]

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 text-xl font-bold text-brand-700">
          <span>🏋️</span>
          <span>{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/trainers" className="text-sm font-medium text-ink-600 hover:text-brand-700">
            {t('landing.browse_trainers')}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-16 text-center">
        <h1 className="text-3xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
          {t('landing.title')}
        </h1>
        <p className="max-w-2xl text-base text-ink-500 sm:text-lg">{t('landing.subtitle')}</p>

        <div className="mt-4 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link
            to="/login"
            className="rounded-2xl bg-brand-600 px-10 py-5 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.02] hover:bg-brand-700 active:scale-[0.99]"
          >
            {t('landing.cta_login')}
          </Link>
          <Link
            to="/register"
            className="rounded-2xl border-2 border-brand-600 bg-white px-10 py-5 text-lg font-bold text-brand-700 shadow-sm transition-transform hover:scale-[1.02] hover:bg-brand-50 active:scale-[0.99]"
          >
            {t('landing.cta_register')}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-ink-800">{t('landing.features_title')}</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm shadow-ink-900/[0.03]">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-1.5 font-semibold text-ink-800">{t(`landing.${f.titleKey}`)}</h3>
              <p className="text-sm leading-relaxed text-ink-500">{t(`landing.${f.descKey}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-5 py-12 sm:grid-cols-2">
        <div className="rounded-2xl bg-brand-700 p-8 text-white">
          <div className="mb-3 text-3xl">🧑‍🏫</div>
          <h3 className="mb-2 text-xl font-bold">{t('landing.for_trainers_title')}</h3>
          <p className="text-brand-50">{t('landing.for_trainers_desc')}</p>
        </div>
        <Link to="/trainers" className="rounded-2xl bg-accent-500 p-8 text-white transition-transform hover:scale-[1.01]">
          <div className="mb-3 text-3xl">🏃</div>
          <h3 className="mb-2 text-xl font-bold">{t('landing.for_trainees_title')}</h3>
          <p className="text-orange-50">{t('landing.for_trainees_desc')}</p>
          <p className="mt-3 text-sm font-semibold underline">{t('landing.browse_trainers')} →</p>
        </Link>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-400">
        {t('app.name')} © {new Date().getFullYear()} — {t('landing.footer_rights')}
      </footer>
    </div>
  )
}
