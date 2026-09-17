import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../api/client'
import { Input, PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        phone_number: phone,
        last_name: lastName,
        birthday,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      setSuccess(true)
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-10">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link to="/login" className="text-sm font-medium text-ink-500 hover:text-brand-700">
          ← {t('auth.go_login')}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-8 shadow-sm shadow-ink-900/[0.03]">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">🔑</div>
          <h1 className="text-xl font-bold text-ink-800">{t('auth.reset_password_title')}</h1>
          <p className="mt-2 text-sm text-ink-500">{t('auth.reset_password_desc')}</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-sm text-ink-600">{t('auth.reset_password_success')}</p>
            <Link to="/login">
              <Button>{t('auth.go_login')}</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t('auth.phone_number')}
              required
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label={t('auth.last_name')}
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input
              label={t('auth.birthday')}
              type="date"
              required
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <PasswordInput
              label={t('auth.new_password')}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              label={t('auth.new_password_confirm')}
              required
              minLength={6}
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
            />

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              {t('auth.reset_password_submit')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
