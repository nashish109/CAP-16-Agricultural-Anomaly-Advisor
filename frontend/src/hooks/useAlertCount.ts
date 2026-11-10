import { useEffect, useState } from 'react'
import { alertService } from '../services'

export function useAlertCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    alertService
      .getAll()
      .then((alerts) => {
        if (!cancelled) {
          setCount(alerts.filter((a) => !a.read).length)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return count
}
