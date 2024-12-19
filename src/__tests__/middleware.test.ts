import { NextRequest, NextResponse } from 'next/server'
import middleware from '@/middleware'

// Helper to create NextRequest instances
function createNextRequest(url: string, headers: Record<string, string> = {}) {
  // Create a proper URL object for the test
  const testUrl = new URL(url, 'http://test.com')
  return new NextRequest(testUrl, {
    headers: new Headers(headers),
  })
}

describe('Redirect Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear DNS cache between tests
    global.DNS_CACHE = new Map()
  })

  // Rest of your test cases remain the same...
  describe('Hostname Validation', () => {
    it('should reject IP addresses', async () => {
      const ipv4Req = createNextRequest('https://127.0.0.1', { host: '127.0.0.1' })
      const ipv6Req = createNextRequest('https://[::1]', { host: '[::1]' })

      const ipv4Response = await middleware(ipv4Req)
      const ipv6Response = await middleware(ipv6Req)

      expect(ipv4Response).toEqual(NextResponse.next())
      expect(ipv6Response).toEqual(NextResponse.next())
    })

    // Rest of your test cases remain exactly the same...
  })

  // All other test sections remain exactly the same...
})
