# Charity DAO

This is a basic project to demonstrate how to develop and deploy a DAO.

Try running some of the following tasks after creating a .env file with the elements in the .env-example:

To generate an account to be used for deployment
```shell
node scripts/account.js
```

To clean and compile the contracts
```shell
npx hardhat clean
npx hardhat compile
```
To deploy the contracts on sepolia testnet
```shell
npx hardhat run --network sepolia scripts/deploy.js
```
To verify the contracts

```shell
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS “Constructor arguments”
```

