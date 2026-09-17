import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, apiErrorMessage } from '../../api/client'
import type { PaymentMethod, TrainerProfile as TrainerProfileType } from '../../api/types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import { Input, Textarea } from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bit', 'paybox']

export default function TrainerProfile() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [specialty, setSpecialty] = useState('')
  const [description, setDescription] = useState('')
  const [costPerHour, setCostPerHour] = useState('')
  const [payments, setPayments] = useState<Set<PaymentMethod>>(new Set())
  const [params, setParams] = useState<string[]>([])
  const [newParam, setNewParam] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    api.get<TrainerProfileType>('/trainers/me/profile').then(({ data }) => {
      setSpecialty(data.specialty || '')
      setDescription(data.description || '')
      setCostPerHour(data.cost_per_hour != null ? String(data.cost_per_hour) : '')
      setPayments(new Set(data.payment_methods))
      setParams(data.required_parameters)
      setIsPublic(data.is_public)
      setLoading(false)
    })
  }, [])

  function togglePayment(method: PaymentMethod) {
    setPayments((prev) => {
      const next = new Set(prev)
      if (next.has(method)) next.delete(method)
      else next.add(method)
      return next
    })
  }

  function addParam() {
    const trimmed = newParam.trim()
    if (trimmed && !params.includes(trimmed)) {
      setParams([...params, trimmed])
      setNewParam('')
    }
  }

  function removeParam(p: string) {
    setParams(params.filter((x) => x !== p))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.put('/trainers/me/profile', {
        specialty: specialty || null,
        description: description || null,
        required_parameters: params,
        cost_per_hour: costPerHour ? Number(costPerHour) : null,
        payment_methods: Array.from(payments),
        is_public: isPublic,
      })
      setMessage(t('profile.saved'))
    } catch (err) {
      setError(apiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title={t('profile.title')} />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label={t('profile.specialty')}
            placeholder={t('profile.specialty_placeholder')}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <Textarea
            label={t('profile.description')}
            placeholder={t('profile.description_placeholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">
              {t('profile.required_parameters')}
            </span>
            <span className="mb-2 block text-xs text-ink-400">{t('profile.required_parameters_desc')}</span>
            <div className="mb-2 flex flex-wrap gap-2">
              {params.map((p) => (
                <span
                  key={p}
                  className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-700"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => removeParam(p)}
                    className="cursor-pointer text-brand-400 hover:text-brand-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                value={newParam}
                onChange={(e) => setNewParam(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addParam()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addParam}>
                {t('profile.add_parameter')}
              </Button>
            </div>
          </div>

          <Input
            label={t('profile.cost_per_hour')}
            hint={t('profile.cost_per_hour_hint')}
            type="number"
            min={0}
            step={0.1}
            value={costPerHour}
            onChange={(e) => setCostPerHour(e.target.value)}
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-ink-700">{t('profile.payment_methods')}</span>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => togglePayment(method)}
                  className={`cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    payments.has(method)
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-500 hover:border-brand-300'
                  }`}
                >
                  {t(`profile.payment_${method}`)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 p-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span>
              <span className="block text-sm font-medium text-ink-700">{t('profile.public_profile')}</span>
              <span className="block text-xs text-ink-400">{t('profile.public_profile_desc')}</span>
            </span>
          </label>

          {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{message}</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={saving} className="self-start">
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
