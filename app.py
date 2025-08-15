from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import json
from datetime import datetime

app = Flask(__name__)

# Configurações
DATA_FILE = 'data/transacoes.json'

# Garantir que o diretório data existe
os.makedirs('data', exist_ok=True)

# Inicializar arquivo de dados se não existir
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump([], f)

def carregar_transacoes():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def salvar_transacoes(transacoes):
    with open(DATA_FILE, 'w') as f:
        json.dump(transacoes, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/transacoes', methods=['GET', 'POST'])
def transacoes():
    if request.method == 'GET':
        transacoes = carregar_transacoes()
        return jsonify(transacoes)
    elif request.method == 'POST':
        nova_transacao = request.get_json()
        
        # Validar dados
        if not all(k in nova_transacao for k in ['tipo', 'valor', 'categoria', 'data']):
            return jsonify({'erro': 'Dados incompletos'}), 400
        
        try:
            float(nova_transacao['valor'])
        except ValueError:
            return jsonify({'erro': 'Valor inválido'}), 400
        
        # Adicionar ID e salvar
        transacoes = carregar_transacoes()
        nova_transacao['id'] = len(transacoes) + 1
        transacoes.append(nova_transacao)
        salvar_transacoes(transacoes)
        
        return jsonify(nova_transacao), 201

@app.route('/api/resumo')
def resumo():
    transacoes = carregar_transacoes()
    
    # Calcular saldo total
    saldo = sum(t['valor'] if t['tipo'] == 'receita' else -t['valor'] for t in transacoes)
    
    # Agrupar por categoria
    categorias = {}
    for t in transacoes:
        if t['tipo'] == 'despesa':
            categorias[t['categoria']] = categorias.get(t['categoria'], 0) + t['valor']
    
    # Calcular totais mensais (simplificado)
    meses = {}
    for t in transacoes:
        mes = t['data'][:7]  # Formato YYYY-MM
        if mes not in meses:
            meses[mes] = {'receitas': 0, 'despesas': 0}
        
        if t['tipo'] == 'receita':
            meses[mes]['receitas'] += t['valor']
        else:
            meses[mes]['despesas'] += t['valor']
    
    return jsonify({
        'saldo_total': saldo,
        'gastos_por_categoria': categorias,
        'resumo_mensal': meses
    })

if __name__ == '__main__':
    app.run(debug=True)
