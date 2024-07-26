const hre = require("hardhat");
const fs = require("fs-extra");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/utils");

const sendShieldedTransaction = async (signer, destination, data, value) => {
  // Get the RPC link from the network configuration
  const rpcLink = hre.network.config.url;

  // Encrypt transaction data
  let encryptedData = null;
  try {
    [encryptedData] = await encryptDataField(rpcLink, data);
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }

  // Construct and sign transaction with encrypted data
  let response = null;
  try {
    response = await signer.sendTransaction({
      from: signer.address,
      to: destination,
      data: encryptedData,
      value,
    });
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
  return response;
};

let jsonData = {};
let data = {};
let count = 0;

async function main() {
  const valueTransfer = hre.ethers.parseEther("1");
  const signers = await hre.ethers.getSigners();

  for (const signer of signers) {
    console.log(
      `---------------------Account ${signer.address}---------------------`
    );
    count++;
    data = {
      address: signer.address,
    };

    const erc721Factory = await hre.ethers.getContractFactory(
      "SwisstronikERC721",
      signer
    );
    const erc721 = await erc721Factory.connect(signer).deploy();
    await erc721.waitForDeployment();
    console.log("ERC721 deployed to:", erc721.target);
    const erc721Contract = erc721Factory.attach(erc721.target);
    let mintERC721 = null;
    try {
      mintERC721 = await sendShieldedTransaction(
        signer,
        erc721.target,
        erc721Contract.interface.encodeFunctionData("safeMint", [
          "0x16af037878a6cace2ea29d39a3757ac2f6f7aac1",
        ]),
        0
      );
      await mintERC721.wait();
    } catch (error) {
      console.log("Error sending ERC721 transaction:", error);
    }
    console.log("ERC721 mint tx:", mintERC721.hash);
    data["Task 3"] = {
      contractAddress: erc721.target,
      transactionLink: `https://explorer-evm.testnet.swisstronik.com/tx/${mintERC721.hash}`,
    };

    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(5 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  try {
    await fs.writeJson("./task3.json", jsonData);
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
      await fs.writeJson("./task3.json", jsonData);
      console.log("File has been written successfully.");
    } catch (error) {
      console.error("File written failed: ", error);
    }
    console.error(error);
    process.exit(1);
  });
