import { ScheduleDashboard } from "@/components/schedule/schedule-dashboard"
import { loadScheduleFromDataDir } from "@/lib/schedule/load-schedule"

export default function Page() {
  const events = loadScheduleFromDataDir()

  return (
    <main className="min-h-svh bg-background">
      <ScheduleDashboard events={events} />
    </main>
  )
}
