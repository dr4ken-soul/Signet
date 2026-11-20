import type { InvoiceState } from '@/features/invoices/types';
import { STATE_LABELS } from '@/features/invoices/types';

const TONES: Record<'success' | 'warning' | 'error' | 'info' | 'neutral', { text: string; dot: string }> = {
  success: { text: 'text-success', dot: 'bg-success' },
  warning: { text: 'text-warning', dot: 'bg-warning' },
  error: { text: 'text-error', dot: 'bg-error' },
  info: { text: 'text-info', dot: 'bg-info' },
  neutral: { text: 'text-ink-secondary', dot: 'bg-ink-muted' },
};

export function StateBadge({ state }: { state: InvoiceState }) {
  const tone = TONES[toneKeyFor(state)];
  return (
    <span className={`status-label ${tone.text}`}>
      <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {STATE_LABELS[state]}
    </span>
  );
}

function toneKeyFor(state: InvoiceState): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (state) {
    case 'confirmed':
      return 'success';
    case 'needs_review':
    case 'awaiting_wallet':
      return 'warning';
    case 'rejected':
    case 'expired':
    case 'failed':
      return 'error';
    case 'extracting':
    case 'verifying':
    case 'ready_for_approval':
    case 'submitted':
      return 'info';
    default:
      return 'neutral';
  }
}
