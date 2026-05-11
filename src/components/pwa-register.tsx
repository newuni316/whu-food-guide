"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
        }
      }).then(() => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch(() => {})
      })
    }
  }, [])

  return null
}
