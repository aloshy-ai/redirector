import { NextRequest, NextResponse } from 'next/server'
import middleware from '../middleware'

// Mock the NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url) => ({
    url,
    headers: new Map([['host', 'example.com']]),
  })),
  NextResponse: {
    next: jest.fn().mockImplementation(() => ({ status: 200 })),
    redirect: jest.fn().mockImplementation((url, config) => ({
      url,
      status: config?.status || 301,
      headers: config?.headers || {}
    }))
  }
}))

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect when valid destination is found', async () => {
    const req = new NextRequest('https://example.com/path')
    const response = await middleware(req)

    expect(NextResponse.redirect).toHaveBeenCalled()
    expect(response.url).toBe('https://destination.com/path')
    expect(response.status).toBe(301)
    expect(response.headers['Cache-Control']).toBe('public, max-age=3600')
  })

  it('should continue when no host header is present', async () => {
    const req = new NextRequest('https://example.com')
    req.headers.delete('host')
    
    const response = await middleware(req)

    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('should continue when no destination is found', async () => {
    const req = new NextRequest('https://unknown-domain.com')
    req.headers.set('host', 'unknown-domain.com')
    
    const response = await middleware(req)

    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('should preserve path and query parameters in redirect', async () => {
    const req = new NextRequest('https://example.com/path?query=test')
    const response = await middleware(req)

    expect(response.url).toBe('https://destination.com/path?query=test')
  })
})

