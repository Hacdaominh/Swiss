const hre = require("hardhat");
const fs = require("fs-extra");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/utils");

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

    const privateERC721 = await hre.ethers.deployContract(
      "PrivateERC721",
      [],
      signer
    );
    await privateERC721.waitForDeployment();
    console.log("PrivateERC721 deployed to:", privateERC721.target);
    contractsToVerify.push({
      address: privateERC721.target,
      constructorArguments: [],
      contract: "contracts/PrivateERC721.sol:PrivateERC721",
    });
    data["Task 5"] = {
      contractAddress: await privateERC721.getAddress(),
    };

    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(5 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  try {
    await fs.writeJson("./task5.json", jsonData);
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
      await fs.writeJson("./task5.json", jsonData);
      console.log("File has been written successfully.");
    } catch (error) {
      console.error("File written failed: ", error);
    }
    console.error(error);
    process.exit(1);
  });
