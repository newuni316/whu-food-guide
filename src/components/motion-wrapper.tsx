"use client"

import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  fadeInUp,
  fadeIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
} from "@/lib/animations"

const variantMap: Record<string, Variants> = {
  "fade-in-up": fadeInUp,
  "fade-in": fadeIn,
  "slide-in-left": slideInLeft,
  "slide-in-right": slideInRight,
  "stagger-container": staggerContainer,
  "stagger-item": staggerItem,
}

interface MotionWrapperProps {
  variant?: keyof typeof variantMap
  delay?: number
  className?: string
  children: React.ReactNode
}

export function MotionWrapper({
  variant = "fade-in-up",
  delay = 0,
  className,
  children,
}: MotionWrapperProps) {
  const variants = variantMap[variant] || fadeInUp

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
