import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Simple async data helper — loads on mount (or when deps change)
 * and exposes a manual `reload` function.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  options?: { immediate?: boolean; fallback?: T }
) {
  const [data, setData] = useState<T | null>(options?.fallback ?? null)
  const [loading, setLoading] = useState(options?.immediate !== false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      if (mounted.current) {
        setData(result)
        setLoading(false)
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      if (mounted.current) {
        if (options?.fallback !== undefined) setData(options.fallback)
        setError(message)
        setLoading(false)
      }
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mounted.current = true
    if (options?.immediate === false) return
    execute().catch(() => {
      /* error already stored */
    })
    return () => {
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload: execute, setData }
}
