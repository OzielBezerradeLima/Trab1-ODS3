# Cartório Digital – Registro de Documentos em Blockchain

## Problema
Documentos digitais (diplomas, contratos, laudos) podem ser copiados, alterados e falsificados, e verificar a autenticidade depende de um intermediário. Como provar que um arquivo existia em determinada data, foi emitido por quem tinha autoridade e não foi adulterado?

## Por que Blockchain
- **Imutabilidade:** um registro não pode ser editado nem apagado sem deixar rastro.
- **Prova de data e autoria:** timestamp do bloco e endereço de quem registrou.
- **Verificação sem confiar em um único servidor:** qualquer pessoa consulta o contrato.
- **Regras auditáveis:** o contrato inteligente impõe quem pode registrar/revogar.

## O que fica na blockchain (e o que não fica)
| Na blockchain | Fora da blockchain |
|---|---|
| Hash SHA-256 do arquivo | O arquivo em si |
| Título, endereço do registrador, data | Dados pessoais / conteúdo do documento |
| Status (Válido / Revogado) | |
| Lista de registradores autorizados | |

Guardar apenas o hash preserva a privacidade (LGPD) e evita custo de armazenar arquivos. Se um único byte do arquivo mudar, o hash muda e a verificação falha.

## Arquitetura
```
Navegador (frontend/index.html + ethers.js)
   │  calcula SHA-256 do arquivo localmente
   ▼  JSON-RPC
Blockchain local (Hardhat node ou Ganache) ── contrato DocumentRegistry.sol
```

## Contrato inteligente – regras de negócio
- Apenas **registradores autorizados** registram documentos.
- Apenas o **administrador** (quem implantou) autoriza/remove registradores.
- **Hash duplicado, hash zero e título vazio são rejeitados.**
- Só o **registrador original ou o administrador** revoga; revogar duas vezes é rejeitado.
- Consulta (`getDocument`) é gratuita e retorna status Inexistente / Válido / Revogado.
- Eventos: `DocumentRegistered`, `DocumentRevoked`, `RegistrarAuthorized`, `RegistrarRemoved`.

## Como executar
```bash
npm install
npm test                 # testes automatizados
npm run node             # terminal 1: blockchain local (porta 8545)
npm run deploy           # terminal 2: implanta e gera frontend/contract.json
npm run web              # terminal 2: interface em http://localhost:3000
```
Usando **Ganache** (porta 7545): abra o Ganache, rode `npm run deploy:ganache` e coloque `http://127.0.0.1:7545` no campo RPC da interface.

## Roteiro da demonstração (4 min)
1. Mostrar o nó rodando com as contas e o bloco gênesis.
2. Conta 0 (administrador): registrar um PDF → mostrar confirmação e o novo bloco.
3. Verificar o mesmo PDF → status **Válido**, autor e data; contador de documentos aumentou.
4. Verificar o PDF **alterado** (ou outro arquivo) → **Não registrado**.
5. Trocar para Conta 1 (sem permissão) e tentar registrar → **rejeitado**.
6. Autorizar a Conta 1 com a Conta 0 e repetir o registro → aceito. Revogar → status **Revogado**.

## Testes
| Caso | Resultado esperado |
|---|---|
| Registro válido | Aceito, dados gravados, evento emitido |
| Hash duplicado | Rejeitado |
| Título vazio / hash zero | Rejeitado |
| Conta sem permissão registra | Rejeitado |
| Não-admin autoriza registrador | Rejeitado |
| Terceiro revoga documento | Rejeitado |
| Revogar duas vezes | Rejeitado |
| Consultar hash inexistente | Status 0 (não registrado) |
