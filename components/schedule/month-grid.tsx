"use client"

import { ko } from "date-fns/locale"
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { useMemo } from "react"

import { cn } from "@/lib/utils"
import type { ScheduleEventJson } from "@/lib/schedule/types"

type MonthGridProps = {
  events: ScheduleEventJson[]
  monthAnchorDateKey: string
  todayDateKey: string | null
  onSelectDay: (dateKey: string) => void
}

export function MonthGrid({
  events,
  monthAnchorDateKey,
  todayDateKey,
  onSelectDay,
}: MonthGridProps) {
  const anchor = parseISO(`${monthAnchorDateKey}T12:00:00`)
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of events) {
      m.set(e.dateKey, (m.get(e.dateKey) ?? 0) + 1)
    }
    return m
  }, [events])

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <p className="text-sm font-medium">
          {format(anchor, "yyyy년 M월", { locale: ko })}
        </p>
        <p className="text-muted-foreground text-xs">날짜를 누르면 타임라인으로 이동합니다.</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd")
          const inMonth = isSameMonth(d, anchor)
          const count = counts.get(key) ?? 0
          const today = todayDateKey !== null && key === todayDateKey
          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth || count === 0}
              onClick={() => onSelectDay(key)}
              className={cn(
                "flex min-h-16 flex-col items-center gap-1 rounded-lg border border-transparent p-1 text-xs transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/50",
                count > 0 &&
                  inMonth &&
                  "hover:bg-accent/80 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                today && inMonth && "border-primary/40 bg-primary/5",
                (!inMonth || count === 0) && "cursor-default opacity-50",
              )}
            >
              <span className={cn("tabular-nums", today && "font-semibold")}>
                {format(d, "d")}
              </span>
              {count > 0 ? (
                <span
                  className={cn(
                    "inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums",
                    today
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                  aria-label={`일정 ${count}건`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              ) : (
                <span className="min-h-4" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
