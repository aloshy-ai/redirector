import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home', () => {
  it('renders the redirecting message', () => {
    render(<Home />)
    const headingElement = screen.getByRole('heading', { name: /redirecting/i })
    expect(headingElement).toBeInTheDocument()
  })

  it('renders the progress bar', () => {
    render(<Home />)
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toBeInTheDocument()
  })
})

