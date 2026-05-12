export const SCHEDULE_HEADERS = {
  date: "날짜",
  weekday: "요일",
  time: "시간",
  title: "주요 일정/내용",
  department: "담당 부서",
  done: "진행 상태 (완료 여부)",
  notes: "비고",
} as const

/** Parsed event for UI (JSON-serializable) */
export type ScheduleEventJson = {
  id: string
  dateKey: string
  startAt: string
  weekdayLabel: string
  title: string
  department: string
  done: boolean
  notes: string
  minutesFromMidnight: number
}
