import hashlib
import time
import json

class Block:
    def __init__(self, index, transactions, timestamp, previous_hash):
        self.index = index
        self.transactions = transactions
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps(self.__dict__, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

class LocalBlockchain:
    def __init__(self):
        self.chain = []
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(0, [], time.time(), "0")
        self.chain.append(genesis_block)

    def add_block(self, block):
        self.chain.append(block)

# --- CONTRATO INTELIGENTE (Smart Contract) ---
class IdentitySmartContract:
    def __init__(self, blockchain):
        self.blockchain = blockchain

    def get_all_registered_hashes(self):
        hashes = []
        for block in self.blockchain.chain:
            for tx in block.transactions:
                hashes.append(tx['document_hash'])
        return hashes

    def register_document(self, owner_id, document_data, doc_type):
        """
        Regras de Negócio (Contrato Inteligente):
        1. Valida se os dados não estão vazios.
        2. Gera o Hash do documento.
        3. Verifica se o Hash já existe na Blockchain (evita duplicidade).
        """
        if not owner_id or not document_data:
            return False, "Erro: Identificação do dono ou dados do documento não podem ser vazios. (Entrada Inválida)"

        # Gera o hash SHA-256 do documento
        document_hash = hashlib.sha256(document_data.encode()).hexdigest()

        # Regra: O documento não pode ter sido registrado antes
        if document_hash in self.get_all_registered_hashes():
            return False, "Erro: Este documento já está registrado na Blockchain! (Entrada Inválida)"

        # Cria a transação válida
        transaction = {
            "owner_hash": hashlib.sha256(owner_id.encode()).hexdigest(),
            "document_hash": document_hash,
            "doc_type": doc_type,
            "timestamp": time.time()
        }

        # Minera/Adiciona o bloco
        previous_block = self.blockchain.chain[-1]
        new_block = Block(
            index=previous_block.index + 1,
            transactions=[transaction],
            timestamp=time.time(),
            previous_hash=previous_block.hash
        )
        self.blockchain.add_block(new_block)
        
        return True, f"Sucesso! Documento registrado com o Hash: {document_hash}"

    def verify_document(self, document_data):
        """Verifica se um documento apresentado é autêntico."""
        doc_hash = hashlib.sha256(document_data.encode()).hexdigest()
        
        for block in self.blockchain.chain:
            for tx in block.transactions:
                if tx['document_hash'] == doc_hash:
                    return True, tx
        
        return False, "Documento não encontrado ou foi adulterado."
