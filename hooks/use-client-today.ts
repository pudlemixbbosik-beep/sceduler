"use client"

import { useEffect, useState } from "react"

const SEOUL_TZ = "Asia/Seoul"

function formatDateKeySeoul(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function formatTodayLabelSeoul(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date)
}

export type ClientTodayInfo = {
  dateKey: string
  label: string
}

/**
 * Seoul 기준 "오늘" — 마운트 전에는 null이라 서버 HTML과 첫 클라 렌더가 동일합니다.
 * (정적 사전 렌더 + 하이드레이션 시각 차로 인한 불일치 방지)
 */
export function useClientTodayInfo(): ClientTodayInfo | null {
  const [info, setInfo] = useState<ClientTodayInfo | null>(null)

  useEffect(() => {
    const now = new Date()
    setInfo({
      dateKey: formatDateKeySeoul(now),
      label: formatTodayLabelSeoul(now),
    })
  }, [])

  return info
}
