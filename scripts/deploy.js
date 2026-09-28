const hre = require("hardhat");
const { ensureDeployment } = require("./lib/deployment");

async function main() {
  const { config, deployed } = await ensureDeployment(hre);
  console.log(deployed ? "DocumentRegistry implantado em:" : "DocumentRegistry reutilizado em:", config.address);
  console.log(`${config.deployments.length} contrato(s) disponivel(is) na interface.`);
  console.log("Endereco, ABI e contratos encontrados gravados em frontend/contract.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
