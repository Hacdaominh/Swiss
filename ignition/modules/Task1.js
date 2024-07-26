const hre = require("hardhat");
const fs = require("fs-extra");

let jsonData = {};
let data = {};
let count = 0;

async function main() {
  const signers = await hre.ethers.getSigners();

  for (const signer of signers) {
    console.log(
      `---------------------Account ${signer.address}---------------------`
    );
    count++;
    data = {
      address: signer.address,
    };
    const simpleContractFactory = await hre.ethers.getContractFactory(
      "Swisstronik",
      signer
    );
    const simpleContract = await simpleContractFactory
      .connect(signer)
      .deploy("Swisstronik");
    await simpleContract.waitForDeployment();
    console.log("Simple Contract deployed to:", simpleContract.target);
    data["Task 1"] = {
      contractAddress: simpleContract.target,
    };
    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(5 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  try {
    await fs.writeJson("./task1.json", jsonData);
    console.log("File has been written successfully.");
  } catch (error) {
    console.error("File written failed: ", error);
  }
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    jsonData[`Account ${count}`] = data;
    console.log(jsonData);
    try {
      await fs.writeJson("./task1.json", jsonData);
      console.log("File has been written successfully.");
    } catch (error) {
      console.error("File written failed: ", JSON.stringify(jsonData, null, 4));
    }
    console.error(error);
    process.exit(1);
  });
