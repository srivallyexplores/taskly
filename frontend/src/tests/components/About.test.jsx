import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/testUtils'
import About from '../../pages/About'

describe('About Page', () => {
  test('renders about page with correct content', () => {
    renderWithProviders(<About />)
    
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument()
    expect(screen.getByText(/¿Qué es Lorem Ipsum?/)).toBeInTheDocument()
  })

  test('has proper document head meta tags', () => {
    renderWithProviders(<About />)
    
    // Check if DocumentHead component is rendered (would need to mock helmet)
    expect(document.title).toContain('About Taskly')
  })

  test('has proper semantic structure', () => {
    renderWithProviders(<About />)
    
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('About')
    expect(heading).toHaveClass('mb-4', 'text-lg-center')
  })

  test('renders with correct CSS classes', () => {
    const { container } = renderWithProviders(<About />)
    
    const aboutSection = container.querySelector('.bloc.l-bloc.none')
    expect(aboutSection).toBeInTheDocument()
    expect(aboutSection).toHaveAttribute('id', 'bloc-14')
  })

  test('is accessible', () => {
    renderWithProviders(<About />)
    
    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeInTheDocument()
    
    // Check for readable text content
    const textContent = screen.getByText(/Lorem Ipsum es simplemente/)
    expect(textContent).toBeInTheDocument()
  })
})