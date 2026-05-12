"use client"

import { Search } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ScheduleEventJson } from "@/lib/schedule/types"

export type DoneFilter = "all" | "done" | "todo"

type ScheduleFiltersProps = {
  events: ScheduleEventJson[]
  department: string
  onDepartmentChange: (v: string) => void
  doneFilter: DoneFilter
  onDoneFilterChange: (v: DoneFilter) => void
  query: string
  onQueryChange: (v: string) => void
  onScrollToday: () => void
}

export function ScheduleFilters({
  events,
  department,
  onDepartmentChange,
  doneFilter,
  onDoneFilterChange,
  query,
  onQueryChange,
  onScrollToday,
}: ScheduleFiltersProps) {
  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const e of events) {
      if (e.department) set.add(e.department)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"))
  }, [events])

  return (
    <div className="bg-card/60 flex flex-col gap-4 rounded-xl border border-border/60 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid w-full gap-2 sm:min-w-[200px] sm:flex-1">
        <Label htmlFor="schedule-search" className="text-muted-foreground">
          검색
        </Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id="schedule-search"
            className="pl-9"
            placeholder="제목·비고·부서…"
            value={query}
            onChange={(ev) => onQueryChange(ev.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid w-full gap-2 sm:min-w-[180px] sm:flex-1">
        <Label className="text-muted-foreground">담당 부서</Label>
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 부서</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full gap-2 sm:min-w-[180px] sm:flex-1">
        <Label className="text-muted-foreground">진행 상태</Label>
        <Select
          value={doneFilter}
          onValueChange={(v) => onDoneFilterChange(v as DoneFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="done">완료만</SelectItem>
            <SelectItem value="todo">미완료만</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onScrollToday}>
        오늘로 이동
      </Button>
    </div>
  )
}
