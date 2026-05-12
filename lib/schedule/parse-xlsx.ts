import * as XLSX from "xlsx"

import { SCHEDULE_HEADERS, type ScheduleEventJson } from "./types"

const EXCEL_DAY0 = new Date(1899, 11, 30)

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function excelSerialDayToDate(daySerial: number): Date {
  return addDays(EXCEL_DAY0, Math.floor(daySerial))
}

function excelTimeFractionToMinutes(frac: number): number {
  const total = Math.round(frac * 24 * 60)
  return Math.min(1439, Math.max(0, total))
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function combineDateAndMinutes(daySerial: number, minutesFromMidnight: number): Date {
  const base = excelSerialDayToDate(daySerial)
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  const out = new Date(base)
  out.setHours(h, m, 0, 0)
  return out
}

function parseDone(raw: unknown): boolean {
  if (raw === true || raw === false) return raw
  if (typeof raw === "number") return raw !== 0
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
  return s === "1" || s === "true" || s === "y" || s === "완료" || s === "o"
}

function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw.replace(/,/g, ""))
    return Number.isNaN(n) ? null : n
  }
  return null
}

function normalizeHeaderRow(row: unknown[]): string[] {
  return row.map((c) => String(c ?? "").trim())
}

function buildColumnMap(headers: string[]): Record<keyof typeof SCHEDULE_HEADERS, number> | null {
  const entries = Object.entries(SCHEDULE_HEADERS) as [keyof typeof SCHEDULE_HEADERS, string][]
  const map = {} as Record<keyof typeof SCHEDULE_HEADERS, number>
  for (const [key, label] of entries) {
    const idx = headers.indexOf(label)
    if (idx === -1) return null
    map[key] = idx
  }
  return map
}

function cellToTrimmedString(v: unknown): string {
  return String(v ?? "").trim()
}

export function parseScheduleXlsxBuffer(buffer: Buffer): ScheduleEventJson[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null }) as unknown[][]

  if (rows.length < 2) return []

  const headers = normalizeHeaderRow(rows[0] as unknown[])
  const col = buildColumnMap(headers)
  if (!col) {
    console.error("[schedule] Missing expected headers:", SCHEDULE_HEADERS, "got", headers)
    return []
  }

  const events: ScheduleEventJson[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row || row.length === 0) continue

    const dateRaw = row[col.date]
    const timeRaw = row[col.time]
    const title = cellToTrimmedString(row[col.title])
    if (!title) continue

    const timeNum = parseNumber(timeRaw)
    let minutesFromMidnight = 0
    if (timeNum !== null && timeNum >= 0 && timeNum < 1) {
      minutesFromMidnight = excelTimeFractionToMinutes(timeNum)
    }

    let startAt: Date
    if (dateRaw instanceof Date) {
      const base = new Date(
        dateRaw.getFullYear(),
        dateRaw.getMonth(),
        dateRaw.getDate(),
      )
      const h = Math.floor(minutesFromMidnight / 60)
      const m = minutesFromMidnight % 60
      startAt = new Date(base)
      startAt.setHours(h, m, 0, 0)
    } else {
      const daySerial = parseNumber(dateRaw)
      if (daySerial === null) continue
      startAt = combineDateAndMinutes(daySerial, minutesFromMidnight)
    }
    const dateKey = toDateKey(startAt)

    events.push({
      id: `r${i}-${dateKey}-${minutesFromMidnight}-${title.slice(0, 24)}`,
      dateKey,
      startAt: startAt.toISOString(),
      weekdayLabel: cellToTrimmedString(row[col.weekday]),
      title,
      department: cellToTrimmedString(row[col.department]),
      done: parseDone(row[col.done]),
      notes: cellToTrimmedString(row[col.notes]),
      minutesFromMidnight,
    })
  }

  events.sort((a, b) => {
    const dk = a.dateKey.localeCompare(b.dateKey)
    if (dk !== 0) return dk
    return a.minutesFromMidnight - b.minutesFromMidnight
  })

  return events
}
