# Sistema de Registro de Identidades e Documentos em Blockchain

Este repositório contém a implementação de uma Blockchain local simulada em Python, acompanhada de uma interface visual construída com Streamlit. O objetivo principal do projeto é demonstrar o registro e a verificação de documentos garantindo a imutabilidade por meio de tecnologia de blocos e criptografia de hash (SHA-256).

## Funcionalidades
1. **Registrar Documentos:** Insere um novo documento na rede (gerando o Hash) e vincula a um usuário. Possui um Smart Contract que impede campos nulos e registros duplicados.
2. **Verificar Autenticidade:** Compara o conteúdo de um documento com a base registrada na Blockchain. Qualquer mínima alteração (uma vírgula a mais) resulta em reprovação da verificação.
3. **Explorar Blockchain:** Exibe na interface o Ledger local e aberto, detalhando transações, Hashes de blocos anteriores, blocos atuais e timestamps.

## Como executar localmente

1. Tenha o Python instalado na sua máquina.
2. Instale o framework de interface de usuário (Streamlit) utilizando o pip:
   ```bash
   pip install streamlit
   ```
3. No terminal, dentro da pasta dos arquivos, execute a aplicação com o comando:
   ```bash
   streamlit run app.py
   ```
4. O terminal fornecerá uma URL local (normalmente `http://localhost:8501`). O seu navegador abrirá a interface automaticamente.
