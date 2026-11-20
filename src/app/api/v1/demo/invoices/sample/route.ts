import { NextResponse } from 'next/server';
import { seedFixtures, WORKSPACE } from '@/server/storage/fixtures';
import { listInvoices } from '@/server/storage/memory-store';

declare global {
  var __signetSeeded: boolean | undefined;
}

export async function GET() {
  if (!globalThis.__signetSeeded) {
    seedFixtures();
    globalThis.__signetSeeded = true;
  }
  const invoices = listInvoices(WORKSPACE);
  return NextResponse.json({
    workspace_id: WORKSPACE,
    label: 'Sample demo workspace (synthetic data)',
    invoices: invoices.map((i) => ({
      id: i.id,
      external_ref: i.external_ref,
      supplier_name: i.supplier_name,
      amount_units: i.amount_units,
      currency_symbol: i.currency_symbol,
      state: i.state,
      due_at: i.due_at,
    })),
  });
}
