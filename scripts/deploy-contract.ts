import fs from 'node:fs';
import path from 'node:path';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineSignetChain } from '../src/lib/chains/aevum';

type Artifact = {
  contractName: string;
  abi: unknown;
  bytecode: `0x${string}`;
};

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    console.error(
      'DEPLOYER_PRIVATE_KEY is missing or invalid. Add a funded testnet private key to .env (never commit it), then rerun: npm run deploy:contract',
    );
    process.exit(1);
  }

  const artifactPath = path.join(process.cwd(), 'contracts', 'artifacts', 'SignetAnchor.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('SignetAnchor artifact not found. Run: npm run compile:contract');
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as Artifact;

  const chain = defineSignetChain({
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_AEVUM_RPC_URL: process.env.NEXT_PUBLIC_AEVUM_RPC_URL,
    NEXT_PUBLIC_AEVUM_EXPLORER_URL: process.env.NEXT_PUBLIC_AEVUM_EXPLORER_URL,
  });

  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({
    account,
    chain,
    transport: http(process.env.NEXT_PUBLIC_AEVUM_RPC_URL ?? 'https://rpc-test.qday.info'),
  }).extend(publicActions);

  console.log(`deployer: ${account.address}`);
  const balance = await client.getBalance({ address: account.address });
  console.log(`balance: ${balance} wei`);
  if (balance === 0n) {
    console.error('Deployer has no native tQDAY. Claim testnet gas at https://faucet.qday.info/en first.');
    process.exit(1);
  }

  console.log('deploying SignetAnchor...');
  const hash = await client.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode,
    account,
    chain,
  });

  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    console.error(`deployment failed: tx ${hash} status ${receipt.status}`);
    process.exit(1);
  }

  console.log(`SignetAnchor deployed at ${receipt.contractAddress}`);
  console.log(`tx: ${hash}`);

  const deployment = {
    contractName: 'SignetAnchor',
    address: receipt.contractAddress,
    txHash: hash,
    blockNumber: receipt.blockNumber,
    chainId: chain.id,
    deployedAt: new Date().toISOString(),
    deployer: account.address,
  };
  fs.writeFileSync(
    path.join(process.cwd(), 'contracts', 'deployment.json'),
    JSON.stringify(deployment, null, 2) + '\n',
  );
  console.log('wrote contracts/deployment.json');
  console.log(`set NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS=${receipt.contractAddress} in .env to enable contract-mode payments.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
