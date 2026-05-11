import { withRole, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface ParsedAmapLink {
    name: string | null
    latitude: number | null
    longitude: number | null
    address: string | null
    poiId: string | null
    source: string
}

function parseAmapUrl(url: string): ParsedAmapLink | null {
    try {
        const parsed = new URL(url)

        // https://uri.amap.com/marker?position=lon,lat&name=xxx
        if (parsed.hostname === 'uri.amap.com' && parsed.pathname === '/marker') {
            const position = parsed.searchParams.get('position')
            const name = parsed.searchParams.get('name')
            const poiId = parsed.searchParams.get('poiid')
            const address = parsed.searchParams.get('address') || parsed.searchParams.get('src')

            if (position) {
                const parts = position.split(',').map(Number)
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    return {
                        name: name ? decodeURIComponent(name) : null,
                        longitude: parts[0],
                        latitude: parts[1],
                        address: address ? decodeURIComponent(address) : null,
                        poiId: poiId,
                        source: 'uri.amap.com/marker',
                    }
                }
            }

            if (poiId) {
                return {
                    name: name ? decodeURIComponent(name) : null,
                    latitude: null,
                    longitude: null,
                    address: null,
                    poiId,
                    source: 'uri.amap.com/marker (poiid)',
                }
            }
        }

        // https://uri.amap.com/navigation?to=lon,lat,name
        if (parsed.hostname === 'uri.amap.com' && parsed.pathname === '/navigation') {
            const to = parsed.searchParams.get('to')
            if (to) {
                const parts = to.split(',')
                if (parts.length >= 2) {
                    const lon = parseFloat(parts[0])
                    const lat = parseFloat(parts[1])
                    const name = parts.length >= 3 ? decodeURIComponent(parts.slice(2).join(',')) : null
                    if (!isNaN(lon) && !isNaN(lat)) {
                        return {
                            name,
                            longitude: lon,
                            latitude: lat,
                            address: null,
                            poiId: null,
                            source: 'uri.amap.com/navigation',
                        }
                    }
                }
            }
        }

        // https://uri.amap.com/search?keyword=xxx&center=lon,lat
        if (parsed.hostname === 'uri.amap.com' && parsed.pathname === '/search') {
            const center = parsed.searchParams.get('center')
            const keyword = parsed.searchParams.get('keyword')
            if (center) {
                const parts = center.split(',').map(Number)
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    return {
                        name: keyword ? decodeURIComponent(keyword) : null,
                        longitude: parts[0],
                        latitude: parts[1],
                        address: null,
                        poiId: null,
                        source: 'uri.amap.com/search',
                    }
                }
            }
        }

        // https://m.amap.com/?q=lat,lon&name=xxx
        if (parsed.hostname === 'm.amap.com' || parsed.hostname === 'www.amap.com') {
            const q = parsed.searchParams.get('q')
            const name = parsed.searchParams.get('name')
            if (q) {
                const parts = q.split(',').map(Number)
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    return {
                        name: name ? decodeURIComponent(name) : null,
                        latitude: parts[0],
                        longitude: parts[1],
                        address: null,
                        poiId: null,
                        source: 'm.amap.com',
                    }
                }
            }
        }

        // https://ditu.amap.com/detail/B0FFFAB6J2
        if (parsed.hostname === 'ditu.amap.com') {
            const pathMatch = parsed.pathname.match(/\/detail\/([A-Za-z0-9]+)/)
            if (pathMatch) {
                return {
                    name: parsed.searchParams.get('name') || null,
                    latitude: null,
                    longitude: null,
                    address: null,
                    poiId: pathMatch[1],
                    source: 'ditu.amap.com',
                }
            }
        }

        // amapuri://route/plan/?dlat=xx&dlon=xx&dname=xx
        if (url.startsWith('amapuri://') || url.startsWith('iosamap://')) {
            const dlat = parsed.searchParams.get('dlat') || parsed.searchParams.get('lat')
            const dlon = parsed.searchParams.get('dlon') || parsed.searchParams.get('lon')
            const dname = parsed.searchParams.get('dname') || parsed.searchParams.get('poiname')
            if (dlat && dlon) {
                return {
                    name: dname ? decodeURIComponent(dname) : null,
                    latitude: parseFloat(dlat),
                    longitude: parseFloat(dlon),
                    address: null,
                    poiId: null,
                    source: 'amapuri scheme',
                }
            }
        }

        return null
    } catch {
        return null
    }
}

function isRetryableError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'name' in err) {
        const name = (err as { name: string }).name
        if (name === 'TimeoutError' || name === 'AbortError') return true
    }
    if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code
        if (code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'ENOTFOUND') return true
    }
    return false
}

async function resolveShortLink(url: string, retries = 2): Promise<string | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'HEAD',
                redirect: 'follow',
                signal: AbortSignal.timeout(3000),
            })
            if (res.url && res.url !== url) {
                return res.url
            }
            return null
        } catch (err) {
            if (isRetryableError(err) && attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
                continue
            }
            return null
        }
    }
    return null
}

const POST = withRole('admin', async (request) => {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, '请提供高德地图链接');
    }

    const trimmedUrl = url.trim()

    let result = parseAmapUrl(trimmedUrl)

    if (!result && (trimmedUrl.includes('s.amap.com') || trimmedUrl.includes('amap.com/share'))) {
        const resolvedUrl = await resolveShortLink(trimmedUrl)
        if (resolvedUrl) {
            result = parseAmapUrl(resolvedUrl)
        }
    }

    if (!result) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, '无法解析该链接，请确认是高德地图分享链接');
    }

    return successResponse(result);
});

export { POST };
