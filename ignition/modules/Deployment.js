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

async function verifyContract(address, constructorArguments, contract) {
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
      contract: contract,
    });
    console.log(`Contract at ${address} verified successfully`);
  } catch (err) {
    console.error(`Error verifying Contract at ${address}. Reason:`, err);
  }
}

let jsonData = {};
let data = {};
let count = 0;
const contractsToVerify = [];

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

    const erc20Factory = await hre.ethers.getContractFactory("TestToken");
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
      transactionLink: `https://explorer-evm.testnet.swisstronik.com/tx/${erc20Tx.hash}`,
    };

    const erc721Factory = await hre.ethers.getContractFactory(
      "SwisstronikERC721"
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

    const per20SampleFactory = await hre.ethers.getContractFactory(
      "PERC20Sample"
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
      screenShot: `https://explorer-evm.testnet.swisstronik.com/address/${privateERC721.target}/contracts#address-tabs`,
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
      screenShot: `https://explorer-evm.testnet.swisstronik.com/address/${proxy.target}/contracts#address-tabs`,
    };
    jsonData[`Account ${count}`] = data;
    console.log(data);
    await delay(10 * 1000);
  }
  console.log("---------------------JSON OUTPUT---------------------");
  console.log(jsonData);
  fs.writeJson("./AllTask.json", JSON.stringify(jsonData, null, 4))
    .then(() => {
      console.log("File has been written successfully.");
    })
    .catch((err) => {
      console.error("File written failed: ", err);
    });
  console.log("Starting contract verifications...");
  for (const [index, contract] of contractsToVerify.entries()) {
    await verifyContract(
      contract.address,
      contract.constructorArguments,
      contract.contract
    );
    console.log(
      `Verified contract ${index + 1} of ${contractsToVerify.length}`
    );

    if (index < contractsToVerify.length - 1) {
      const delayTime = 2000 + Math.random() * 1000;
      console.log(
        `Waiting for ${delayTime / 1000} seconds before next verification...`
      );
      await delay(delayTime);
    }
  }
  console.log("All verifications completed");
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    jsonData[`Account ${count}`] = data;
    console.log(jsonData);
    fs.writeJson("./AllTask.json", JSON.stringify(jsonData, null, 4))
      .then(() => {
        console.log("File has been written successfully.");
      })
      .catch((err) => {
        console.error("File written failed: ", err);
      });
    console.error(error);
    process.exit(1);
  });
