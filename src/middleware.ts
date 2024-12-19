import { NextRequest, NextResponse } from 'next/server'

// Type definitions
interface DNSAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

interface DNSResponse {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: Array<{
    name: string
    type: number
  }>
  Answer?: DNSAnswer[]
}

type CacheEntry = {
  value: string
  timestamp: number
}

// Constants
const DNS_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 3600000 // 1 hour
const TXT_PREFIX = '_redirect.'
const REDIRECT_STATUS = 307
const DNS_TIMEOUT = 5000 // 5 seconds
const MAX_HOSTNAME_LENGTH = 253
const MAX_LOOKUPS_PER_REQUEST = 5
const MAX_SUBDOMAIN_LENGTH = 63

// Validation functions
function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) return false

  // Check hostname format according to RFC 1123
  const hostnameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return hostnameRegex.test(hostname)
}

function isIPAddress(hostname: string): boolean {
  // Check for IPv4 or IPv6
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')
}

function isValidDestination(destination: string): boolean {
  return Boolean(
    destination &&
      isValidHostname(destination) &&
      !destination.includes('*') &&
      !isIPAddress(destination)
  )
}

async function getDNSRecords(hostname: string): Promise<string[][]> {
  if (!isValidHostname(hostname)) {
    console.warn(`Invalid hostname format: ${hostname}`)
    return []
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DNS_TIMEOUT)

    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${TXT_PREFIX}${hostname}&type=TXT`,
      {
        headers: {
          Accept: 'application/dns-json',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status} ${response.statusText}`)
    }

    const records: DNSResponse = await response.json()

    // Check DNS response status
    if (records.Status !== 0) {
      throw new Error(`DNS query returned error status: ${records.Status}`)
    }

    return (
      records.Answer?.map((answer: DNSAnswer) => {
        const txt = answer.data.replace(/^"|"$/g, '')
        return [txt]
      }) || []
    )
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.error(`DNS lookup timeout for ${hostname}`)
      } else {
        console.error(`DNS lookup failed for ${hostname}:`, err.message)
      }
    }
    return []
  }
}

async function lookupDestinationWithCache(hostname: string): Promise<string | null> {
  if (!hostname || !isValidHostname(hostname)) return null

  // Check cache first
  const cached = DNS_CACHE.get(hostname)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value
  }
  DNS_CACHE.delete(hostname)

  const hostParts = hostname.split('.')
  let lookupCount = 0

  while (hostParts.length >= 2 && lookupCount < MAX_LOOKUPS_PER_REQUEST) {
    lookupCount++
    const currentDomain = hostParts.join('.')
    const txtRecords = await getDNSRecords(currentDomain)

    for (const records of txtRecords) {
      for (const record of records) {
        if (record.startsWith('destination=')) {
          const destination = record.split('=')[1]?.trim()

          if (destination && isValidDestination(destination)) {
            DNS_CACHE.set(currentDomain, {
              value: destination,
              timestamp: Date.now(),
            })
            return destination
          }
        }
      }
    }

    hostParts.shift()
  }

  return null
}

function generateErrorMessage(req: NextRequest): string {
  try {
    const originalHost = req.headers.get('host') || ''
    const currentDomain = new URL(req.url).hostname

    return `
No redirect configuration found.

To configure redirects for ${originalHost}, create a TXT record:
Domain: _redirect.${originalHost}
Content: destination=your-target-domain.com

Example DNS Record:
Type: TXT
Name: _redirect.${originalHost}
Value: destination=example.com

Current domain: ${currentDomain}
Requested URL: ${req.url}
    `.trim()
  } catch (err) {
    console.error('Middleware error:', err)
    return 'Unable to process redirect request. Please check your DNS configuration.'
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export default async function middleware(req: NextRequest) {
  try {
    const originalHost = req.headers.get('host')?.toLowerCase()

    if (!originalHost || isIPAddress(originalHost)) {
      return NextResponse.next()
    }

    if (!isValidHostname(originalHost)) {
      return new NextResponse('Invalid hostname format', { status: 400 })
    }

    const destinationDomain = await lookupDestinationWithCache(originalHost)
    if (!destinationDomain) {
      return new NextResponse(generateErrorMessage(req), {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }

    const originalUrl = new URL(req.url)
    const originalSubdomain = originalHost.split('.')[0]

    // Validate subdomain length
    if (originalSubdomain.length > MAX_SUBDOMAIN_LENGTH) {
      return new NextResponse('Subdomain too long', { status: 400 })
    }

    const newHostname = `${originalSubdomain}.${destinationDomain}`
    if (newHostname.length > MAX_HOSTNAME_LENGTH) {
      return new NextResponse('Resulting hostname too long', { status: 400 })
    }

    const destinationUrl = new URL(req.url)
    destinationUrl.protocol = originalUrl.protocol
    destinationUrl.hostname = newHostname
    destinationUrl.pathname = originalUrl.pathname
    destinationUrl.search = originalUrl.search

    return NextResponse.redirect(destinationUrl, {
      status: REDIRECT_STATUS,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Redirect-By': 'DNS-Redirect-Middleware',
      },
    })
  } catch (err) {
    console.error('Middleware error:', err)

    // Differentiate between different types of errors
    if (err instanceof Error) {
      if (err.name === 'TypeError') {
        return new NextResponse('Invalid request format', { status: 400 })
      } else if (err.name === 'AbortError') {
        return new NextResponse('Request timeout', { status: 504 })
      }
    }
    // Return a 500 error instead of using NextResponse.error()
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
