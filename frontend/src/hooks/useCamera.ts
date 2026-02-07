import { useMemo, useState } from 'react'

export const useCamera = () => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const toggleFacingMode = () => {
    setFacingMode((current) => (current === 'environment' ? 'user' : 'environment'))
  }

  const videoConstraints = useMemo(
    () => ({
      facingMode: { ideal: facingMode },
    }),
    [facingMode],
  )

  return { facingMode, toggleFacingMode, videoConstraints }
}
