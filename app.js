tableau.extensions.initializeAsync().then(() => {
  const statusDiv = document.getElementById('status');
  statusDiv.innerText = '✅ Conectado com sucesso ao Tableau!';

  // Carrega os dados da planilha
  carregarDados();

  // Adiciona escutadores de eventos para atualizar dinamicamente se o usuário filtrar ou clicar em algo
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (worksheet) {
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, carregarDados);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, carregarDados);
  }
}).catch((err) => {
  document.getElementById('status').innerText = '❌ Erro ao inicializar extensão: ' + err.toString();
});

async function carregarDados() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  
  // Procura especificamente a planilha "PlanTeste" ou pega a primeira disponível
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (!worksheet) {
    document.getElementById('status').innerText = '⚠️ Planilha "PlanTeste" não encontrada no Dashboard.';
    return;
  }

  try {
    // Busca os dados resumidos visíveis no gráfico da planilha
    const summaryData = await worksheet.getSummaryDataAsync();
    
    // Atualiza KPIs
    const ufsUnicas = new Set(summaryData.data.map(row => row[0].formattedValue));
    document.getElementById('kpiUf').innerText = ufsUnicas.size;
    document.getElementById('kpiRows').innerText = summaryData.data.length;

    // Renderiza o Cabeçalho da Tabela
    const headerRow = document.getElementById('tableHeader');
    headerRow.innerHTML = '';
    summaryData.columns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col.fieldName;
      headerRow.appendChild(th);
    });

    // Renderiza o Corpo da Tabela com os Valores das Medidas por UF
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    summaryData.data.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.innerText = cell.formattedValue !== undefined ? cell.formattedValue : cell.value;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    // Oculta o status após carregar com sucesso
    document.getElementById('status').style.display = 'none';

  } catch (error) {
    document.getElementById('status').innerText = '❌ Erro ao ler dados da planilha: ' + error.toString();
  }
}
