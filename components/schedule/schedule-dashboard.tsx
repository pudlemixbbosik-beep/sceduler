"use client"

import { useCallback, useMemo, useState } from "react"

import { DayAgenda } from "@/components/schedule/day-agenda"
import { KpiSummary } from "@/components/schedule/kpi-summary"
import { MonthGrid } from "@/components/schedule/month-grid"
import {
  DoneFilter,
  ScheduleFilters,
} from "@/components/schedule/schedule-filters"
import { ScheduleTableView } from "@/components/schedule/schedule-table-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClientTodayInfo } from "@/hooks/use-client-today"
import type { ScheduleEventJson } from "@/lib/schedule/types"

type ScheduleDashboardProps = {
  events: ScheduleEventJson[]
}

export function ScheduleDashboard({ events }: ScheduleDashboardProps) {
  const todayInfo = useClientTodayInfo()
  const [tab, setTab] = useState("timeline")
  const [department, setDepartment] = useState("all")
  const [doneFilter, setDoneFilter] = useState<DoneFilter>("all")
  const [query, setQuery] = useState("")

  const monthAnchorDateKey = useMemo(() => {
    if (events.length > 0) {
      const mid = Math.floor(events.length / 2)
      return events[mid]!.dateKey
    }
    return todayInfo?.dateKey ?? "2025-12-01"
  }, [events, todayInfo?.dateKey])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) => {
      if (department !== "all" && e.department !== department) return false
      if (doneFilter === "done" && !e.done) return false
      if (doneFilter === "todo" && e.done) return false
      if (q) {
        const hay = `${e.title} ${e.notes} ${e.department}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [events, department, doneFilter, query])

  const scrollToDay = useCallback((dateKey: string) => {
    setTab("timeline")
    window.setTimeout(() => {
      document.getElementById(`day-${dateKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 80)
  }, [])

  const scrollToday = useCallback(() => {
    const k = todayInfo?.dateKey
    if (k) scrollToDay(k)
  }, [scrollToDay, todayInfo?.dateKey])

  const handlePickDay = useCallback(
    (dateKey: string) => {
      scrollToDay(dateKey)
    },
    [scrollToDay],
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">대시보드</p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          골든래빗 12월 일정
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          월 그리드로 밀도를 파악하고, 타임라인에서 하루 단위로 흐름을 읽을 수 있습니다. 표
          보기는 검색·필터와 함께 전체를 빠르게 훑기에 좋습니다.
        </p>
      </header>

      <KpiSummary events={filtered} todayInfo={todayInfo} />

      <ScheduleFilters
        events={events}
        department={department}
        onDepartmentChange={setDepartment}
        doneFilter={doneFilter}
        onDoneFilterChange={setDoneFilter}
        query={query}
        onQueryChange={setQuery}
        onScrollToday={scrollToday}
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="grid w-full grid-cols-3 md:inline-flex md:w-auto">
          <TabsTrigger value="calendar">월 그리드</TabsTrigger>
          <TabsTrigger value="timeline">타임라인</TabsTrigger>
          <TabsTrigger value="table">표</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="outline-none">
          <MonthGrid
            events={filtered}
            monthAnchorDateKey={monthAnchorDateKey}
            todayDateKey={todayInfo?.dateKey ?? null}
            onSelectDay={handlePickDay}
          />
        </TabsContent>
        <TabsContent value="timeline" className="outline-none">
          <DayAgenda
            events={filtered}
            todayDateKey={todayInfo?.dateKey ?? null}
          />
        </TabsContent>
        <TabsContent value="table" className="outline-none">
          <ScheduleTableView events={filtered} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
