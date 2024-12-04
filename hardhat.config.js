/** @type import('hardhat/config').HardhatUserConfig */
require('@nomicfoundation/hardhat-ethers')
require('@nomicfoundation/hardhat-verify')
require('dotenv').config()

module.exports = {
    solidity: {
        version: '0.8.27',
        settings: {
            optimizer: {
                enabled: true,
                runs: 100,
            },
        },
    },
    networks: {
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: [process.env.DEPLOYER_ACCOUNT_PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: { sepolia: process.env.ETHER_SCAN_API_KEY },
    },
    sourcify: {
        enabled: false,
    },
}
