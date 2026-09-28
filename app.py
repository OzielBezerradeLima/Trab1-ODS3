import streamlit as st
from blockchain_core import LocalBlockchain, IdentitySmartContract

# Inicializa a Blockchain na sessão do Streamlit
if 'blockchain' not in st.session_state:
    st.session_state.blockchain = LocalBlockchain()
    st.session_state.contract = IdentitySmartContract(st.session_state.blockchain)

st.set_page_config(page_title="Blockchain Identity", layout="wide")
st.title("Sistema de Registro de Identidades e Documentos")

tab1, tab2, tab3 = st.tabs(["Registrar Documento", "Verificar Autenticidade", "Explorar Blockchain"])

contract = st.session_state.contract

# --- TAB 1: REGISTRAR ---
with tab1:
    st.header("Registrar Novo Documento")
    owner_id = st.text_input("Identificador do Titular (Ex: CPF)")
    doc_type = st.selectbox("Tipo de Documento", ["Certidão de Nascimento", "Diploma", "Contrato", "RG"])
    document_content = st.text_area("Conteúdo do Documento (Simulando o arquivo)")
    
    if st.button("Registrar na Blockchain"):
        # Teste de Operação: Tentativa de registro
        success, message = contract.register_document(owner_id, document_content, doc_type)
        if success:
            st.success(message)
        else:
            st.error(message)

# --- TAB 2: CONSULTAR/VERIFICAR ---
with tab2:
    st.header("Verificar Autenticidade")
    verify_content = st.text_area("Insira o conteúdo do documento para verificar")
    
    if st.button("Verificar"):
        is_valid, result = contract.verify_document(verify_content)
        if is_valid:
            st.success("Documento Autêntico! O Hash bate com o registro na Blockchain.")
            st.json(result)
        else:
            st.error(result)

# --- TAB 3: VISUALIZAR BLOCKCHAIN ---
with tab3:
    st.header("Ledger Público (Blockchain Local)")
    st.write("Visão técnica de todos os blocos minerados (Transparência).")
    
    for block in st.session_state.blockchain.chain:
        with st.expander(f"Bloco #{block.index} - Hash: {block.hash[:15]}..."):
            st.write(f"**Timestamp:** {block.timestamp}")
            st.write(f"**Hash Anterior:** {block.previous_hash}")
            if block.index == 0:
                st.write("*Bloco Gênesis (Vazio)*")
            else:
                st.write("**Transações (Contratos Executados):**")
                st.json(block.transactions)
