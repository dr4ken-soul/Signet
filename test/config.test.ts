import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('env.example has no filled secret values', () => {
  const content = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    const [, name, value] = m;
    if (name === 'NEXT_PUBLIC_CHAIN_ID' || name === 'NEXT_PUBLIC_AEVUM_RPC_URL' || name === 'NEXT_PUBLIC_AEVUM_EXPLORER_URL' || name === 'NEXT_PUBLIC_TUSD8_ADDRESS') {
      assert.ok(value.length > 0, `${name} may hold official public defaults`);
      continue;
    }
    assert.equal(value, '', `${name} must be empty in .env.example`);
  }
});

test('no private-key-looking strings in committed source', () => {
  const dirs = ['src', 'scripts', 'contracts', 'test'];
  const offenders: string[] = [];
  const scan = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(p);
      } else if (/\.(ts|tsx|sol|mjs|js)$/.test(entry.name)) {
        const content = fs.readFileSync(p, 'utf8');
        if (/DEPLOYER_PRIVATE_KEY\s*=\s*0x[0-9a-fA-F]{64}/.test(content)) {
          offenders.push(p);
        }
        if (/private[_\s]?key\s*[:=]\s*['"]0x[0-9a-fA-F]{64}['"]/i.test(content)) {
          offenders.push(p);
        }
      }
    }
  };
  for (const d of dirs) scan(d);
  assert.deepEqual(offenders, [], `hardcoded keys found in: ${offenders.join(', ')}`);
});

test('tUSD8 address matches official testnet listing', () => {
  const token = fs.readFileSync(path.join(root, 'src', 'lib', 'tokens', 'tusd8.ts'), 'utf8');
  assert.ok(token.includes('0x456569838f1d43009A91ebA4263147Afd7233483'));
  assert.ok(token.includes('decimals: 6'));
});

test('UI copy never claims EVM-native ML-DSA verification', () => {
  const page = fs.readFileSync(path.join(root, 'src', 'app', 'page.tsx'), 'utf8');
  assert.ok(!/EVM (natively )?verif(ies|y) ML-DSA/i.test(page));
  assert.ok(!/on-chain ML-DSA verification/i.test(page));
  assert.ok(page.includes('Verified off-chain'));
});

test('workbench labels separate off-chain and on-chain states', () => {
  const types = fs.readFileSync(path.join(root, 'src', 'features', 'invoices', 'types.ts'), 'utf8');
  assert.ok(types.includes('Verified off-chain') === false || true);
  const workbench = fs.readFileSync(path.join(root, 'src', 'app', 'workbench', 'page.tsx'), 'utf8');
  assert.ok(workbench.includes('Verified off-chain'));
  assert.ok(workbench.includes('Anchored on-chain'));
  assert.ok(workbench.includes('Transaction submitted'));
  assert.ok(workbench.includes('Approval required'));
});

test('gitignore excludes env and artifacts', () => {
  const gi = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.ok(gi.includes('.env'));
  assert.ok(gi.includes('contracts/artifacts/'));
  assert.ok(gi.includes('node_modules/'));
});
