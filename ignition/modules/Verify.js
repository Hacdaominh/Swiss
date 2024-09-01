const hre = require("hardhat");

let verifyContract = async (contractAddress, args = []) => {
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: "contracts/SwisstronikProxy.sol:SwisstronikProxy",
    });
    console.log(
      "Contract verified to",
      hre.config.etherscan.customChains[0].urls.browserURL +
        "/address/" +
        contractAddress
    );
  } catch (err) {
    console.error("Error veryfing Contract. Reason:", err);
  }
};

async function main() {
  await verifyContract("0xc3a9e26ea51854742f5dc4003f0e723f7faa37f1", [
    "0x6d14C538ebB0478D5DF13862cfe4CFAD83353e78",
    "0xa67B906348D36E6299cFc7CAB9082dCa46BC74B0",
    "0x",
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
