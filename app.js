// Inicializa a integração com a Tableau Extensions API
tableau.extensions.initializeAsync().then(() => {
  document.getElementById('status').innerText = '✅ Extensão conectada! Carregando dados...';
  
  // Executa a leitura dos dados
  carregarDados();

  // Opcional: Escuta mudanças/filtros no Tableau e atualiza os dados automaticamente
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets[0];
  
  if (worksheet) {
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, carregarDados);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, carregarDados);
  }

}).catch((err) => {
  document.getElementById('status').innerText = '❌ Erro ao conectar ao Tableau: ' + err.toString();
  console.error(err);
});

async function carregarDados() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  
  // Seleciona a primeira planilha disponível no Dashboard do Tableau
  const worksheet = dashboard.worksheets[0];

  if (!worksheet) {
    document.getElementById('status').innerText = '⚠️ Nenhuma planilha encontrada no dashboard para extrair dados.';
    return;
  }

  try {
    // Obtém o resumo dos dados agregados da planilha selecionada
    const summaryData = await worksheet.getSummaryDataAsync();
    
    // Atualiza os Cards de métricas
    document.getElementById('totalRows').innerText = summaryData.data.length;
    document.getElementById('totalCols').innerText = summaryData.columns.length;

    // Renderiza o Cabeçalho da Tabela
    const headerRow = document.getElementById('tableHeader');
    headerRow.innerHTML = '';
    summaryData.columns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col.fieldName;
      headerRow.appendChild(th);
    });

    // Renderiza as Linhas da Tabela
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    // Limita a exibição às primeiras 20 linhas para manter a performance rápida
    const rowsToDisplay = summaryData.data.slice(0, 20);

    rowsToDisplay.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.innerText = cell.formattedValue;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    document.getElementById('status').style.display = 'none'; // Esconde a mensagem de carregamento

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    document.getElementById('status').innerText = '❌ Erro ao ler dados da planilha do Tableau.';
  }
}