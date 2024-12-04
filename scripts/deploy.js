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

    // Deploy token
    console.log('Deploying CharityToken ...')
    const charityToken = await CharityToken.deploy(deployer)
    await charityToken.waitForDeployment()
    console.log('CharityToken deployed!')

    // Deploy timelock
    console.log('Deploying CharityTimelock ...')
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
    console.log('CharityTimelock Deployed!')
    // Deploy governanace
    console.log('Deploying CharityGovernor ...')
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
    console.log('CharityGovernor Deployed!')

    // The token contract is owned by the charityTimelock which is also the treasury
    await charityToken.transferOwnership(await charityTimelock.getAddress(), {
        from: deployer,
    })

    const supplyCHT = '1000' // 1000 Tokens
    const txMintTokens = await charityTimelock.mintTokens(
        ethers.parseEther(supplyCHT),
        {
            from: deployer,
        }
    )
    await txMintTokens.wait()
    console.log(`${supplyCHT} CHT minted`)

    // 50 Tokens are transfered to each member
    const amountCHT = '50'
    for (let i = 0; i < members.length; i++) {
        const txTransferTokens = await charityTimelock.transferTokens(
            members[i],
            ethers.parseEther(amountCHT),
            { from: deployer }
        )
        await txTransferTokens.wait()
        console.log(`${amountCHT} CHT transfered to ${members[i]}`)
    }

    // The treasury is owned by the charityTimelock
    await charityTimelock.transferOwnership(
        await charityTimelock.getAddress(),
        {
            from: deployer,
        }
    )

    // Assign roles
    const proposerRole = await charityTimelock.PROPOSER_ROLE()
    const executorRole = await charityTimelock.EXECUTOR_ROLE()
    const adminRole = await charityTimelock.DEFAULT_ADMIN_ROLE()

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

    // Renounce admin role
    await charityTimelock.renounceRole(adminRole, deployer)

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
