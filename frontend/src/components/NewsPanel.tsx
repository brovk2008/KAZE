import { useQuery } from '@tanstack/react-query'
import { API } from '../api'
import type { NewsResult } from '../types'

export function NewsPanel() {
  const { data, isLoading, isError } = useQuery<NewsResult>({
    queryKey: ['news'],
    queryFn: () => fetch(API.news).then((r) => r.json()),
    staleTime: 5 * 60_000,
  })

  return (
    <div className="glass p-4 space-y-4">
      <p className="mono-label text-[9px]">AQI News — Tavily</p>

      {isLoading && (
        <p className="text-xs text-white/30 text-center py-6">Fetching news...</p>
      )}

      {isError && (
        <p className="text-xs text-red-400/60 text-center py-6">News unavailable</p>
      )}

      {data && (
        <>
          {data.summary && (
            <div className="border border-white/[0.06] rounded-lg p-3">
              <p className="mono-label text-[8px] text-white/40 mb-1">AI SUMMARY</p>
              <p className="text-xs text-white/60 leading-relaxed">{data.summary}</p>
            </div>
          )}

          <div className="space-y-2">
            {data.articles?.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-white/[0.06] rounded-lg p-3 transition-colors hover:border-white/20 hover:bg-white/[0.02]"
              >
                <p className="text-xs text-white/80 leading-snug mb-1.5 line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="mono-label text-[7px] text-white/30">{a.source}</span>
                  <span
                    className="mono-label text-[7px]"
                    style={{
                      color:
                        a.score >= 0.8
                          ? '#00B050'
                          : a.score >= 0.6
                            ? '#FFFF00'
                            : '#94A3B8',
                    }}
                  >
                    {Math.round(a.score * 100)}%
                  </span>
                </div>
              </a>
            ))}
          </div>

          {data.fetched_at && (
            <p className="mono-label text-[7px] text-white/20 text-center">
              fetched {new Date(data.fetched_at).toLocaleTimeString('en-IN')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
