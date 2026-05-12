import fs from "fs"
import path from "path"

import { parseScheduleXlsxBuffer } from "./parse-xlsx"
import type { ScheduleEventJson } from "./types"

const DEFAULT_FILENAME = "golden-rabbit-2025-12.xlsx"

export function loadScheduleFromDataDir(filename = DEFAULT_FILENAME): ScheduleEventJson[] {
  const filePath = path.join(process.cwd(), "data", filename)
  const buffer = fs.readFileSync(filePath)
  return parseScheduleXlsxBuffer(buffer)
}
