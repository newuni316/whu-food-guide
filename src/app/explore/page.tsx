import { Suspense } from "react"
import { getCafeterias } from "@/lib/api"
import { CafeteriaGrid } from "@/components/cafeteria-grid"
import { SearchBar } from "@/components/search-bar"
import { CampusFilter } from "@/components/campus-filter"

export const metadata = {
  title: "探索美食",
  description: "探索武汉大学所有食堂和美食",
}

function ExploreContent() {
  return (
    <div className="mb-8 space-y-4">
      <SearchBar />
      <Suspense fallback={<div className="h-10 rounded-full bg-secondary/50 skeleton w-96" />}>
        <CampusFilter />
      </Suspense>
    </div>
  )
}

export default async function ExplorePage() {
  const cafeterias = await getCafeterias()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">探索美食</h1>
        <p className="mt-2 text-muted-foreground">
          发现武大校园内的所有食堂、摊位和美食
        </p>
      </div>
      <ExploreContent />
      <CafeteriaGrid cafeterias={cafeterias} />
    </div>
  )
}
