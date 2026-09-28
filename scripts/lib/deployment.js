const fs = require("fs");
const path = require("path");

async function ensureDeployment(hre, configPath = path.join(__dirname, "../../frontend/contract.json")) {
  // Um arquivo invalido deve ser corrigido, nunca substituido silenciosamente.
  const previous = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : null;
  const { ethers, artifacts } = hre;
  const provider = ethers.provider;
  const chainId = (await provider.getNetwork()).chainId.toString();
  const artifact = await artifacts.readArtifact("DocumentRegistry");
  const sameNetwork = previous && (previous.chainId == null || String(previous.chainId) === chainId);

  if (sameNetwork && previous.address) {
    const code = await provider.getCode(previous.address);
    if (code !== "0x" && code !== artifact.deployedBytecode) {
      throw new Error("O contrato configurado tem codigo diferente do DocumentRegistry compilado. O deploy foi interrompido para preservar o acesso aos registros existentes.");
    }
  }

  // Recupera tambem contratos criados pelo script antigo, que sobrescrevia o endereco.
  // A busca usa a blockchain local, sem depender de um historico salvo no computador.
  const deployments = [];
  const latest = await provider.getBlock("latest");
  for (let number = 0; number <= latest.number; number++) {
    const block = await provider.getBlock(number, true);
    for (const tx of block.prefetchedTransactions) {
      if (tx.to !== null) continue;
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (receipt.status !== 1 || !receipt.contractAddress) continue;
      const address = receipt.contractAddress;
      if (await provider.getCode(address) === artifact.deployedBytecode) {
        deployments.push({ address, blockNumber: receipt.blockNumber });
      }
    }
  }

  let deployed = false;
  if (deployments.length === 0) {
    const factory = await ethers.getContractFactory("DocumentRegistry");
    const contract = await factory.deploy();
    const receipt = await contract.deploymentTransaction().wait();
    deployments.push({ address: await contract.getAddress(), blockNumber: receipt.blockNumber });
    deployed = true;
  }

  const current = sameNetwork && deployments.find(d => d.address.toLowerCase() === previous.address?.toLowerCase());
  const config = {
    address: (current || deployments[0]).address,
    abi: artifact.abi,
    chainId,
    deployments,
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  return { config, deployed };
}

module.exports = { ensureDeployment };
