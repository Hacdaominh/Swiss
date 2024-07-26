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

    const per20SampleFactory = await hre.ethers.getContractFactory(
      "PERC20Sample",
      signer
    );
    const per20Sample = await per20SampleFactory.connect(signer).deploy();
    await per20Sample.waitForDeployment();
    console.log("PERC20Sample deployed to:", per20Sample.target);
    const per20SampleContract = per20SampleFactory.attach(per20Sample.target);
    let transferPERC20 = null;
    try {
      transferPERC20 = await sendShieldedTransaction(
        signer,
        per20Sample.target,
        per20SampleContract.interface.encodeFunctionData("transfer", [
          "0x16af037878a6cace2ea29d39a3757ac2f6f7aac1",
          valueTransfer,
        ]),
        0
      );
      await transferPERC20.wait();
    } catch (error) {
      console.log("Error sending PERC20 transaction:", error);
    }
    console.log("PERC20 transfer tx:", transferPERC20.hash);
    data["Task 4"] = {
      contractAddress: per20Sample.target,
      transactionLink: `https://explorer-evm.testnet.swisstronik.com/tx/${transferPERC20.hash}`,
    };

    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(5 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  try {
    await fs.writeJson("./task4.json", jsonData);
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
      await fs.writeJson("./task4.json", jsonData);
      console.log("File has been written successfully.");
    } catch (error) {
      console.error("File written failed: ", error);
    }
    console.error(error);
    process.exit(1);
  });
