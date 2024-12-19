import { NextRequest, NextResponse } from 'next/server'

// Type definitions
type CacheEntry = {
  value: string
  timestamp: number
}

// Constants
const DNS_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 3600000 // 1 hour
const TXT_PREFIX = '_redirect.'
const DEFAULT_STATUS = 301

async function lookupDestinationWithCache(hostname: string): Promise<string | null> {
  try {
    if (!hostname) return null

    const cached = DNS_CACHE.get(hostname)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.value
    }
    DNS_CACHE.delete(hostname)

    // In a real-world scenario, you would perform an actual DNS lookup here.
    // For this example, we'll simulate it with a mock lookup.
    const mockDNSLookup = (host: string) => {
      const mockRecords: Record<string, string> = {
        'example.com': 'destination.com',
        'test.com': 'target.com'
      }
      return Promise.resolve([[`destination=${mockRecords[host] || ''}`]])
    }

    const txtRecords = await mockDNSLookup(`${TXT_PREFIX}${hostname}`)
    
    for (const records of txtRecords) {
      for (const record of records) {
        if (record.startsWith('destination=')) {
          const destination = record.split('=')[1]?.trim()
          
          if (destination) {
            DNS_CACHE.set(hostname, {
              value: destination,
              timestamp: Date.now()
            })
            return destination
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error(`DNS lookup failed for ${hostname}:`, error)
    return null
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|$).*)'
  ]
}

export default async function middleware(req: NextRequest) {
  try {
    const hostname = req.headers.get('host')?.toLowerCase()
    if (!hostname) return NextResponse.next()

    const destinationDomain = await lookupDestinationWithCache(hostname)
    if (!destinationDomain) return NextResponse.next()

    const destinationUrl = new URL(req.url)
    destinationUrl.hostname = destinationDomain
    destinationUrl.protocol = req.url.startsWith('https') ? 'https:' : 'http:'

    return NextResponse.redirect(destinationUrl, { 
      status: DEFAULT_STATUS,
      headers: {
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

