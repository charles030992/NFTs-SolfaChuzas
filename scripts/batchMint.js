const fs = require('fs');
const path = require('path');

async function main() {
  // `hardhat run` does not forward extra arguments, so the address comes from the environment.
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error('Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/batchMint.js --network <network>');
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
