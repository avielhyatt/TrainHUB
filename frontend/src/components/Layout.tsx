import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import Avatar from './ui/Avatar'

const trainerCoreLinks = [
  { to: '/trainer/dashboard', key: 'dashboard', icon: '📊' },
  { to: '/trainer/requests', key: 'requests', icon: '📥' },
  { to: '/trainer/schedule', key: 'schedule', icon: '🗓️' },
  { to: '/trainer/patients', key: 'patients', icon: '🧑‍🤝‍🧑' },
  { to: '/trainer/places', key: 'places', icon: '📍' },
  { to: '/trainer/profile', key: 'profile', icon: '⚙️' },
]

// Available to trainees, and to trainers acting as someone else's patient.
const traineeCoreLinks = [
  { to: '/trainee/trainers', key: 'my_trainers', icon: '🧑‍🏫' },
  { to: '/trainee/bookings', key: 'my_bookings', icon: '🗓️' },
]

const accountLink = { to: '/account', key: 'account', icon: '👤' }

export default function Layout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links =
    user?.role === 'trainer'
      ? [...trainerCoreLinks, ...traineeCoreLinks, accountLink]
      : [...traineeCoreLinks, accountLink]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-brand-700">
            <span className="text-xl">🏋️</span>
            <span>{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Link to="/account" className="hidden items-center gap-2 sm:flex">
              <Avatar
                photoUrl={user?.photo_url}
                firstName={user?.first_name}
                lastName={user?.last_name}
                verified={user?.is_verified}
                size="sm"
              />
              <span className="text-sm text-ink-500">
                {user?.first_name} {user?.last_name}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-xl border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
          <LanguageSwitcher className="shrink-0" />
        </nav>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-ink-600 hover:bg-white hover:text-ink-800'
                  }`
                }
              >
                <span>{link.icon}</span>
                <span>{t(`nav.${link.key}`)}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around gap-1 overflow-x-auto border-t border-ink-100 bg-white py-2 md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium ${
                isActive ? 'text-brand-700' : 'text-ink-400'
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            <span>{t(`nav.${link.key}`)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
