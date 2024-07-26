const hre = require("hardhat");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/utils");
// const testTokenAddress = "0x10Fa405976028D804ea39bb4D4768eFF101317cF";
const testTokenAddress = "0x28474f06812956c84d5D6AA6b63741382c6005ca";

const sendShieldedTransaction = async (signer, destination, data, value) => {
  // Get the RPC link from the network configuration
  const rpcLink = hre.network.config.url;

  // Encrypt transaction data
  const [encryptedData] = await encryptDataField(rpcLink, data);

  // Construct and sign transaction with encrypted data
  const response = await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    //   data: data,
    value,
  });
  console.log(response);
  return response;
};

async function main() {
  console.log("Ready....");
  const [signer] = await hre.ethers.getSigners();
  const swissV1Factory = await hre.ethers.getContractFactory("SwisstronikV1");
  const swissV1 = await swissV1Factory.deploy();
  await swissV1.waitForDeployment();
  console.log("SwisstronikV1 deployed to:", swissV1.target);
  const proxyAdminFactory = await hre.ethers.getContractFactory(
    "SwisstronikProxyAdmin"
  );
  const proxyAdmin = await proxyAdminFactory.deploy();
  await proxyAdmin.waitForDeployment();
  console.log("ProxyAdmin deployed to:", proxyAdmin.target);
  const proxyFactory = await hre.ethers.getContractFactory("SwisstronikProxy");
  const initializeDataV1Proxy = swissV1.interface.encodeFunctionData(
    "initialize",
    ["Swisstronik"]
  );
  const proxy = await proxyFactory.deploy(
    swissV1.target,
    proxyAdmin.target,
    // hre.ethers.toUtf8Bytes("")
    initializeDataV1Proxy
  );
  await proxy.waitForDeployment();
  console.log("Proxy deployed to:", proxy.target);
  const swissV2Factory = await hre.ethers.getContractFactory("SwisstronikV2");
  const swissV2 = await swissV2Factory.deploy();
  await swissV2.waitForDeployment();
  console.log("SwisstronikV2 deployed to:", swissV2.target);
  const proxyAdminContract = proxyAdminFactory.attach(proxyAdmin.target);
  const initializeDataV2Proxy = swissV2.interface.encodeFunctionData(
    "initialize",
    ["Swisstronik"]
  );
  const replaceContract = await sendShieldedTransaction(
    signer,
    proxyAdmin.target,
    proxyAdminContract.interface.encodeFunctionData("upgradeAndCall", [
      proxy.target,
      swissV2.target,
      // hre.ethers.toUtf8Bytes(""),
      initializeDataV2Proxy,
    ]),
    0
  );

  await replaceContract.wait();
  console.log("Replace Contract tx:", replaceContract.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(0);
  });
