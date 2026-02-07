import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CaseSummary } from '../lib/types'
import { supabase } from '../lib/supabase'

interface UseCasesOptions {
  searchTerm?: string
  statusFilter?: 'submitted' | 'reviewing' | 'completed' | 'all'
}

const demoCases: CaseSummary[] = [
  {
    id: 'DEMO-1001',
    patient_name: 'Jamie Park',
    body_part: 'Knee',
    status: 'submitted',
    created_at: new Date().toISOString(),
  },
  {
    id: 'DEMO-1002',
    patient_name: 'Morgan Lee',
    body_part: 'Shoulder',
    status: 'reviewing',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const useCases = (options: UseCasesOptions = {}) => {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCases = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!import.meta.env.VITE_SUPABASE_URL) {
      setCases(demoCases)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('id, body_part, status, created_at, users(full_name)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const mapped =
      data?.map((item) => {
        const users = (item as { users?: { full_name?: string } | { full_name?: string }[] }).users
        const patientName = Array.isArray(users) ? users[0]?.full_name : users?.full_name

        return {
          id: item.id,
          patient_name: patientName ?? 'Unknown',
          body_part: item.body_part,
          status: item.status,
          created_at: item.created_at,
        }
      }) ?? []

    setCases(mapped)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesStatus = options.statusFilter && options.statusFilter !== 'all'
        ? item.status === options.statusFilter
        : true
      const matchesSearch = options.searchTerm
        ? `${item.patient_name} ${item.body_part} ${item.id}`
            .toLowerCase()
            .includes(options.searchTerm.toLowerCase())
        : true

      return matchesStatus && matchesSearch
    })
  }, [cases, options.searchTerm, options.statusFilter])

  return { cases: filteredCases, loading, error, refresh: fetchCases }
}
