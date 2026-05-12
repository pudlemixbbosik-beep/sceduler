"use client"

import { ko } from "date-fns/locale"
import { format, parseISO } from "date-fns"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ScheduleEventJson } from "@/lib/schedule/types"
import type { ClientTodayInfo } from "@/hooks/use-client-today"

type KpiSummaryProps = {
  events: ScheduleEventJson[]
  todayInfo: ClientTodayInfo | null
}

export function KpiSummary({ events, todayInfo }: KpiSummaryProps) {
  const todayKey = todayInfo?.dateKey
  const total = events.length
  const done = events.filter((e) => e.done).length
  const todo = total - done
  const today = todayKey
    ? events.filter((e) => e.dateKey === todayKey).length
    : 0

  const rangeLabel =
    events.length > 0
      ? `${format(parseISO(events[0]!.dateKey), "yyyy년 M월 d일", { locale: ko })} · ${format(parseISO(events[events.length - 1]!.dateKey), "M월 d일", { locale: ko })}`
      : "데이터 없음"

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>기간</CardDescription>
          <CardTitle className="text-base font-semibold leading-snug">
            골든래빗 일정
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">{rangeLabel}</CardContent>
      </Card>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>전체 일정</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{total}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          필터와 탭으로 빠르게 찾을 수 있어요.
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>완료 / 미완료</CardDescription>
          <CardTitle className="flex flex-wrap items-baseline gap-2 text-2xl tabular-nums">
            <span>{done}</span>
            <span className="text-muted-foreground text-lg font-normal">/</span>
            <span>{todo}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">완료 {done}</Badge>
          <Badge variant="outline">남은 일 {todo}</Badge>
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>오늘 일정</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{today}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          오늘 날짜:{" "}
          <span className="text-foreground font-medium">
            {todayInfo?.label ?? "—"}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
