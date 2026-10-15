let rawData = [];
let allColumns = [];
let selectedUF = 'TODOS';

tableau.extensions.initializeAsync().then(() => {
  document.getElementById('statusText').innerText = 'Online • Tableau Connected';
  carregarEProcessarDados();

  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (worksheet) {
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, carregarEProcessarDados);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, carregarEProcessarDados);
  }
}).catch((err) => {
  document.getElementById('statusText').innerText = 'Erro na Conexão';
  console.error(err);
});

async function carregarEProcessarDados() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (!worksheet) return;

  try {
    const summaryData = await worksheet.getSummaryDataAsync();
    allColumns = summaryData.columns;
    rawData = summaryData.data;

    // Gerar os botões de UF dinamicamente
    gerarFiltrosUF();
    
    // Renderizar painel
    renderizarPainel();

  } catch (error) {
    console.error('Erro ao ler dados:', error);
  }
}

function gerarFiltrosUF() {
  const ufs = new Set();
  
  rawData.forEach(row => {
    const ufVal = row[0].formattedValue || row[0].value;
    if (ufVal) ufs.add(ufVal);
  });

  const container = document.getElementById('ufFilters');
  container.innerHTML = `
    <div class="pill ${selectedUF === 'TODOS' ? 'active' : ''}" onclick="filtrarUF('TODOS')">
      <i class="fa-solid fa-globe"></i> Todos
    </div>
  `;

  Array.from(ufs).sort().forEach(uf => {
    const pill = document.createElement('div');
    pill.className = `pill ${selectedUF === uf ? 'active' : ''}`;
    pill.onclick = () => filtrarUF(uf);
    pill.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${uf}`;
    container.appendChild(pill);
  });
}

function filtrarUF(uf) {
  selectedUF = uf;
  gerarFiltrosUF();
  renderizarPainel();

  // Aplica o filtro interativo também na planilha nativa do Tableau se necessário
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (worksheet) {
    if (uf === 'TODOS') {
      worksheet.clearFilterAsync('UF');
    } else {
      worksheet.applyFilterAsync('UF', [uf], tableau.FilterUpdateType.Replace);
    }
  }
}

function renderizarPainel() {
  // Filtrar linhas
  const filteredData = selectedUF === 'TODOS' 
    ? rawData 
    : rawData.filter(row => (row[0].formattedValue || row[0].value) === selectedUF);

  // Calcular KPIs
  let totalApto = 0;
  let totalEnf = 0;
  let totalSuperior = 0;

  filteredData.forEach(row => {
    row.forEach((cell, idx) => {
      const colName = allColumns[idx].fieldName.toLowerCase();
      const val = parseFloat(cell.value) || 0;

      if (colName.includes('apto')) totalApto += val;
      if (colName.includes('enf')) totalEnf += val;
      if (colName.includes('superior')) totalSuperior += val;
    });
  });

  const uniqueUFs = new Set(filteredData.map(r => r[0].formattedValue || r[0].value));
  document.getElementById('kpiUfCount').innerText = uniqueUFs.size;
  document.getElementById('kpiApto').innerText = totalApto.toLocaleString('pt-BR');
  document.getElementById('kpiEnf').innerText = totalEnf.toLocaleString('pt-BR');
  document.getElementById('kpiSuperior').innerText = totalSuperior.toLocaleString('pt-BR');

  // Renderizar Cabeçalho da Tabela
  const headerRow = document.getElementById('tableHeader');
  headerRow.innerHTML = '';
  allColumns.forEach(col => {
    const th = document.createElement('th');
    th.innerText = col.fieldName;
    headerRow.appendChild(th);
  });

  // Renderizar Linhas da Tabela
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  filteredData.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.innerText = cell.formattedValue !== undefined ? cell.formattedValue : cell.value;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}
