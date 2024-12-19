import React from 'react'
import { render, screen } from '@testing-library/react'
import RootLayout from '../app/layout'

describe('RootLayout', () => {
  it('renders children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    )
    const childElement = screen.getByTestId('child')
    expect(childElement).toBeInTheDocument()
  })

  it('renders the logo', () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    )
    const logoElement = screen.getByText(/aloshy\.🅰🅸/i)
    expect(logoElement).toBeInTheDocument()
  })
})

