import '@testing-library/jest-dom'

class MockNextResponse {
  public readonly status: number
  public readonly headers: Headers
  private readonly body: string | null

  constructor(body: string | null = null, init?: { status?: number; headers?: Headers }) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Headers(init?.headers)
  }

  text() {
    return Promise.resolve(this.body || '')
  }

  // Add static methods
  static next() {
    return new MockNextResponse()
  }

  static redirect(url: string, init?: { status?: number; headers?: Headers }) {
    return new MockNextResponse(null, {
      status: init?.status || 307,
      headers: new Headers(init?.headers),
    })
  }
}

class MockNextRequest {
  public readonly url: string
  public readonly headers: Headers

  constructor(input: string | URL, init?: { headers?: Headers }) {
    this.url = input instanceof URL ? input.href : input
    this.headers = init?.headers || new Headers()
  }
}

// Extend global types using ES2015 module syntax
declare global {
  // eslint-disable-next-line no-var
  var DNS_CACHE: Map<string, any>

  namespace NodeJS {
    interface Global {
      DNS_CACHE: Map<string, any>
    }
  }
}

// Make DNS_CACHE available globally for tests
global.DNS_CACHE = new Map()

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
)

// Mock NextResponse
jest.mock('next/server', () => {
  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  }
})

// Add any additional setup needed for your tests
beforeEach(() => {
  jest.clearAllMocks()
})
