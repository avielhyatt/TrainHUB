import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PublicTrainerCard } from '../api/types'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Select } from '../components/ui/Field'
import TrainerListCard from '../components/TrainerListCard'
import SwipeDeck from '../components/SwipeDeck'

const LIKED_KEY = 'trainhub_liked_trainers'

function loadLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

type SortBy = 'rating' | 'cost_asc' | 'cost_desc' | 'name'
type ViewMode = 'list' | 'swipe'

export default function PublicTrainers() {
  const { t } = useTranslation()
  const [trainers, setTrainers] = useState<PublicTrainerCard[] | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [maxCost, setMaxCost] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('rating')

  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikedIds)

  useEffect(() => {
    api.get<PublicTrainerCard[]>('/public/trainers').then(({ data }) => setTrainers(data))
  }, [])

  function persistLiked(next: Set<string>) {
    setLikedIds(next)
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(next)))
  }

  function handleLike(id: string) {
    const next = new Set(likedIds)
    next.add(id)
    persistLiked(next)
  }

  function handleSkip() {
    // no persistence needed for skips; just advances the deck
  }

  const specialties = useMemo(() => {
    if (!trainers) return []
    const set = new Set(trainers.map((t) => t.specialty).filter((s): s is string => !!s))
    return Array.from(set).sort()
  }, [trainers])

  const filtered = useMemo(() => {
    if (!trainers) return []
    const searchLower = search.trim().toLowerCase()
    const maxCostNum = maxCost ? Number(maxCost) : null

    let result = trainers.filter((tr) => {
      if (searchLower) {
        const haystack = `${tr.first_name} ${tr.last_name} ${tr.specialty || ''} ${tr.description || ''}`.toLowerCase()
        if (!haystack.includes(searchLower)) return false
      }
      if (specialty && tr.specialty !== specialty) return false
      if (maxCostNum != null && (tr.cost_per_hour == null || tr.cost_per_hour > maxCostNum)) return false
      if (verifiedOnly && !tr.is_verified) return false
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'cost_asc':
          return (a.cost_per_hour ?? Infinity) - (b.cost_per_hour ?? Infinity)
        case 'cost_desc':
          return (b.cost_per_hour ?? -Infinity) - (a.cost_per_hour ?? -Infinity)
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        case 'rating':
        default:
          return (b.avg_rating ?? -1) - (a.avg_rating ?? -1)
      }
    })

    return result
  }, [trainers, search, specialty, maxCost, verifiedOnly, sortBy])

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
            <span>🏋️</span>
            <span>{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-brand-700">
              {t('landing.cta_login')}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-ink-900">{t('publicTrainers.title')}</h1>
            <p className="text-ink-500">{t('publicTrainers.subtitle')}</p>
          </div>
          <div className="inline-flex rounded-full border border-ink-200 bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              📋 {t('publicTrainers.view_list')}
            </button>
            <button
              onClick={() => setViewMode('swipe')}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'swipe' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              🔥 {t('publicTrainers.view_swipe')}
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">{t('publicTrainers.search')}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('publicTrainers.search_placeholder')}
              className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <div className="min-w-[160px]">
            <Select label={t('publicTrainers.specialty')} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">{t('publicTrainers.all_specialties')}</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <label className="flex w-32 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">{t('publicTrainers.max_cost')}</span>
            <input
              type="number"
              min={0}
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              placeholder={`${t('dashboard.currency')}/${t('trainee.hour_abbr')}`}
              className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <div className="min-w-[170px]">
            <Select label={t('publicTrainers.sort_by')} value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="rating">{t('publicTrainers.sort_rating')}</option>
              <option value="cost_asc">{t('publicTrainers.sort_cost_asc')}</option>
              <option value="cost_desc">{t('publicTrainers.sort_cost_desc')}</option>
              <option value="name">{t('publicTrainers.sort_name')}</option>
            </Select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 pb-2.5">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm font-medium text-ink-700">✓ {t('publicTrainers.verified_only')}</span>
          </label>
        </div>

        {trainers === null ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🧑‍🏫" text={t('publicTrainers.no_trainers')} />
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trainer) => (
              <TrainerListCard key={trainer.id} trainer={trainer} />
            ))}
          </div>
        ) : (
          <SwipeDeck
            key={filtered.map((t) => t.id).join(',')}
            trainers={filtered}
            likedIds={likedIds}
            onLike={handleLike}
            onSkip={handleSkip}
            onReset={() => {}}
          />
        )}
      </div>
    </div>
  )
}
