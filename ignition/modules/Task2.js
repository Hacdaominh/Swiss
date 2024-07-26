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

    const erc20Factory = await hre.ethers.getContractFactory(
      "TestToken",
      signer
    );
    const erc20 = await erc20Factory.connect(signer).deploy();
    await erc20.waitForDeployment();
    console.log("ERC20 deployed to:", erc20.target);
    const erc20Contract = erc20Factory.attach(erc20.target);
    let erc20Tx = null;
    try {
      erc20Tx = await sendShieldedTransaction(
        signer,
        erc20.target,
        erc20Contract.interface.encodeFunctionData("transfer", [
          "0x16af037878a6cace2ea29d39a3757ac2f6f7aac1",
          valueTransfer,
        ]),
        0
      );
      await erc20Tx.wait();
      console.log("ERC20 transfer tx:", erc20Tx.hash);
    } catch (error) {
      console.log("Error sending ERC20 transaction:", error);
    }
    data["Task 2"] = {
      contractAddress: await erc20.getAddress(),
      transactionLink: `https://explorer-evm.testnet.swisstronik.com/tx/${await erc20Tx.hash}`,
    };

    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(5 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  try {
    await fs.writeJson("./task2.json", jsonData);
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
      await fs.writeJson("./task2.json", jsonData);
      console.log("File has been written successfully.");
    } catch (error) {
      console.error("File written failed: ", error);
    }
    console.error(error);
    process.exit(1);
  });
