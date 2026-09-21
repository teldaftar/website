import axios from 'axios'
import { api } from './http'
import type { DailyStat, StatExportQuery, StatisticsSummary, StatRangeQuery } from './types'

/** A file the API handed back, ready for `saveBlob`. */
export interface DownloadedFile {
  blob: Blob
  filename: string
}

export const statisticsApi = {
  summary(query: StatRangeQuery) {
    return api.get<StatisticsSummary>('/statistics/summary', { params: query }).then((r) => r.data)
  },
  daily(query: StatRangeQuery) {
    return api.get<DailyStat[]>('/statistics/daily', { params: query }).then((r) => r.data)
  },
  /** Multi-sheet Excel report. Building it is slower than a JSON read — allow more time. */
  exportXlsx(query: StatExportQuery): Promise<DownloadedFile> {
    return api
      .get<Blob>('/statistics/export', {
        params: query,
        responseType: 'blob',
        timeout: 120_000,
      })
      .then((r) => ({
        blob: r.data,
        filename: filenameFromDisposition(r.headers['content-disposition']) ?? 'hisobot.xlsx',
      }))
      .catch(async (err: unknown) => {
        throw await unwrapBlobError(err)
      })
  },
}

/** Pull `filename="…"` out of a Content-Disposition header. */
function filenameFromDisposition(header: unknown): string | null {
  if (typeof header !== 'string') return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

/**
 * On a `responseType: 'blob'` request the error body arrives as a Blob too, so
 * `normalizeError` can't see the backend's `{ code, message }`. Re-hydrate it
 * in place before the error reaches the toast.
 */
async function unwrapBlobError(err: unknown): Promise<unknown> {
  if (!axios.isAxiosError(err) || !(err.response?.data instanceof Blob)) return err
  try {
    err.response.data = JSON.parse(await err.response.data.text())
  } catch {
    // Not JSON (e.g. a proxy error page) — leave it, the generic message applies.
  }
  return err
}
