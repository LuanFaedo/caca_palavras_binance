from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os

app = Flask(__name__)

CORS(app)  # Permitir CORS para todas as rotas

def carregar_palavras_arquivo(caminho_arquivo: str):
    if not os.path.exists(caminho_arquivo):
        raise FileNotFoundError(f"Arquivo {caminho_arquivo} não encontrado.")
    with open(caminho_arquivo, "r", encoding="utf-8") as f:
        palavras = [linha.strip().lower() for linha in f if linha.strip()]
    return palavras

def filtrar_palavras(palavras_db, letras_posicionadas, letras_extras, letras_exclusao, letras_encontradas, tamanho_palavra):
    resultado = []
    
    for palavra in palavras_db:
        # 1) Verificar tamanho
        if len(palavra) != tamanho_palavra:
            continue
        
        # 2) Verificar letras em posições específicas
        encaixa_posicionadas = True
        for item in letras_posicionadas:
            letra = item.get("letra", "").lower()
            posicao = item.get("posicao")
            if posicao is None or posicao < 0 or posicao >= tamanho_palavra:
                encaixa_posicionadas = False
                break
            if palavra[posicao] != letra:
                encaixa_posicionadas = False
                break
        
        if not encaixa_posicionadas:
            continue
        
        # 3) Verificar se TODAS as letras_extras aparecem na palavra
        encaixa_extras = True
        for letra_extra in letras_extras:
            if letra_extra.lower() not in palavra:
                encaixa_extras = False
                break
        
        if not encaixa_extras:
            continue
        
        # 4) Verificar se nenhuma das letras_exclusao está na palavra
        contem_exclusao = False
        for letra_excluida in letras_exclusao:
            if letra_excluida.lower() in palavra:
                contem_exclusao = True
                break
        
        if contem_exclusao:
            continue
        
        # 5) Verificar letras encontradas (cada linha deve ter todas as letras presentes)
        encaixa_encontradas = True
        for linha in letras_encontradas:
            for letra_encontrada in linha:
                if letra_encontrada.lower() not in palavra:
                    encaixa_encontradas = False
                    break
            if not encaixa_encontradas:
                break
        
        if not encaixa_encontradas:
            continue
        
        resultado.append(palavra)
    
    return resultado

# Carregar palavras no momento da inicialização do módulo
try:
    caminho_arquivo = "words_alpha.txt"  # Nome do arquivo de palavras
    palavras_ingles = carregar_palavras_arquivo(caminho_arquivo)
    print(f"Carregadas {len(palavras_ingles)} palavras.")
except Exception as e:
    print(f"Erro ao carregar palavras: {e}")
    palavras_ingles = []

@app.route("/filtrar", methods=["POST"])
def filtrar():
    if not palavras_ingles:
        return jsonify({"erro": "Banco de palavras não está disponível."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"erro": "Dados inválidos."}), 400
    
    tamanho_palavra = data.get("tamanho_palavra")
    letras_posicionadas = data.get("letras_posicionadas", [])
    letras_extras = data.get("letras_extras", [])
    letras_exclusao = data.get("letras_exclusao", [])
    letras_encontradas = data.get("letras_encontradas", [])
    
    # Validações básicas
    if not isinstance(tamanho_palavra, int) or tamanho_palavra <= 0:
        return jsonify({"erro": "tamanho_palavra deve ser um inteiro positivo."}), 400
    
    if (not isinstance(letras_posicionadas, list) or 
        not isinstance(letras_extras, list) or 
        not isinstance(letras_exclusao, list) or 
        not isinstance(letras_encontradas, list)):
        return jsonify({"erro": "letras_posicionadas, letras_extras, letras_exclusao e letras_encontradas devem ser listas."}), 400
    
    # Filtrar palavras
    candidatas = filtrar_palavras(
        palavras_db=palavras_ingles,
        letras_posicionadas=letras_posicionadas,
        letras_extras=letras_extras,
        letras_exclusao=letras_exclusao,
        letras_encontradas=letras_encontradas,
        tamanho_palavra=tamanho_palavra
    )
    
    return jsonify({
        "total": len(candidatas),
        "palavras": candidatas[:100]  # Limita a 100 resultados
    })

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
   app.run(debug=True)
