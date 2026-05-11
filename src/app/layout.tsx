import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import { Navigation } from "@/components/layout/navigation"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "武大美食指北 — 武汉大学校园美食平台",
    template: "%s — 武大美食指北",
  },
  description: "武汉大学校园美食平台 — 分区浏览、美食地图、排行榜、广八路美食 PK",
  keywords: ["武汉大学", "武大", "美食", "食堂", "珞珈", "广八路", "校园美食", "WHU"],
  authors: [{ name: "武大美食指北" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "武大美食指北",
    description: "武汉大学校园美食平台 — 发现武大每一口美味",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "武大美食指北",
    description: "武汉大学校园美食平台",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "武大美食",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#3b82f6" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body suppressHydrationWarning className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Navigation />
              <main className="flex-1 pb-16 lg:pb-0">{children}</main>
            </div>
          </div>
          <BottomNav />
          <MobileSidebar />
        </Providers>
      </body>
    </html>
  )
}
