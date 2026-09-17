import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'
import { Input, PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(phone, password)
      navigate(user.role === 'trainer' ? '/trainer/dashboard' : '/trainee/trainers')
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-10">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link to="/" className="text-sm font-medium text-ink-500 hover:text-brand-700">
          ← {t('auth.back_home')}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-8 shadow-sm shadow-ink-900/[0.03]">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">🏋️</div>
          <h1 className="text-xl font-bold text-ink-800">{t('auth.login_title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t('auth.phone_number')}
            required
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <PasswordInput
            label={t('auth.password')}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Link to="/reset-password" className="-mt-2 self-end text-xs font-medium text-brand-700 hover:underline">
            {t('auth.forgot_password')}
          </Link>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            {t('auth.submit_login')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            {t('auth.go_register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
