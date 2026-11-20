import { NextResponse } from 'next/server';
import { seedFixtures } from '@/server/storage/fixtures';
import { getInvoice, updateInvoiceState, pushAudit } from '@/server/storage/memory-store';
import { runVerification } from '@/server/agent/pipeline';

declare global {
  var __signetSeeded: boolean | undefined;
}

async function ensureSeeded() {
  if (!globalThis.__signetSeeded) {
    seedFixtures();
    globalThis.__signetSeeded = true;
  }
}

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const invoice = getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  try {
    const result = await runVerification(id);
    return NextResponse.json({
      invoice_id: id,
      state: result.invoice.state,
      verification: result.verification,
      policy: result.policy,
      steps: result.steps,
    });
  } catch (err) {
    updateInvoiceState(id, 'needs_review');
    pushAudit({
      workspace_id: invoice.workspace_id,
      actor_type: 'agent',
      actor_id: 'verification-pipeline',
      action: 'verification_error',
      object_id: id,
      outcome: 'error',
      detail: err instanceof Error ? err.message : 'unknown error',
    });
    return NextResponse.json({ error: 'Verification failed; invoice moved to needs_review' }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const invoice = getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  return NextResponse.json({
    invoice_id: id,
    state: invoice.state,
    verification_run_id: invoice.verification_run_id,
  });
}
