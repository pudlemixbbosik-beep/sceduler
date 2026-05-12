"use client"

import { ko } from "date-fns/locale"
import { format, parseISO } from "date-fns"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { ScheduleEventJson } from "@/lib/schedule/types"

function formatTime(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

type ScheduleTableViewProps = {
  events: ScheduleEventJson[]
}

export function ScheduleTableView({ events }: ScheduleTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[110px]">날짜</TableHead>
            <TableHead className="w-[72px]">시간</TableHead>
            <TableHead>주요 일정</TableHead>
            <TableHead className="w-[140px]">담당 부서</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="min-w-[200px]">비고</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                조건에 맞는 일정이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            events.map((e) => {
              const d = parseISO(`${e.dateKey}T12:00:00`)
              return (
                <TableRow key={e.id} className={cn(e.done && "opacity-70")}>
                  <TableCell className="align-top text-sm tabular-nums">
                    {format(d, "M/d (EEE)", { locale: ko })}
                  </TableCell>
                  <TableCell className="align-top text-sm tabular-nums">
                    {formatTime(e.minutesFromMidnight)}
                  </TableCell>
                  <TableCell className={cn("align-top text-sm", e.done && "line-through")}>
                    {e.title}
                  </TableCell>
                  <TableCell className="align-top text-sm">{e.department}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant={e.done ? "default" : "outline"} className="font-normal">
                      {e.done ? "완료" : "진행"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground align-top text-sm">
                    {e.notes}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
