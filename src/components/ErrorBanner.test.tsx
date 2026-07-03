import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBanner } from './ErrorBanner';
import { expect, test, vi } from 'vitest';
import '@testing-library/jest-dom';

test('renders nothing when no error is provided', () => {
  const { container } = render(<ErrorBanner error={null} onClose={() => {}} />);
  expect(container.firstChild).toBeNull();
});

test('renders the error message and close button', () => {
  const onClose = vi.fn();
  render(<ErrorBanner error="Test error message" onClose={onClose} />);
  
  const errorMessage = screen.getByText('Test error message');
  expect(errorMessage).toBeInTheDocument();
  
  const closeButton = screen.getByRole('button');
  fireEvent.click(closeButton);
  
  expect(onClose).toHaveBeenCalledTimes(1);
});
