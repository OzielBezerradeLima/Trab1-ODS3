const { expect } = require("chai");
const hre = require("hardhat");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ensureDeployment } = require("../scripts/lib/deployment");

const { ethers } = hre;
const hash = (text) => ethers.sha256(ethers.toUtf8Bytes(text));

describe("Deploy sem perda de acesso aos documentos", () => {
  let directory, configPath;

  beforeEach(async () => {
    if (hre.network.name !== "hardhat") throw new Error("Execute estes testes apenas na rede hardhat de testes.");
    await hre.network.provider.send("hardhat_reset");
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "document-registry-test-"));
    configPath = path.join(directory, "contract.json");
  });

  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  async function deployLegacy() {
    const c = await (await ethers.getContractFactory("DocumentRegistry")).deploy();
    await c.waitForDeployment();
    return c;
  }

  it("implanta na rede vazia e grava a configuracao", async () => {
    const { config, deployed } = await ensureDeployment(hre, configPath);
    expect(deployed).to.equal(true);
    expect(config.chainId).to.equal("31337");
    expect(config.deployments).to.deep.equal([{ address: config.address, blockNumber: 1 }]);
    expect(JSON.parse(fs.readFileSync(configPath))).to.deep.equal(config);
    const c = await ethers.getContractAt("DocumentRegistry", config.address);
    expect(await c.totalDocuments()).to.equal(0n);
  });

  it("repetir o deploy preserva endereco, documentos, revogacoes e permissoes sem criar blocos", async () => {
    const first = await ensureDeployment(hre, configPath);
    const [, registrar] = await ethers.getSigners();
    const c = await ethers.getContractAt("DocumentRegistry", first.config.address);
    await c.authorizeRegistrar(registrar.address);
    await c.connect(registrar).registerDocument(hash("valido"), "Documento valido");
    await c.registerDocument(hash("revogado"), "Documento revogado");
    await c.revokeDocument(hash("revogado"));
    const block = await ethers.provider.getBlockNumber();

    for (let i = 0; i < 2; i++) {
      const result = await ensureDeployment(hre, configPath);
      expect(result.deployed).to.equal(false);
      expect(result.config.address).to.equal(first.config.address);
      expect(result.config.deployments).to.have.length(1);
    }
    expect(await ethers.provider.getBlockNumber()).to.equal(block);
    expect(await c.totalDocuments()).to.equal(2n);
    expect((await c.getDocument(hash("valido"))).status).to.equal(1n);
    expect((await c.getDocument(hash("revogado"))).status).to.equal(2n);
    expect(await c.isRegistrar(registrar.address)).to.equal(true);
  });

  it("recupera contratos do script antigo e mantem o atual como padrao", async () => {
    const old = await deployLegacy();
    await old.registerDocument(hash("antigo"), "Documento antigo");
    const current = await deployLegacy();
    await current.registerDocument(hash("novo"), "Documento novo");
    fs.writeFileSync(configPath, JSON.stringify({ address: await current.getAddress(), abi: [] }));
    const block = await ethers.provider.getBlockNumber();

    const { config, deployed } = await ensureDeployment(hre, configPath);
    expect(deployed).to.equal(false);
    expect(config.address).to.equal(await current.getAddress());
    expect(config.deployments.map(d => d.address)).to.deep.equal([await old.getAddress(), await current.getAddress()]);
    for (const [index, text] of ["antigo", "novo"].entries()) {
      const c = new ethers.Contract(config.deployments[index].address, config.abi, ethers.provider);
      expect((await c.getDocument(hash(text))).status).to.equal(1n);
    }
    expect(await ethers.provider.getBlockNumber()).to.equal(block);
  });

  it("recupera o contrato existente mesmo sem contract.json", async () => {
    const c = await deployLegacy();
    await c.registerDocument(hash("anterior"), "Anterior");
    const { config, deployed } = await ensureDeployment(hre, configPath);
    expect(deployed).to.equal(false);
    expect(config.address).to.equal(await c.getAddress());
    expect(await c.totalDocuments()).to.equal(1n);
  });

  it("implanta novamente quando a blockchain foi apagada", async () => {
    await ensureDeployment(hre, configPath);
    await hre.network.provider.send("hardhat_reset");
    const { config, deployed } = await ensureDeployment(hre, configPath);
    expect(deployed).to.equal(true);
    expect(config.deployments).to.have.length(1);
    expect(await ethers.provider.getCode(config.address)).not.to.equal("0x");
  });

  it("nao substitui silenciosamente um contrato com codigo diferente", async () => {
    const { config } = await ensureDeployment(hre, configPath);
    await hre.network.provider.send("hardhat_setCode", [config.address, "0x60006000"]);
    const original = fs.readFileSync(configPath, "utf8");
    const block = await ethers.provider.getBlockNumber();
    await expect(ensureDeployment(hre, configPath)).to.be.rejectedWith("codigo diferente");
    expect(fs.readFileSync(configPath, "utf8")).to.equal(original);
    expect(await ethers.provider.getBlockNumber()).to.equal(block);
  });

  it("nao sobrescreve configuracao com JSON invalido", async () => {
    fs.writeFileSync(configPath, "{invalido");
    await expect(ensureDeployment(hre, configPath)).to.be.rejectedWith(SyntaxError);
    expect(fs.readFileSync(configPath, "utf8")).to.equal("{invalido");
    expect(await ethers.provider.getBlockNumber()).to.equal(0);
  });

  it("ignora o endereco padrao de outra rede", async () => {
    const old = await deployLegacy();
    const another = await deployLegacy();
    fs.writeFileSync(configPath, JSON.stringify({ address: await another.getAddress(), chainId: "1337" }));
    const { config, deployed } = await ensureDeployment(hre, configPath);
    expect(deployed).to.equal(false);
    expect(config.chainId).to.equal("31337");
    expect(config.address).to.equal(await old.getAddress());
  });
});
