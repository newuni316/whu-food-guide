import { withRole, successResponse } from '@/lib/api/middleware';
import { AppError, ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logger';

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
        // https://www.amap.com/?p=POIID,lat,lon,name,address,citycode
        if (parsed.hostname === 'm.amap.com' || parsed.hostname === 'www.amap.com') {
            const p = parsed.searchParams.get('p')
            if (p) {
                const parts = p.split(',')
                if (parts.length >= 3) {
                    const lat = parseFloat(parts[1])
                    const lon = parseFloat(parts[2])
                    if (!isNaN(lat) && !isNaN(lon)) {
                        return {
                            name: parts[3] ? decodeURIComponent(parts[3]) : null,
                            latitude: lat,
                            longitude: lon,
                            address: parts[4] ? decodeURIComponent(parts[4]) : null,
                            poiId: parts[0] || null,
                            source: 'www.amap.com (p param)',
                        }
                    }
                }
            }

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

        // https://m.amap.com/detail/poiid or https://www.amap.com/detail/poiid
        if (
            (parsed.hostname === 'm.amap.com' || parsed.hostname === 'www.amap.com') &&
            parsed.pathname.startsWith('/detail/')
        ) {
            const pathMatch = parsed.pathname.match(/\/detail\/([A-Za-z0-9]+)/)
            if (pathMatch) {
                return {
                    name: parsed.searchParams.get('name') || null,
                    latitude: null,
                    longitude: null,
                    address: null,
                    poiId: pathMatch[1],
                    source: `${parsed.hostname}/detail`,
                }
            }
        }

        // https://amap.com/place/poiid or https://ditu.amap.com/place/poiid
        if (
            (parsed.hostname === 'amap.com' || parsed.hostname === 'ditu.amap.com') &&
            parsed.pathname.startsWith('/place/')
        ) {
            const pathMatch = parsed.pathname.match(/\/place\/([A-Za-z0-9]+)/)
            if (pathMatch) {
                return {
                    name: parsed.searchParams.get('name') || null,
                    latitude: null,
                    longitude: null,
                    address: null,
                    poiId: pathMatch[1],
                    source: `${parsed.hostname}/place`,
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
                method: 'GET',
                redirect: 'follow',
                signal: AbortSignal.timeout(5000),
            })

            if (res.url && res.url !== url) {
                logger.info(`Short link resolved: ${url} -> ${res.url}`, 'parse-amap')
                return res.url
            }

            const html = await res.text()
            const jsRedirect = html.match(/location\.href\s*=\s*["']([^"']+)["']/)
            if (jsRedirect) {
                logger.info(`Short link JS redirect: ${url} -> ${jsRedirect[1]}`, 'parse-amap')
                return jsRedirect[1]
            }

            const metaRefresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+;\s*url=([^"'\s]+)["']/i)
            if (metaRefresh) {
                logger.info(`Short link meta refresh: ${url} -> ${metaRefresh[1]}`, 'parse-amap')
                return metaRefresh[1]
            }

            return null
        } catch (err) {
            logger.warn(`Short link resolve attempt ${attempt + 1} failed: ${url}`, 'parse-amap', {
                error: (err as Error).message,
            })
            if (isRetryableError(err) && attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
                continue
            }
            return null
        }
    }
    return null
}

const SHORT_LINK_DOMAINS = ['s.amap.com', 'surl.amap.com']

function isShortLink(url: string): boolean {
    try {
        const hostname = new URL(url).hostname
        return SHORT_LINK_DOMAINS.includes(hostname)
    } catch {
        return SHORT_LINK_DOMAINS.some(d => url.includes(d))
    }
}

const POST = withRole('admin', async (request) => {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, '请提供高德地图链接');
    }

    const trimmedUrl = url.trim()
    logger.info(`Parsing Amap link: ${trimmedUrl}`, 'parse-amap')

    let result = parseAmapUrl(trimmedUrl)

    if (!result && isShortLink(trimmedUrl)) {
        logger.info(`Attempting short link resolution for: ${trimmedUrl}`, 'parse-amap')
        const resolvedUrl = await resolveShortLink(trimmedUrl)
        if (resolvedUrl) {
            result = parseAmapUrl(resolvedUrl)
        }
    }

    if (!result) {
        logger.warn(`Failed to parse Amap link: ${trimmedUrl}`, 'parse-amap')
        throw new AppError(ErrorCode.VALIDATION_ERROR, '无法解析该链接，请确认是高德地图分享链接');
    }

    logger.info(`Parsed Amap link: ${JSON.stringify(result)}`, 'parse-amap')
    return successResponse(result);
});

export { POST };
