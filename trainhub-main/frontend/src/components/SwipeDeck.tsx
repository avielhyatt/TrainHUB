import { useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import type { PublicTrainerCard } from '../api/types'

const SWIPE_THRESHOLD = 100
const VISIBLE_STACK = 3

interface Props {
  trainers: PublicTrainerCard[]
  likedIds: Set<string>
  onLike: (id: string) => void
  onSkip: (id: string) => void
  onReset: () => void
}

export default function SwipeDeck({ trainers, likedIds, onLike, onSkip, onReset }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const startX = useRef(0)

  const current = trainers[index]

  function triggerSwipe(direction: 'left' | 'right') {
    if (!current) return
    setExiting(direction)
    setDragging(false)
    window.setTimeout(() => {
      if (direction === 'right') onLike(current.id)
      else onSkip(current.id)
      setIndex((i) => i + 1)
      setExiting(null)
      setDragX(0)
    }, 200)
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (exiting) return
    setDragging(true)
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    setDragX(e.clientX - startX.current)
  }

  function handlePointerUp() {
    if (!dragging) return
    setDragging(false)
    if (dragX > SWIPE_THRESHOLD) triggerSwipe('right')
    else if (dragX < -SWIPE_THRESHOLD) triggerSwipe('left')
    else setDragX(0)
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
        <span className="text-4xl">🎉</span>
        <p className="text-ink-500">{t('publicTrainers.swipe_done')}</p>
        <p className="text-sm text-ink-400">
          {t('publicTrainers.liked_count', { count: likedIds.size })}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setIndex(0)
            onReset()
          }}
        >
          {t('publicTrainers.start_over')}
        </Button>
      </div>
    )
  }

  const stack = trainers.slice(index, index + VISIBLE_STACK)

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[480px] w-full max-w-sm">
        {stack.map((trainer, i) => {
          const isTop = i === 0
          const rotation = isTop ? dragX / 12 : 0
          const translateX = isTop ? dragX : 0
          let transform = `translateX(${translateX}px) rotate(${rotation}deg) scale(${1 - i * 0.04})`
          let opacity = 1
          if (isTop && exiting) {
            transform = `translateX(${exiting === 'right' ? 500 : -500}px) rotate(${exiting === 'right' ? 30 : -30}deg)`
            opacity = 0
          }
          return (
            <div
              key={trainer.id}
              onPointerDown={isTop ? handlePointerDown : undefined}
              onPointerMove={isTop ? handlePointerMove : undefined}
              onPointerUp={isTop ? handlePointerUp : undefined}
              className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lg select-none"
              style={{
                transform,
                opacity,
                top: i * 8,
                zIndex: VISIBLE_STACK - i,
                transition: dragging && isTop ? 'none' : 'transform 200ms ease, opacity 200ms ease',
                touchAction: 'none',
                cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
              }}
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-b from-brand-50 to-white p-6 text-center">
                <Avatar
                  photoUrl={trainer.photo_url}
                  firstName={trainer.first_name}
                  lastName={trainer.last_name}
                  verified={trainer.is_verified}
                  size="xl"
                />
                <div>
                  <h3 className="text-xl font-bold text-ink-900">
                    {trainer.first_name} {trainer.last_name}
                  </h3>
                  {trainer.specialty && <p className="font-medium text-brand-600">{trainer.specialty}</p>}
                </div>
                {trainer.description && (
                  <p className="line-clamp-3 text-sm text-ink-500">{trainer.description}</p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  {trainer.avg_rating != null ? (
                    <span className="font-semibold text-amber-600">⭐ {trainer.avg_rating}/10</span>
                  ) : (
                    <span className="text-ink-400">{t('publicTrainers.no_reviews_yet')}</span>
                  )}
                  {trainer.cost_per_hour != null && (
                    <span className="font-semibold text-ink-700">
                      {trainer.cost_per_hour} {t('dashboard.currency')}/{t('trainee.hour_abbr')}
                    </span>
                  )}
                </div>
              </div>
              {isTop && dragX > 30 && (
                <div className="pointer-events-none absolute top-6 start-6 rotate-[-12deg] rounded-lg border-4 border-brand-500 px-3 py-1 text-lg font-bold text-brand-500">
                  {t('publicTrainers.like')}
                </div>
              )}
              {isTop && dragX < -30 && (
                <div className="pointer-events-none absolute top-6 end-6 rotate-[12deg] rounded-lg border-4 border-ink-400 px-3 py-1 text-lg font-bold text-ink-400">
                  {t('publicTrainers.skip')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => triggerSwipe('left')}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-2xl text-ink-400 shadow-sm hover:bg-ink-50"
          aria-label={t('publicTrainers.skip')}
        >
          ✕
        </button>
        <button
          onClick={() => navigate(`/trainers/${current.id}`)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm hover:bg-ink-50"
          aria-label={t('publicTrainers.view_profile')}
        >
          ℹ️
        </button>
        <button
          onClick={() => triggerSwipe('right')}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-2xl text-brand-600 shadow-sm hover:bg-brand-100"
          aria-label={t('publicTrainers.like')}
        >
          ♥
        </button>
      </div>
      <p className="text-xs text-ink-400">{t('publicTrainers.swipe_hint')}</p>
    </div>
  )
}
