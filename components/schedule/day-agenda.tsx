"use client"

import { ko } from "date-fns/locale"
import { format, parseISO } from "date-fns"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { ScheduleEventJson } from "@/lib/schedule/types"

function formatTime(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

type DayAgendaProps = {
  events: ScheduleEventJson[]
  todayDateKey: string | null
}

export function DayAgenda({ events, todayDateKey }: DayAgendaProps) {
  const groups = useMemo(() => {
    const map = new Map<string, ScheduleEventJson[]>()
    for (const e of events) {
      const list = map.get(e.dateKey)
      if (list) list.push(e)
      else map.set(e.dateKey, [e])
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const tKey = todayDateKey

  return (
    <ScrollArea className="h-[min(70vh,720px)] pr-3">
      <div className="flex flex-col gap-6 pb-6">
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">조건에 맞는 일정이 없습니다.</p>
        ) : (
          groups.map(([dateKey, dayEvents]) => {
            const dayDate = parseISO(`${dateKey}T12:00:00`)
            const isTodayRow = tKey !== null && dateKey === tKey
            return (
              <section
                key={dateKey}
                id={`day-${dateKey}`}
                aria-labelledby={`heading-${dateKey}`}
                className="scroll-mt-24"
              >
                <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <h2
                      id={`heading-${dateKey}`}
                      className={cn("text-base font-semibold", isTodayRow && "text-primary")}
                    >
                      {format(dayDate, "M월 d일 EEEE", { locale: ko })}
                    </h2>
                    {isTodayRow ? (
                      <Badge className="font-normal">오늘</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {dayEvents.length}건
                      </span>
                    )}
                  </div>
                  <Separator />
                </div>
                <ul className="mt-3 flex list-none flex-col gap-3">
                  {dayEvents.map((e) => (
                    <li key={e.id}>
                      <Card
                        className={cn(
                          "border-border/60 shadow-sm transition-opacity",
                          e.done && "opacity-70",
                        )}
                      >
                        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 py-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-muted-foreground text-xs tabular-nums">
                              {formatTime(e.minutesFromMidnight)}
                              {e.weekdayLabel ? (
                                <span className="sr-only"> ({e.weekdayLabel})</span>
                              ) : null}
                            </p>
                            <p
                              className={cn(
                                "text-sm leading-snug font-medium",
                                e.done && "text-muted-foreground line-through",
                              )}
                            >
                              {e.title}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1">
                            {e.department ? (
                              <Badge variant="secondary" className="font-normal">
                                {e.department}
                              </Badge>
                            ) : null}
                            <Badge variant={e.done ? "default" : "outline"} className="font-normal">
                              {e.done ? "완료" : "진행"}
                            </Badge>
                          </div>
                        </CardHeader>
                        {e.notes ? (
                          <CardContent className="text-muted-foreground pb-3 text-sm leading-relaxed">
                            {e.notes}
                          </CardContent>
                        ) : null}
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </div>
    </ScrollArea>
  )
}
