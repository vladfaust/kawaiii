import hardhat from "hardhat";
const { ethers } = hardhat;

async function deploy(contractName, deployOptions = {}, args = []) {
  const factory = await ethers.getContractFactory(contractName, deployOptions);

  const balance = await factory.signer.getBalance();
  console.log(`Account: ${await factory.signer.getAddress()}`);
  console.log(`Account balance: ${ethers.utils.formatEther(balance)}`);

  const deployTx = factory.getDeployTransaction(...args);

  const estimatedGas = await factory.signer.estimateGas(deployTx);
  const gasPrice = await factory.signer.getGasPrice();

  const deploymentPriceWei = gasPrice.mul(estimatedGas);
  console.log(`Est. gas for ${contractName}: ${estimatedGas}`);
  console.log(
    `Est. gas price for ${contractName}: ${ethers.utils.formatEther(
      deploymentPriceWei
    )}`
  );

  const instance = await factory.deploy(...args);
  await instance.deployed();
  console.log(contractName, "deployed to address", instance.address);
  console.log(contractName, "deploy tx hash", instance.deployTransaction.hash);

  return instance;
}

async function main() {
  await deploy("KawaiiiCollectible", {}, [
    "https://localost:4100/rest/collectible/{id}/metadata.json",
    "Kawaiii Collectible",
    "1",
    25,
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
