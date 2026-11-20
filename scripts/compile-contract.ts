import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const root = process.cwd();
const sourcesRoot = path.join(root, 'contracts');
const artifactsDir = path.join(sourcesRoot, 'artifacts');

const sourcePaths = fs
  .readdirSync(sourcesRoot)
  .filter((f) => f.endsWith('.sol'));

const sources = Object.fromEntries(
  sourcePaths.map((f) => [f, { content: fs.readFileSync(path.join(sourcesRoot, f), 'utf8') }]),
);

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': { '*': ['abi', 'evm.bytecode.object', 'metadata'] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const fatal = output.errors.filter((e: string) => e.startsWith('Error'));
  for (const e of output.errors) console.error(e.trim());
  if (fatal.length > 0) process.exit(1);
}

fs.mkdirSync(artifactsDir, { recursive: true });

for (const [file, contracts] of Object.entries<Record<string, any>>(output.contracts ?? {})) {
  for (const [name, artifact] of Object.entries(contracts)) {
    const out = {
      contractName: name,
      sourceFile: file,
      abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`,
      metadata: artifact.metadata,
      compiledAt: new Date().toISOString(),
      compiler: (solc as unknown as { version(): string }).version(),
    };
    const outPath = path.join(artifactsDir, `${name}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`compiled ${name} -> contracts/artifacts/${name}.json`);
  }
}
