const fs = require('fs');
const path = require('path');

async function main() {
  const contractAddress = process.argv[2] || process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error('Usage: node scripts/batchMint.js <CONTRACT_ADDRESS>  OR set CONTRACT_ADDRESS env var');
    process.exit(1);
  }

  const playersPath = path.join(process.cwd(), 'ipfs', 'players-with-cids.json');
  if (!fs.existsSync(playersPath)) {
    console.error('players-with-cids.json not found. Run ipfs/upload.js first to generate it.');
    process.exit(1);
  }

  const raw = fs.readFileSync(playersPath, 'utf8');
  const players = JSON.parse(raw);

  const recipients = [];
  const uris = [];

  const [deployer] = await ethers.getSigners();
  console.log('Using deployer:', await deployer.getAddress());

  for (const p of players) {
    const recipient = p.recipient && p.recipient.length > 0 ? p.recipient : await deployer.getAddress();
    recipients.push(recipient);
    uris.push(p.metadataURI || (`ipfs://${p.metadataCID}`));
  }

  const MyToken = await ethers.getContractFactory('MyToken');
  const nft = MyToken.attach(contractAddress);

  console.log('Sending batchMint to', contractAddress);
  const tx = await nft.batchMint(recipients, uris);
  console.log('tx hash:', tx.hash);
  await tx.wait();
  console.log('batchMint completed');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
