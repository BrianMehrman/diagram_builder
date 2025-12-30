import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('Diagram Builder')).toBeDefined();
  });

  it('renders the app description', () => {
    render(<App />);
    expect(screen.getByText('3D Codebase Visualization Tool')).toBeDefined();
  });
});
