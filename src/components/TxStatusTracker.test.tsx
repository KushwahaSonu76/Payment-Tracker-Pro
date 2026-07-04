import { render, screen } from '@testing-library/react';
import { TxStatusTracker } from './TxStatusTracker';
import { expect, test } from 'vitest';
import '@testing-library/jest-dom';

test('renders nothing when state is idle', () => {
  const { container } = render(<TxStatusTracker state="idle" hash={null} />);
  expect(container.firstChild).toBeNull();
});

test('renders appropriate message when state is signing', () => {
  render(<TxStatusTracker state="signing" hash={null} />);
  expect(screen.getByText('Awaiting signature in wallet...')).toBeInTheDocument();
});

test('renders explorer link when transaction hash is provided', () => {
  const hash = "0x1234567890abcdef";
  render(<TxStatusTracker state="success" hash={hash} />);
  
  const link = screen.getByRole('link', { name: /view explorer/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', `https://stellar.expert/explorer/testnet/tx/${hash}`);
});
