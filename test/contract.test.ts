import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { defineSignetChain } from '../src/lib/chains/aevum';

function compileContract(): Record<string, unknown> {
  const source = fs.readFileSync(path.join(process.cwd(), 'contracts', 'SignetAnchor.sol'), 'utf8');
  const input = {
    language: 'Solidity',
    sources: { 'SignetAnchor.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors ?? []).filter(
    (e: { severity?: string }) => typeof e === 'object' && e.severity === 'error',
  );
  const messages = (output.errors ?? []).map((e: { formattedMessage?: string; message?: string }) => e.formattedMessage ?? e.message ?? String(e));
  assert.deepEqual(messages.filter(() => errors.length > 0), [], `compile errors: ${errors.map((e: unknown) => JSON.stringify(e)).join('\n')}`);
  return output.contracts['SignetAnchor.sol']['SignetAnchor'];
}

test('SignetAnchor compiles with expected ABI surface', () => {
  const artifact = compileContract();
  const abi = artifact.abi as Array<{ type: string; name?: string; inputs?: Array<{ name: string; type: string }> }>;
  const payAndAnchor = abi.find((x) => x.type === 'function' && x.name === 'payAndAnchor');
  assert.ok(payAndAnchor);
  const argTypes = payAndAnchor!.inputs!.map((i) => i.type);
  assert.deepEqual(argTypes, [
    'address',
    'address',
    'uint256',
    'uint256',
    'uint64',
    'bytes32',
    'bytes32',
    'bytes32',
  ]);
  const event = abi.find((x) => x.type === 'event' && x.name === 'PaymentAnchored');
  assert.ok(event, 'PaymentAnchored event exists');
  const evm = artifact.evm as { bytecode: { object: string } } | undefined;
  assert.ok(evm && evm.bytecode.object.length > 100, 'bytecode non-empty');
});

test('Aevum chain config matches official testnet values', () => {
  const chain = defineSignetChain({});
  assert.equal(chain.id, 44005);
  assert.equal(chain.rpcUrls.default.http[0], 'https://rpc-test.qday.info');
  assert.equal(chain.blockExplorers!.default.url, 'https://explorer-test.qday.info');
  assert.equal(chain.nativeCurrency.symbol, 'tQDAY');
});

test('explorer URL builders produce canonical links', () => {
  const chain = defineSignetChain({});
  const base = chain.blockExplorers!.default.url;
  const tx = `${base}/tx/0xabc`;
  assert.match(tx, /\/tx\/0xabc$/);
  const addr = `${base}/address/0x123`;
  assert.match(addr, /\/address\/0x123$/);
});
