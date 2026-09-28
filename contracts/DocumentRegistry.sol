// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Registro de documentos por hash
contract DocumentRegistry {
    enum Status { Inexistente, Valido, Revogado }

    struct Document {
        address registrant;   // quem registrou
        string title;         // titulo/descricao curta
        uint256 timestamp;    // data do registro (bloco)
        Status status;
    }

    address public owner;
    uint256 public totalDocuments;
    mapping(address => bool) public isRegistrar;
    mapping(bytes32 => Document) private docs;

    event RegistrarAuthorized(address indexed registrar);
    event RegistrarRemoved(address indexed registrar);
    event DocumentRegistered(bytes32 indexed hash, address indexed registrant, string title);
    event DocumentRevoked(bytes32 indexed hash, address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o administrador");
        _;
    }

    modifier onlyRegistrar() {
        require(isRegistrar[msg.sender], "Sem permissao para registrar");
        _;
    }

    constructor() {
        owner = msg.sender;
        isRegistrar[msg.sender] = true;
    }

    function authorizeRegistrar(address a) external onlyOwner {
        isRegistrar[a] = true;
        emit RegistrarAuthorized(a);
    }

    function removeRegistrar(address a) external onlyOwner {
        require(a != owner, "Nao remova o administrador");
        isRegistrar[a] = false;
        emit RegistrarRemoved(a);
    }

    function registerDocument(bytes32 hash, string calldata title) external onlyRegistrar {
        require(hash != bytes32(0), "Hash invalido");
        require(bytes(title).length > 0, "Titulo obrigatorio");
        require(docs[hash].status == Status.Inexistente, "Documento ja registrado");
        docs[hash] = Document(msg.sender, title, block.timestamp, Status.Valido);
        totalDocuments++;
        emit DocumentRegistered(hash, msg.sender, title);
    }

    function revokeDocument(bytes32 hash) external {
        Document storage d = docs[hash];
        require(d.status == Status.Valido, "Documento inexistente ou ja revogado");
        require(msg.sender == d.registrant || msg.sender == owner, "Sem permissao para revogar");
        d.status = Status.Revogado;
        emit DocumentRevoked(hash, msg.sender);
    }

    /// Consulta gratuita (view). Status 0 = nao registrado.
    function getDocument(bytes32 hash)
        external view
        returns (address registrant, string memory title, uint256 timestamp, Status status)
    {
        Document storage d = docs[hash];
        return (d.registrant, d.title, d.timestamp, d.status);
    }
}
