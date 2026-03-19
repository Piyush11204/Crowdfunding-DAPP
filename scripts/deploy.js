const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

  // We get the contract to deploy
  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();

  await crowdfunding.deployed();

  console.log("Crowdfunding deployed to:", crowdfunding.address);

  // Write the address to all config file locations Next.js can serve
  const config = {
    crowdfundingAddress: crowdfunding.address,
    deployedAt: new Date().toISOString()
  };
  const configLocations = [
    path.join(__dirname, "../client/public/contractConfig.json"),
    path.join(__dirname, "../client/contractConfig.json"),
    path.join(__dirname, "../public/contractConfig.json"),
  ];
  for (const configPath of configLocations) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Contract address saved to ${path.relative(path.join(__dirname, ".."), configPath)}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
