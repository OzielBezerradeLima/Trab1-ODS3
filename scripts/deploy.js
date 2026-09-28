const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const C = await hre.ethers.getContractFactory("DocumentRegistry");
  const c = await C.deploy();
  await c.waitForDeployment();
  const address = await c.getAddress();
  const abi = JSON.parse(c.interface.formatJson());
  fs.writeFileSync("frontend/contract.json", JSON.stringify({ address, abi }, null, 2));
  console.log("DocumentRegistry implantado em:", address);
  console.log("Endereco e ABI gravados em frontend/contract.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
