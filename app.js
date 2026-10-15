let rawData = [];
let allColumns = [];
let selectedUF = 'TODOS';

// Auto-ajuste de escala da tela (Efeito Palco Projeção 1920x1080)
function ajustaPalco() {
  const p = document.getElementById('palco');
  if (!p) return;
  const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  p.style.transform = `translate(${-960 * k}px,${-540 * k}px) scale(${k})`;
}

window.addEventListener('resize', ajustaPalco);
ajustaPalco();

// Conexão com o SDK da Extensão do Tableau
tableau.extensions.initializeAsync().then(() => {
  document.getElementById('statusFooter').innerText = '✅ Conectado ao modelo do Tableau com sucesso.';
  carregarDadosPlanTeste();

  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (worksheet) {
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, carregarDadosPlanTeste);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, carregarDadosPlanTeste);
  }
}).catch((err) => {
  document.getElementById('statusFooter').innerText = '❌ Erro de conexão com o Tableau: ' + err.toString();
});

async function carregarDadosPlanTeste() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (!worksheet) {
    document.getElementById('statusFooter').innerText = '⚠️ Planilha "PlanTeste" não localizada no Dashboard.';
    return;
  }

  try {
    const summaryData = await worksheet.getSummaryDataAsync();
    allColumns = summaryData.columns;
    rawData = summaryData.data;

    // Gerar Botões de UF
    gerarFiltrosUF();

    // Renderizar Indicadores e Tabela
    renderizarPainel();

  } catch (error) {
    document.getElementById('statusFooter').innerText = '❌ Erro ao ler dados: ' + error.toString();
  }
}

function gerarFiltrosUF() {
  const ufs = new Set();
  
  rawData.forEach(row => {
    const ufVal = row[0].formattedValue || row[0].value;
    if (ufVal) ufs.add(ufVal);
  });

  const container = document.getElementById('ufFilterButtons');
  container.innerHTML = `
    <button class="uf-btn ${selectedUF === 'TODOS' ? 'active' : ''}" onclick="filtrarUF('TODOS')">TODOS</button>
  `;

  Array.from(ufs).sort().forEach(uf => {
    const btn = document.createElement('button');
    btn.className = `uf-btn ${selectedUF === uf ? 'active' : ''}`;
    btn.onclick = () => filtrarUF(uf);
    btn.innerText = uf;
    container.appendChild(btn);
  });
}

function filtrarUF(uf) {
  selectedUF = uf;
  gerarFiltrosUF();
  renderizarPainel();

  // Aplica o filtro diretamente na planilha nativa do Tableau
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
  // Filtrar Dados
  const filteredData = selectedUF === 'TODOS'
    ? rawData
    : rawData.filter(row => (row[0].formattedValue || row[0].value) === selectedUF);

  // Calcular métricas das Medidas
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
  
  document.getElementById('totalUfDisplay').innerText = selectedUF === 'TODOS' ? `${uniqueUFs.size} UFs` : selectedUF;
  document.getElementById('kpiApto').innerText = totalApto.toLocaleString('pt-BR');
  document.getElementById('kpiEnf').innerText = totalEnf.toLocaleString('pt-BR');
  document.getElementById('kpiSuperior').innerText = totalSuperior.toLocaleString('pt-BR');
  document.getElementById('kpiCount').innerText = filteredData.length.toLocaleString('pt-BR');

  // Renderizar Tabela (Cabeçalho)
  const headerRow = document.getElementById('tableHeader');
  headerRow.innerHTML = '';
  allColumns.forEach(col => {
    const th = document.createElement('th');
    th.innerText = col.fieldName;
    headerRow.appendChild(th);
  });

  // Renderizar Tabela (Linhas)
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
