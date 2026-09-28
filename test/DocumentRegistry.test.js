const { expect } = require("chai");
const { ethers } = require("hardhat");

const h = (s) => ethers.sha256(ethers.toUtf8Bytes(s));

describe("DocumentRegistry", () => {
  let c, owner, ana, bob;
  beforeEach(async () => {
    [owner, ana, bob] = await ethers.getSigners();
    c = await (await ethers.getContractFactory("DocumentRegistry")).deploy();
  });

  it("registra documento valido e guarda os dados", async () => {
    await c.registerDocument(h("diploma.pdf"), "Diploma Maria");
    const d = await c.getDocument(h("diploma.pdf"));
    expect(d.registrant).to.equal(owner.address);
    expect(d.title).to.equal("Diploma Maria");
    expect(d.status).to.equal(1n);
    expect(await c.totalDocuments()).to.equal(1n);
  });

  it("emite evento ao registrar", async () => {
    await expect(c.registerDocument(h("a"), "A"))
      .to.emit(c, "DocumentRegistered").withArgs(h("a"), owner.address, "A");
  });

  it("rejeita hash duplicado", async () => {
    await c.registerDocument(h("a"), "A");
    await expect(c.registerDocument(h("a"), "A2")).to.be.revertedWith("Documento ja registrado");
  });

  it("rejeita titulo vazio e hash zero", async () => {
    await expect(c.registerDocument(h("a"), "")).to.be.revertedWith("Titulo obrigatorio");
    await expect(c.registerDocument(ethers.ZeroHash, "X")).to.be.revertedWith("Hash invalido");
  });

  it("rejeita registro de quem nao esta autorizado", async () => {
    await expect(c.connect(ana).registerDocument(h("a"), "A"))
      .to.be.revertedWith("Sem permissao para registrar");
  });

  it("administrador autoriza e remove registrador", async () => {
    await c.authorizeRegistrar(ana.address);
    await c.connect(ana).registerDocument(h("a"), "A");
    await c.removeRegistrar(ana.address);
    await expect(c.connect(ana).registerDocument(h("b"), "B")).to.be.reverted;
  });

  it("so o administrador autoriza registradores", async () => {
    await expect(c.connect(ana).authorizeRegistrar(bob.address))
      .to.be.revertedWith("Apenas o administrador");
  });

  it("revoga documento (autor) e bloqueia terceiros", async () => {
    await c.authorizeRegistrar(ana.address);
    await c.connect(ana).registerDocument(h("a"), "A");
    await expect(c.connect(bob).revokeDocument(h("a"))).to.be.revertedWith("Sem permissao para revogar");
    await c.connect(ana).revokeDocument(h("a"));
    expect((await c.getDocument(h("a"))).status).to.equal(2n);
    await expect(c.revokeDocument(h("a"))).to.be.revertedWith("Documento inexistente ou ja revogado");
  });

  it("documento nao registrado retorna status 0", async () => {
    expect((await c.getDocument(h("nada"))).status).to.equal(0n);
  });
});
