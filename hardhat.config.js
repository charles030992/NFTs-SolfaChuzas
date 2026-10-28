require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { SEPOLIA_URL, PRIVATE_KEY } = process.env;

// The Sepolia network is only configured when both variables are set, so that
// compiling and testing work on a fresh clone without a .env file.
const networks = {};
if (SEPOLIA_URL && PRIVATE_KEY) {
  networks.sepolia = {
    url: SEPOLIA_URL,
    accounts: [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`],
  };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks,
};
