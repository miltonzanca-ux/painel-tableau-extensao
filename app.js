let rawData = [];
let allColumns = [];
let selectedUF = 'TODOS';

// Redimensionamento do Palco (1920x1080)
function ajustaPalco() {
  const p = document.getElementById('palco');
  if (!p) return;
  const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  p.style.transform = `translate(${-960 * k}px,${-540 * k}px) scale(${k})`;
}

window.addEventListener('resize', () => { ajustaPalco(); renderizarGrafico(); });
ajustaPalco();

// Conexão com a Extensão do Tableau
tableau.extensions.initializeAsync().then(() => {
  document.getElementById('rod').innerText = 'Conectado ao Tableau com sucesso. Dados sincronizados.';
  carregarDadosTableau();

  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (worksheet) {
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, carregarDadosTableau);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, carregarDadosTableau);
  }
}).catch((err) => {
  document.getElementById('rod').innerText = 'Erro ao conectar no Tableau: ' + err.toString();
});

async function carregarDadosTableau() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (!worksheet) {
    document.getElementById('rod').innerText = 'Aviso: Planilha "PlanTeste" não encontrada no Dashboard.';
    return;
  }

  try {
    const summaryData = await worksheet.getSummaryDataAsync();
    allColumns = summaryData.columns;
    rawData = summaryData.data;

    populaSelectUF();
    renderizarPainel();

  } catch (error) {
    document.getElementById('rod').innerText = 'Erro ao ler dados: ' + error.toString();
  }
}

// Preenche as opções do filtro suspenso dinamicamente
function populaSelectUF() {
  const ufs = new Set();
  
  rawData.forEach(row => {
    const ufVal = row[0].formattedValue || row[0].value;
    if (ufVal) ufs.add(ufVal);
  });

  const select = document.getElementById('ufSelect');
  
  // Preserva a opção "TODOS" e adiciona as UFs encontradas
  select.innerHTML = '<option value="TODOS">TODAS AS UFs</option>';

  Array.from(ufs).sort().forEach(uf => {
    const opt = document.createElement('option');
    opt.value = uf;
    opt.innerText = `UF: ${uf}`;
    if (uf === selectedUF) opt.selected = true;
    select.appendChild(opt);
  });
}

function filtrarUF(uf) {
  selectedUF = uf;
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
  const filteredData = selectedUF === 'TODOS'
    ? rawData
    : rawData.filter(row => (row[0].formattedValue || row[0].value) === selectedUF);

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

  document.getElementById('selectedUfText').innerText = selectedUF === 'TODOS' ? 'TODAS' : selectedUF;
  document.getElementById('kpiApto').innerText = totalApto.toLocaleString('pt-BR');
  document.getElementById('kpiEnf').innerText = totalEnf.toLocaleString('pt-BR');
  document.getElementById('kpiSuperior').innerText = totalSuperior.toLocaleString('pt-BR');

  const totalGeral = totalApto + totalSuperior;
  const prop = totalGeral > 0 ? (totalApto / totalGeral) * 100 : 0;
  document.getElementById('kpiProp').innerText = prop.toFixed(1) + '%';
  document.getElementById('barProp').style.width = prop + '%';

  // Renderizar Tabela
  const headerRow = document.getElementById('tableHeader');
  headerRow.innerHTML = '';
  allColumns.forEach(col => {
    const th = document.createElement('th');
    th.innerText = col.fieldName;
    headerRow.appendChild(th);
  });

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

  renderizarGrafico();
}

function renderizarGrafico() {
  const box = document.getElementById('graf');
  const W = box.clientWidth;
  const H = box.clientHeight;
  if (!W || !H || rawData.length === 0) return;

  const m = { l: 40, r: 40, t: 40, b: 40 };
  const ufs = Array.from(new Set(rawData.map(r => r[0].formattedValue || r[0].value)));
  const n = ufs.length;

  const x = i => m.l + (i + 0.5) * (W - m.l - m.r) / (n || 1);
  const maxVal = 3000;
  const y = v => m.t + (1 - (v / maxVal)) * (H - m.t - m.b);

  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

  [1000, 2000, 3000].forEach(v => {
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#1E3B37" stroke-width="1" stroke-dasharray="4 4"/>`;
  });

  ufs.forEach((uf, i) => {
    const row = rawData.find(r => (r[0].formattedValue || r[0].value) === uf);
    let val = 0;
    if (row && row[1]) val = parseFloat(row[1].value) || 500;

    const cx = x(i);
    const cy = y(val);

    s += `<circle class="graf-point" cx="${cx}" cy="${cy}" r="7" fill="#4BB3C6" stroke="#0C201E" stroke-width="2"><title>${uf}: ${val}</title></circle>`;
    s += `<text x="${cx}" y="${cy - 14}" text-anchor="middle" fill="#ECF3F0" font-size="14" font-weight="700">${val.toFixed(0)}</text>`;
    s += `<text x="${cx}" y="${H - 10}" text-anchor="middle" fill="#7F9893" font-size="14">${uf}</text>`;
  });

  s += '</svg>';
  box.innerHTML = s;
}
