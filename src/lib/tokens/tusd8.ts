export type TokenConfig = {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  chainId: number;
  testnet: true;
  sourceUrl: string;
};

const TUSD8_ADDRESS = '0x456569838f1d43009A91ebA4263147Afd7233483';

export function getEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) return process.env[name];
  return undefined;
}

export function getRequiredEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function tusd8Config(chainId: number): TokenConfig {
  const configured = getEnv('NEXT_PUBLIC_TUSD8_ADDRESS');
  const address = (configured && configured.startsWith('0x') ? configured : TUSD8_ADDRESS) as `0x${string}`;
  return {
    symbol: 'tUSD8',
    name: 'tUSD8 (test token)',
    address,
    decimals: 6,
    chainId,
    testnet: true,
    sourceUrl: 'https://wiki.qday.info/Knowledge/reference/tokens',
  };
}

export function isExpectedChain(chainId: number, expected: number): boolean {
  return chainId === expected;
}
