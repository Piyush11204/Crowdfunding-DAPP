const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

  // We get the contract to deploy
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();

  await crowdfunding.deployed();

  console.log("Crowdfunding deployed to:", crowdfunding.address);

  // Save the contract address to a config file that Next.js can serve
  const configPath = path.join(__dirname, "../client/public/contractConfig.json");
  const config = {
    crowdfundingAddress: crowdfunding.address,
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Contract address saved to client/public/contractConfig.json");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
