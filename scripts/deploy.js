require('dotenv').config()

async function main() {
    const CharityToken = await ethers.getContractFactory('CharityToken')
    const CharityTimelock = await ethers.getContractFactory('CharityTimelock')
    const CharityGovernor = await ethers.getContractFactory('CharityGovernor')

    // retrive accounts from the local node
    const [deployer] = (await ethers.getSigners()).map(
        (signer) => signer.address
    )
    const members = JSON.parse(process.env.MEMBERS_ADDRESSES)
    const admin = deployer
    console.log({
        deployer,
        members,
    })

    const supply = ethers.parseEther('300') // 300 Tokens

    // Deploy token
    const charityToken = await CharityToken.deploy(deployer)
    await charityToken.waitForDeployment()

    const txmint = await charityToken.mint(deployer, supply)
    await txmint.wait()

    // 100 Tokens are given to each member and leaving 100 tokens to executor
    const amount = ethers.parseEther('100')
    members.forEach(async (member) => {
        await charityToken.transfer(member, amount, { from: deployer })
    })

    // Deploy timelock
    const minDelay = 5 // How long do we have to wait until we can execute after a passed proposal
    // (5 blocs ~> 1 min as each block takes about 12 seconds to be validated )

    // In addition to passing minDelay, two arrays are passed:
    // The 1st array contains addresses of members who are allowed to make a proposal.
    // The 2nd array contains addresses of members who are allowed to make executions.

    const charityTimelock = await CharityTimelock.deploy(
        minDelay,
        [],
        [],
        admin,
        deployer,
        charityToken
    )
    await charityTimelock.waitForDeployment()

    // Deploy governanace
    // GovernorSettings(0 /* 0 day */, 75 /* 15 minutes */, 0)

    const initialVotingDelay = 0 // Delay since proposal is created until voting starts
    const initialVotingPeriod = 75 // Length of period during which people can cast their vote. (75 blocs ~> 15 min as each block takes about 12 seconds to be validated )
    const initialProposalThreshold = 0 // Minimum number of votes an account must have to create a proposal.
    const quorum = 4 // Percentage of total supply of tokens needed to aprove proposals (4%)

    const charityGovernor = await CharityGovernor.deploy(
        charityToken,
        charityTimelock,
        initialVotingDelay,
        initialVotingPeriod,
        initialProposalThreshold,
        quorum
    )
    await charityGovernor.waitForDeployment()

    // Deploy Treasury

    // Timelock contract will be the owner of our treasury contract.
    // In the provided example, once the proposal is successful and executed,
    // timelock contract will be responsible for calling the function.

    // The token contract is owned by the treasury
    await charityToken.transferOwnership(await charityTimelock.getAddress(), {
        from: deployer,
    })

    // 700 additional tokens are minted for tresury
    await charityTimelock.mintTokens(ethers.parseEther('700'), {
        from: deployer,
    })

    // The tresury contract is owned by the timelock
    // await charityTreasury.transferOwnership(await timelock.getAddress(), {
    //     from: deployer,
    // })

    // Assign roles
    const proposerRole = await charityTimelock.PROPOSER_ROLE()
    const executorRole = await charityTimelock.EXECUTOR_ROLE()

    await charityTimelock.grantRole(
        proposerRole,
        await charityGovernor.getAddress(),
        {
            from: deployer,
        }
    )
    await charityTimelock.grantRole(
        executorRole,
        await charityGovernor.getAddress(),
        {
            from: deployer,
        }
    )

    ///////////// Renounce admin role

    console.log({
        token: await charityToken.getAddress(),
        timelock: await charityTimelock.getAddress(),
        governor: await charityGovernor.getAddress(),
    })
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.log(err)
        process.exit(1)
    })
