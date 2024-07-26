const hre = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Proxy", () => {
  describe("Upgrade Proxy", () => {
    let swissV1, proxyAdmin, proxyAdminFactory, proxy, swissV2, signer;
    beforeEach(async () => {
      [signer] = await hre.ethers.getSigners();
      const swissV1Factory = await hre.ethers.getContractFactory(
        "SwisstronikV1"
      );
      swissV1 = await swissV1Factory.deploy();
      await swissV1.waitForDeployment();
      console.log("SwisstronikV1 deployed to:", swissV1.target);

      proxyAdminFactory = await hre.ethers.getContractFactory(
        "SwisstronikProxyAdmin"
      );
      proxyAdmin = await proxyAdminFactory.deploy(signer.address);
      await proxyAdmin.waitForDeployment();
      console.log("ProxyAdmin deployed to:", proxyAdmin.target);

      const proxyFactory = await hre.ethers.getContractFactory(
        "SwisstronikProxy"
      );
      proxy = await proxyFactory.deploy(
        swissV1.target,
        proxyAdmin.target,
        "0x"
      );
      await proxy.waitForDeployment();
      console.log("Proxy deployed to:", proxy.target);
      expect(await swissV1.getValue()).equal(0);

      const swissV2Factory = await hre.ethers.getContractFactory(
        "SwisstronikV2"
      );
      swissV2 = await swissV2Factory.deploy();
      await swissV2.waitForDeployment();
      console.log("SwisstronikV2 deployed to:", swissV2.target);
    });
    it("Should upgrade the proxy", async () => {
      const proxyAdminContract = proxyAdminFactory.attach(proxyAdmin.target);
      //   const upgradeData = proxyAdminContract.interface.encodeFunctionData(
      //     "upgradeAndCall",
      //     [
      //       proxy.target,
      //       swissV2.target,
      //       swissV2.interface.encodeFunctionData("setValue", [1]),
      //     ]
      //   );
      const upgradeData = swissV2.interface.encodeFunctionData("setValue", [1]);
      console.log("Encoded setValue data:", upgradeData);
      try {
        // replaceContract = await signer.sendTransaction({
        //   from: signer.address,
        //   to: proxyAdmin.target,
        //   data: upgradeData,
        //   value: 0,
        //   gasLimit: 1000000, // Adjust gas limit as needed
        // });
        const tx = await proxyAdminContract.upgradeAndCall(
          proxy.target,
          swissV2.target,
          //   upgradeData
          "0x"
        );
        await tx.wait();
        console.log("Upgrade transaction hash:", tx.hash);
      } catch (error) {
        console.error("Error Upgrading contract:", error);
      }
    });
  });
});
