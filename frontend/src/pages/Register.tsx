import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'
import { Input, PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'
import LanguageSwitcher from '../components/LanguageSwitcher'
import type { UserRole } from '../api/types'

interface FormState {
  phone_number: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  birthday: string
  height_cm: string
  weight_kg: string
  role: UserRole | ''
}

const initialState: FormState = {
  phone_number: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
  birthday: '',
  height_cm: '',
  weight_kg: '',
  role: '',
}

export default function Register() {
  const { t, i18n } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.role) {
      setError(t('common.required_field'))
      return
    }
    if (form.password !== form.password_confirm) {
      setError(t('auth.password_confirm'))
      return
    }

    setLoading(true)
    try {
      const user = await register({
        phone_number: form.phone_number,
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name,
        last_name: form.last_name,
        birthday: form.birthday,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        role: form.role,
        preferred_language: i18n.resolvedLanguage || 'he',
      })
      navigate(user.role === 'trainer' ? '/trainer/dashboard' : '/trainee/trainers')
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-ink-50 px-4 py-10">
      <div className="mb-6 flex w-full max-w-xl items-center justify-between">
        <Link to="/" className="text-sm font-medium text-ink-500 hover:text-brand-700">
          ← {t('auth.back_home')}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-xl rounded-3xl border border-ink-100 bg-white p-8 shadow-sm shadow-ink-900/[0.03]">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">🏋️</div>
          <h1 className="text-xl font-bold text-ink-800">{t('auth.register_title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <span className="mb-2 block text-sm font-medium text-ink-700">
              {t('auth.role')}
              <span className="text-accent-600"> *</span>
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RoleCard
                icon="🧑‍🏫"
                title={t('auth.role_trainer')}
                desc={t('auth.role_trainer_desc')}
                selected={form.role === 'trainer'}
                onClick={() => update('role', 'trainer')}
              />
              <RoleCard
                icon="🏃"
                title={t('auth.role_trainee')}
                desc={t('auth.role_trainee_desc')}
                selected={form.role === 'trainee'}
                onClick={() => update('role', 'trainee')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.first_name')}
              required
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
            />
            <Input
              label={t('auth.last_name')}
              required
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
            />
          </div>

          <Input
            label={t('auth.phone_number')}
            required
            type="tel"
            inputMode="tel"
            value={form.phone_number}
            onChange={(e) => update('phone_number', e.target.value)}
          />

          <Input
            label={t('auth.birthday')}
            type="date"
            required
            value={form.birthday}
            onChange={(e) => update('birthday', e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={`${t('auth.height')} (${t('common.optional')})`}
              type="number"
              min={0}
              step={0.1}
              value={form.height_cm}
              onChange={(e) => update('height_cm', e.target.value)}
            />
            <Input
              label={`${t('auth.weight')} (${t('common.optional')})`}
              type="number"
              min={0}
              step={0.1}
              value={form.weight_kg}
              onChange={(e) => update('weight_kg', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              label={t('auth.password')}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
            <PasswordInput
              label={t('auth.password_confirm')}
              required
              minLength={6}
              value={form.password_confirm}
              onChange={(e) => update('password_confirm', e.target.value)}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
            {t('auth.submit_register')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            {t('auth.go_login')}
          </Link>
        </p>
      </div>
    </div>
  )
}

function RoleCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: string
  title: string
  desc: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-start transition-colors cursor-pointer ${
        selected ? 'border-brand-600 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold text-ink-800">{title}</span>
      <span className="text-xs text-ink-500">{desc}</span>
    </button>
  )
}
