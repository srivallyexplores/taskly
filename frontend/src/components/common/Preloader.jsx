import { useEffect, useState } from 'react'

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hide preloader after initial load
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Remove preloader from DOM
      const preloader = document.getElementById('page-loading-blocs-notifaction')
      if (preloader) {
        preloader.style.display = 'none'
      }
    }, 500) // Small delay to show preloader briefly

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return null // The preloader is handled by the HTML element
}

export default Preloader