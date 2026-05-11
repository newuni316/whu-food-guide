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
        // Clear all caches to prevent stale chunks from being served
        if ("caches" in window) {
          return caches.keys().then((names) =>
            Promise.all(names.map((name) => caches.delete(name)))
          )
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
