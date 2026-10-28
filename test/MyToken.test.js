const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const URI_0 = "ipfs://bafy-metadata-0";
const URI_1 = "ipfs://bafy-metadata-1";
const URI_2 = "ipfs://bafy-metadata-2";

async function deployFixture() {
  const [owner, player1, player2, outsider] = await ethers.getSigners();
  const MyToken = await ethers.getContractFactory("MyToken");
  const nft = await MyToken.deploy();
  await nft.deployed();
  return { nft, owner, player1, player2, outsider };
}

describe("MyToken (Solfachuzas Player NFTs)", function () {
  describe("deployment", function () {
    it("has the expected name, symbol and owner, and is locked by default", async function () {
      const { nft, owner } = await loadFixture(deployFixture);
      expect(await nft.name()).to.equal("Solfachuzas Player");
      expect(await nft.symbol()).to.equal("SLF");
      expect(await nft.owner()).to.equal(owner.address);
      expect(await nft.transferable()).to.equal(false);
    });
  });

  describe("minting", function () {
    it("lets the owner mint with sequential ids and a token URI", async function () {
      const { nft, player1, player2 } = await loadFixture(deployFixture);
      await nft.safeMint(player1.address, URI_0);
      await nft.safeMint(player2.address, URI_1);

      expect(await nft.ownerOf(0)).to.equal(player1.address);
      expect(await nft.ownerOf(1)).to.equal(player2.address);
      expect(await nft.tokenURI(0)).to.equal(URI_0);
      expect(await nft.tokenURI(1)).to.equal(URI_1);
    });

    it("does not let anyone else mint", async function () {
      const { nft, outsider } = await loadFixture(deployFixture);
      await expect(
        nft.connect(outsider).safeMint(outsider.address, URI_0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("batch mints to each recipient with its own URI", async function () {
      const { nft, player1, player2, owner } = await loadFixture(deployFixture);
      await nft.batchMint(
        [player1.address, player2.address, owner.address],
        [URI_0, URI_1, URI_2]
      );

      expect(await nft.ownerOf(0)).to.equal(player1.address);
      expect(await nft.ownerOf(1)).to.equal(player2.address);
      expect(await nft.ownerOf(2)).to.equal(owner.address);
      expect(await nft.tokenURI(2)).to.equal(URI_2);
    });

    it("rejects a batch whose recipients and URIs do not match", async function () {
      const { nft, player1, player2 } = await loadFixture(deployFixture);
      await expect(
        nft.batchMint([player1.address, player2.address], [URI_0])
      ).to.be.revertedWith("recipients and uris length mismatch");
    });

    it("does not let anyone else batch mint", async function () {
      const { nft, outsider } = await loadFixture(deployFixture);
      await expect(
        nft.connect(outsider).batchMint([outsider.address], [URI_0])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("keeps minting possible while transfers are locked", async function () {
      const { nft, player1 } = await loadFixture(deployFixture);
      expect(await nft.transferable()).to.equal(false);
      await expect(nft.safeMint(player1.address, URI_0)).not.to.be.reverted;
    });
  });

  describe("transfers", function () {
    it("does not let a player transfer their NFT while locked", async function () {
      const { nft, player1, player2 } = await loadFixture(deployFixture);
      await nft.safeMint(player1.address, URI_0);

      await expect(
        nft.connect(player1).transferFrom(player1.address, player2.address, 0)
      ).to.be.revertedWith("transfers are disabled");
      await expect(
        nft.connect(player1)["safeTransferFrom(address,address,uint256)"](player1.address, player2.address, 0)
      ).to.be.revertedWith("transfers are disabled");
      expect(await nft.ownerOf(0)).to.equal(player1.address);
    });

    it("lets the owner hand out an NFT he holds while locked", async function () {
      const { nft, owner, player1 } = await loadFixture(deployFixture);
      await nft.safeMint(owner.address, URI_0);

      await nft["safeTransferFrom(address,address,uint256)"](owner.address, player1.address, 0);
      expect(await nft.ownerOf(0)).to.equal(player1.address);
    });

    it("does not let the owner move a player's NFT without their approval", async function () {
      const { nft, player1, player2 } = await loadFixture(deployFixture);
      await nft.safeMint(player1.address, URI_0);

      await expect(
        nft.transferFrom(player1.address, player2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("lets players transfer once the owner enables transfers, and locks again", async function () {
      const { nft, player1, player2 } = await loadFixture(deployFixture);
      await nft.safeMint(player1.address, URI_0);

      await nft.setTransferable(true);
      await nft.connect(player1).transferFrom(player1.address, player2.address, 0);
      expect(await nft.ownerOf(0)).to.equal(player2.address);

      await nft.setTransferable(false);
      await expect(
        nft.connect(player2).transferFrom(player2.address, player1.address, 0)
      ).to.be.revertedWith("transfers are disabled");
    });

    it("only lets the owner change transferability", async function () {
      const { nft, outsider } = await loadFixture(deployFixture);
      await expect(
        nft.connect(outsider).setTransferable(true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await nft.transferable()).to.equal(false);
    });
  });
});
