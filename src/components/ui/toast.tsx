"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToastStore, type Toast as ToastType } from "@/lib/toast"

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantClasses = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToastStore()
  const Icon = icons[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-md backdrop-blur-sm min-w-[300px] max-w-[420px]",
        variantClasses[toast.type],
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 max-md:left-4 max-md:right-4 max-md:top-4 max-md:bottom-auto max-md:items-center">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
