const { HDNodeWallet } = require('ethers')

const wallet = HDNodeWallet.createRandom()
console.log('\n ------------------------------------ \n')
console.log('Wallet address:', wallet.address)
console.log('Wallet mnemonic phrase:', wallet.mnemonic.phrase)
console.log('Wallet privateKey:', wallet.privateKey)
console.log('\n------------------------------------')
