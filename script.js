document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const transacaoForm = document.getElementById('transacao-form');
    const tabelaTransacoes = document.getElementById('corpo-tabela');
    const saldoTotalElement = document.getElementById('saldo-total');
    
    // Gráficos
    const ctxSaldo = document.getElementById('grafico-saldo').getContext('2d');
    const ctxCategorias = document.getElementById('grafico-categorias').getContext('2d');
    
    let graficoSaldo, graficoCategorias;
    
    // Data atual como padrão
    document.getElementById('data').valueAsDate = new Date();
    
    // Carregar dados iniciais
    carregarDados();
    
    // Evento do formulário
    transacaoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const transacao = {
            tipo: document.getElementById('tipo').value,
            valor: parseFloat(document.getElementById('valor').value),
            categoria: document.getElementById('categoria').value,
            data: document.getElementById('data').value
        };
        
        adicionarTransacao(transacao);
        transacaoForm.reset();
        document.getElementById('data').valueAsDate = new Date();
    });
    
    // Funções
    async function carregarDados() {
        try {
            const [transacoes, resumo] = await Promise.all([
                fetch('/api/transacoes').then(res => res.json()),
                fetch('/api/resumo').then(res => res.json())
            ]);
            
            atualizarTabela(transacoes);
            atualizarResumo(resumo);
            criarGraficos(resumo);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }
    
    async function adicionarTransacao(transacao) {
        try {
            const response = await fetch('/api/transacoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transacao)
            });
            
            if (response.ok) {
                carregarDados();
            } else {
                alert('Erro ao adicionar transação');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }
    
    function atualizarTabela(transacoes) {
        // Ordenar por data (mais recente primeiro)
        transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        tabelaTransacoes.innerHTML = '';
        
        transacoes.slice(0, 10).forEach(transacao => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="${transacao.tipo}">${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
                <td>R$ ${transacao.valor.toFixed(2)}</td>
                <td>${transacao.categoria}</td>
                <td>${formatarData(transacao.data)}</td>
                <td><button class="btn-excluir" data-id="${transacao.id}">Excluir</button></td>
            `;
            
            tabelaTransacoes.appendChild(row);
        });
        
        // Adicionar eventos aos botões de excluir
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                // Implementar exclusão se desejar
                alert('Funcionalidade de exclusão não implementada neste exemplo');
            });
        });
    }
    
    function atualizarResumo(resumo) {
        saldoTotalElement.textContent = `R$ ${resumo.saldo_total.toFixed(2)}`;
        
        // Atualizar cor do saldo
        if (resumo.saldo_total > 0) {
            saldoTotalElement.className = 'receita';
        } else if (resumo.saldo_total < 0) {
            saldoTotalElement.className = 'despesa';
        } else {
            saldoTotalElement.className = '';
        }
    }
    
    function criarGraficos(resumo) {
        // Gráfico de saldo mensal
        const meses = Object.keys(resumo.resumo_mensal).sort();
        const receitas = meses.map(mes => resumo.resumo_mensal[mes].receitas);
        const despesas = meses.map(mes => resumo.resumo_mensal[mes].despesas);
        
        if (graficoSaldo) graficoSaldo.destroy();
        
        graficoSaldo = new Chart(ctxSaldo, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Receitas',
                        data: receitas,
                        backgroundColor: '#27ae60'
                    },
                    {
                        label: 'Despesas',
                        data: despesas,
                        backgroundColor: '#e74c3c'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Gráfico de categorias
        const categorias = Object.keys(resumo.gastos_por_categoria);
        const valores = categorias.map(cat => resumo.gastos_por_categoria[cat]);
        
        if (graficoCategorias) graficoCategorias.destroy();
        
        graficoCategorias = new Chart(ctxCategorias, {
            type: 'pie',
            data: {
                labels: categorias,
                datasets: [{
                    data: valores,
                    backgroundColor: [
                        '#3498db', '#9b59b6', '#1abc9c', '#f1c40f', 
                        '#e67e22', '#e74c3c', '#34495e', '#16a085'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }
    
    function formatarData(dataStr) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dataStr).toLocaleDateString('pt-BR', options);
    }
});
