import { formatUnits } from 'viem';

export function formatAmount(amountUnits: string, decimals: number): string {
  try {
    return formatUnits(BigInt(amountUnits), decimals);
  } catch {
    return amountUnits;
  }
}

export function shortenHex(value: string | null | undefined, head = 10, tail = 8): string {
  if (!value) return 'n/a';
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
