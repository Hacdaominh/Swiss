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

    const swissV1Factory = await hre.ethers.getContractFactory("SwisstronikV1");
    const swissV1 = await swissV1Factory.connect(signer).deploy();
    await swissV1.waitForDeployment();
    console.log("SwisstronikV1 deployed to:", swissV1.target);

    const proxyAdminFactory = await hre.ethers.getContractFactory(
      "SwisstronikProxyAdmin"
    );
    const proxyAdmin = await proxyAdminFactory
      .connect(signer)
      .deploy(signer.address);
    await proxyAdmin.waitForDeployment();
    console.log("ProxyAdmin deployed to:", proxyAdmin.target);

    const proxyFactory = await hre.ethers.getContractFactory(
      "SwisstronikProxy"
    );
    const proxy = await proxyFactory
      .connect(signer)
      .deploy(swissV1.target, proxyAdmin.target, "0x");
    await proxy.waitForDeployment();
    console.log("Proxy deployed to:", proxy.target);

    contractsToVerify.push({
      address: proxy.target,
      constructorArguments: [swissV1.target, proxyAdmin.target, "0x"],
      contract: "contracts/SwisstronikProxy.sol:SwisstronikProxy",
    });

    const swissV2Factory = await hre.ethers.getContractFactory("SwisstronikV2");
    const swissV2 = await swissV2Factory.connect(signer).deploy();
    await swissV2.waitForDeployment();
    console.log("SwisstronikV2 deployed to:", swissV2.target);

    const proxyAdminContract = proxyAdminFactory.attach(proxyAdmin.target);
    const upgradeData = proxyAdminContract.interface.encodeFunctionData(
      "upgradeAndCall",
      [proxy.target, swissV2.target, "0x"]
    );
    let replaceContract;
    try {
      replaceContract = await sendShieldedTransaction(
        signer,
        proxyAdmin.target,
        upgradeData,
        0
      );
      await replaceContract.wait();
      console.log("Upgrade transaction hash:", replaceContract.hash);
    } catch (error) {
      console.error("Error Upgrading contract:", error);
    }
    data["Task 6"] = {
      contractAddress: proxy.target,
      contractLink: `https://explorer-evm.testnet.swisstronik.com/address/${proxy.target}`,
      replaceContractLink: `https://explorer-evm.testnet.swisstronik.com/tx/${replaceContract.hash}`,
    };

    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(5 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  try {
    await fs.writeJson("./task6.json", jsonData);
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
      await fs.writeJson("./task6.json", jsonData);
      console.log("File has been written successfully.");
    } catch (error) {
      console.error("File written failed: ", error);
    }
    console.error(error);
    process.exit(1);
  });
