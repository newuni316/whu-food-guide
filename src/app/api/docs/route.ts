import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

export const dynamic = "force-static"

export function GET() {
  const specPath = join(process.cwd(), "docs", "api", "openapi.yaml")
  try {
    const spec = readFileSync(specPath, "utf-8")
    return new NextResponse(spec, {
      headers: {
        "Content-Type": "text/yaml",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "API spec not found" }, { status: 404 })
  }
}
