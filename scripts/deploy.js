const fs = require('fs');
const path = require('path');

async function main() {
  // if you changed the name of the contract, be sure to update this here!
  const MyToken = await hre.ethers.getContractFactory("MyToken");

  const nft = await MyToken.deploy();

  await nft.deployed();

  console.log("NFT deployed to:", nft.address);

  const signer0 = await ethers.provider.getSigner(0);

  // try to load ipfs/players-with-cids.json
  const playersWithCidsPath = path.join(process.cwd(), 'ipfs', 'players-with-cids.json');

  if (fs.existsSync(playersWithCidsPath)) {
    console.log('Found players-with-cids.json — will batch mint using its metadataURIs');
    const raw = fs.readFileSync(playersWithCidsPath, 'utf8');
    const players = JSON.parse(raw);

    const recipients = [];
    const uris = [];

    for (const p of players) {
      const recipient = p.recipient && p.recipient.length > 0 ? p.recipient : await signer0.getAddress();
      recipients.push(recipient);
      // use metadataURI (ipfs://CID)
      uris.push(p.metadataURI || (`ipfs://${p.metadataCID}`));
    }

    // Batch mint
    const tx = await nft.batchMint(recipients, uris);
    console.log('Batch mint tx sent:', tx.hash);
    await tx.wait();
    console.log('Batch mint completed');
  } else {
    console.log('players-with-cids.json not found — falling back to single mint example');
    // mint one to yourself!
    // update the IPFS CID to be your metadata CID if you want
    await nft.safeMint(await signer0.getAddress(), "ipfs://QmbCwoJB7g9b86BfEahsjzyzzNx3WEu7Jc1opXWgeTXFgb");
    console.log("NFT Minted!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });