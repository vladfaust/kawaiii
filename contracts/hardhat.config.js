require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    dev: {
      url: process.env.RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
    },
    prod: {
      url: process.env.RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
