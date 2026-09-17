import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export interface CalendarEvent {
  id: string
  start: Date
  end: Date
  label: string
  sublabel?: string
  color: 'available' | 'pending' | 'accepted' | 'busy'
  onClick?: () => void
}

const COLOR_CLASSES: Record<CalendarEvent['color'], string> = {
  available: 'bg-brand-50 border-brand-300 text-brand-800 hover:bg-brand-100',
  pending: 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100',
  accepted: 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100',
  busy: 'bg-ink-100 border-ink-200 text-ink-400',
}

const HOUR_HEIGHT = 56 // px per hour

function startOfWeek(date: Date): Date {
  // Israeli week: Sunday first
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

interface Props {
  weekOf: Date
  onWeekChange: (date: Date) => void
  events: CalendarEvent[]
  startHour?: number
  endHour?: number
  onCellClick?: (date: Date) => void
}

export default function WeekCalendar({ weekOf, onWeekChange, events, startHour = 6, endHour = 23, onCellClick }: Props) {
  const { i18n } = useTranslation()
  const weekStart = useMemo(() => startOfWeek(weekOf), [weekOf])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000)), [weekStart])
  const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => startHour + i), [startHour, endHour])
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function eventsForDay(day: Date) {
    return events.filter((e) => e.start.toDateString() === day.toDateString())
  }

  function positionStyle(event: CalendarEvent) {
    const startMinutes = (event.start.getHours() - startHour) * 60 + event.start.getMinutes()
    const durationMinutes = Math.max((event.end.getTime() - event.start.getTime()) / 60000, 15)
    const top = (startMinutes / 60) * HOUR_HEIGHT
    const height = (durationMinutes / 60) * HOUR_HEIGHT
    return { top: `${top}px`, height: `${Math.max(height - 2, 20)}px` }
  }

  function handlePrevWeek() {
    onWeekChange(new Date(weekStart.getTime() - 7 * 86400000))
  }
  function handleNextWeek() {
    onWeekChange(new Date(weekStart.getTime() + 7 * 86400000))
  }
  function handleToday() {
    onWeekChange(new Date())
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="cursor-pointer rounded-lg border border-ink-200 px-2 py-1 text-ink-500 hover:bg-ink-50"
          >
            ‹
          </button>
          <button
            onClick={handleNextWeek}
            className="cursor-pointer rounded-lg border border-ink-200 px-2 py-1 text-ink-500 hover:bg-ink-50"
          >
            ›
          </button>
          <button
            onClick={handleToday}
            className="cursor-pointer rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-500 hover:bg-ink-50"
          >
            •
          </button>
        </div>
        <span className="text-sm font-semibold text-ink-700">
          {days[0].toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })} –{' '}
          {days[6].toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-[48px_repeat(7,1fr)]">
          <div className="border-b border-ink-100" />
          {days.map((day) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                key={day.toISOString()}
                className={`border-b border-s border-ink-100 py-2 text-center text-xs font-medium ${
                  isToday ? 'bg-brand-50 text-brand-700' : 'text-ink-500'
                }`}
              >
                <div>{day.toLocaleDateString(i18n.language, { weekday: 'short' })}</div>
                <div className={`text-sm ${isToday ? 'font-bold' : 'text-ink-700'}`}>{day.getDate()}</div>
              </div>
            )
          })}

          <div className="relative" style={{ height: totalHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-ink-50 text-end text-[10px] text-ink-300"
                style={{ top: (h - startHour) * HOUR_HEIGHT }}
              >
                <span className="relative -top-2 pe-1">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="relative border-s border-ink-100"
              style={{ height: totalHeight }}
              onClick={(e) => {
                if (!onCellClick || e.target !== e.currentTarget) return
                const rect = e.currentTarget.getBoundingClientRect()
                const offsetY = e.clientY - rect.top
                const hour = startHour + offsetY / HOUR_HEIGHT
                const clicked = new Date(day)
                clicked.setHours(Math.floor(hour), hour % 1 >= 0.5 ? 30 : 0, 0, 0)
                onCellClick(clicked)
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-ink-50"
                  style={{ top: (h - startHour) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                />
              ))}
              {eventsForDay(day).map((event) => (
                <button
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    event.onClick?.()
                  }}
                  disabled={!event.onClick}
                  className={`absolute inset-x-0.5 z-10 overflow-hidden rounded-md border px-1.5 py-0.5 text-start text-[11px] leading-tight transition-colors ${
                    event.onClick ? 'cursor-pointer' : 'cursor-default'
                  } ${COLOR_CLASSES[event.color]}`}
                  style={positionStyle(event)}
                >
                  <div className="font-semibold">{event.label}</div>
                  {event.sublabel && <div className="truncate opacity-80">{event.sublabel}</div>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
