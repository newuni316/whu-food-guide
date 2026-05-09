import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import { Navigation } from "@/components/layout/navigation"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "珞珈美食指南 — WHU Food Guide",
    template: "%s — 珞珈美食指南",
  },
  description: "武汉大学智慧校园美食平台 — AI 推荐、校园美食地图、食堂评价",
  keywords: ["武汉大学", "美食", "食堂", "珞珈", "whu", "校园美食"],
  authors: [{ name: "WHU Food Guide" }],
  openGraph: {
    title: "珞珈美食指南",
    description: "武汉大学智慧校园美食平台",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          <Navigation />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
