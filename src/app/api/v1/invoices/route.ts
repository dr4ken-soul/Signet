import { NextResponse } from 'next/server';
import { seedFixtures, WORKSPACE } from '@/server/storage/fixtures';
import { listInvoices, getInvoice } from '@/server/storage/memory-store';

declare global {
  var __signetSeeded: boolean | undefined;
}

function ensureSeeded() {
  if (!globalThis.__signetSeeded) {
    seedFixtures();
    globalThis.__signetSeeded = true;
  }
}

export async function GET() {
  ensureSeeded();
  const invoices = listInvoices(WORKSPACE);
  return NextResponse.json({
    workspace_id: WORKSPACE,
    invoices: invoices.map((i) => ({
      id: i.id,
      external_ref: i.external_ref,
      supplier_name: i.supplier_name,
      amount_units: i.amount_units,
      token_symbol: i.token_symbol,
      state: i.state,
      due_at: i.due_at,
      verification_run_id: i.verification_run_id,
    })),
  });
}

export async function POST(request: Request) {
  ensureSeeded();
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: 'Provide an invoice id' }, { status: 400 });
  }
  const invoice = getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  return NextResponse.json({ invoice: publicInvoice(invoice) });
}

function publicInvoice(i: NonNullable<ReturnType<typeof getInvoice>>) {
  return {
    id: i.id,
    external_ref: i.external_ref,
    supplier_name: i.supplier_name,
    payee_address: i.payee_address,
    token_address: i.token_address,
    token_symbol: i.token_symbol,
    token_decimals: i.token_decimals,
    amount_units: i.amount_units,
    currency_symbol: i.currency_symbol,
    issue_date: i.issue_date,
    due_at: i.due_at,
    state: i.state,
    document_sha3_256: i.document_sha3_256,
    lines: i.lines,
    extracted_fields: i.extracted_fields,
    signer_fingerprint: i.signer_fingerprint,
  };
}
