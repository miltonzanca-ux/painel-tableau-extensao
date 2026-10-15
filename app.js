let rawData = [];
let allColumns = [];
let selectedUF = 'TODOS';

// Dados de referência fiéis à imagem
const D = {
  meses: ['10/25','11/25','12/25','01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26'],
  real: [902, 915, 948, 930, 861, 892, 958, 859, 1022, 964, 936, 978, null, null, null],
  proj: [null, null, null, null, null, null, null, null, null, null, null, null, 877.8, 921.0, 902.0],
  min:  [null, null, null, null, null, null, null, null, null, null, null, null, 842, 872, 845],
  max:  [null, null, null, null, null, null, null, null, null, null, null, null, 914, 970, 959],
  autMeses: [['05/26', 1.01], ['06/26', 1.15], ['07/26', 1.09], ['08/26', 1.06], ['09/26', 1.10], ['10/26', 0.55]],
  grupos: [
    ['Internamento', 352.4, -9.5],
    ['Exames', 168.9, -8.4],
    ['Outro ambulatório', 143.8, -13.0],
    ['Terapias', 92.6, -9.0],
    ['Consulta programada', 61.3, -8.4],
    ['Urgências', 58.7, -16.4]
  ]
};

// Ajuste automático da tela (1920x1080)
function ajustaPalco() {
  const p = document.getElementById('palco');
  if (!p) return;
  const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  p.style.transform = `translate(${-960 * k}px,${-540 * k}px) scale(${k})`;
}

window.addEventListener('resize', () => { ajustaPalco(); renderizarGraficoSVG(); });
ajustaPalco();

// Conexão com o Tableau
tableau.extensions.initializeAsync().then(() => {
  carregarDadosTableau();

  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (worksheet) {
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, carregarDadosTableau);
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, carregarDadosTableau);
  }
}).catch((err) => console.error(err));

async function carregarDadosTableau() {
  const dashboard = tableau.extensions.dashboardContent.dashboard;
  const worksheet = dashboard.worksheets.find(ws => ws.name === 'PlanTeste') || dashboard.worksheets[0];

  if (!worksheet) return;

  try {
    const summaryData = await worksheet.getSummaryDataAsync();
    allColumns = summaryData.columns;
    rawData = summaryData.data;

    populaSelectUF();
    renderizarPainel();

  } catch (error) {
    console.error(error);
  }
}

function populaSelectUF() {
  const ufs = new Set();
  rawData.forEach(row => {
    const ufVal = row[0].formattedValue || row[0].value;
    if (ufVal) ufs.add(ufVal);
  });

  const select = document.getElementById('ufSelect');
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
  // Mini barras de meses autorizados
  const am = D.autMeses;
  const amx = Math.max(...am.map(a => a[1]));
  document.getElementById('a1m').innerHTML = am.map(([m, v], i) => `
    <div class="${i === am.length - 1 ? 'at' : ''}">
      <span>${v.toFixed(2).replace('.', ',')}</span>
      <i style="height:${(v / amx * 52)}px"></i>
      <span>${m}</span>
    </div>`).join('');

  // Grupos de serviço
  const gmax = Math.max(...D.grupos.map(g => g[1]));
  document.getElementById('grp').innerHTML = D.grupos.map(([n, v, d]) => `
    <span class="n">${n}</span>
    <div><div class="b" style="width:${(v / gmax * 100)}%"></div></div>
    <span class="r">${v.toFixed(1).replace('.', ',')}</span>
    <span class="d ok">${d.toFixed(1).replace('.', ',')}%</span>
  `).join('');

  renderizarGraficoSVG();
}

function renderizarGraficoSVG() {
  const box = document.getElementById('graf');
  const W = box.clientWidth;
  const H = box.clientHeight;
  if (!W || !H) return;

  const m = { l: 24, r: 24, t: 46, b: 44 };
  const n = D.meses.length;
  const lo = 780, hi = 1080;
  const iM = 12; // Mês 10/26

  const x = i => m.l + (i + 0.5) * (W - m.l - m.r) / n;
  const y = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);

  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

  // Linhas de Grade
  [800, 900, 1000].forEach(v => {
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#1E3B37" stroke-width="1" stroke-dasharray="4 4"/>`;
  });

  // Highlight do Mês Atual (10/26)
  const cw = (W - m.l - m.r) / n;
  s += `<rect x="${x(iM) - cw / 2}" y="${m.t - 30}" width="${cw}" height="${H - m.t - m.b + 30}" fill="#12302C" opacity=".7" rx="8"/>`;
  s += `<text x="${x(iM)}" y="${m.t - 14}" text-anchor="middle" fill="#F2CE79" font-size="14" font-weight="800" letter-spacing="1.5">HOJE</text>`;

  // Área de Incerteza (Intervalo)
  const pi = [...Array(n).keys()].filter(i => D.min[i] != null);
  const pathData = `M${x(11)},${y(D.real[11])} ` +
                   pi.map(i => `L${x(i)},${y(D.max[i])}`).join(' ') + ' ' +
                   pi.slice().reverse().map(i => `L${x(i)},${y(D.min[i])}`).join(' ') + ' Z';
  s += `<path d="${pathData}" fill="rgba(245,194,122,.12)"/>`;

  // Linha Realizado
  const ri = [...Array(n).keys()].filter(i => D.real[i] != null);
  s += `<polyline points="${ri.map(i => x(i) + ',' + y(D.real[i])).join(' ')}" fill="none" stroke="#4BB3C6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;

  // Linha Projeção (Pontilhada)
  s += `<polyline points="${[11, ...pi].map(i => x(i) + ',' + y(i === 11 ? D.real[i] : D.proj[i])).join(' ')}" fill="none" stroke="#F5C27A" stroke-width="4" stroke-dasharray="6 8" stroke-linecap="round"/>`;

  // Pontos Realizados
  ri.forEach(i => {
    const v = D.real[i];
    const up = i === 0 || v >= D.real[i - 1];
    s += `<circle class="graf-point" cx="${x(i)}" cy="${y(v)}" r="7" fill="#4BB3C6" stroke="#0C201E" stroke-width="2"/>`;
    s += `<text x="${x(i)}" y="${up ? y(v) - 18 : y(v) + 32}" text-anchor="middle" fill="#ECF3F0" font-size="18" font-weight="700">${v}</text>`;
  });

  // Pontos Projetados
  pi.forEach(i => {
    const v = D.proj[i];
    s += `<circle class="graf-point" cx="${x(i)}" cy="${y(v)}" r="7" fill="#0C201E" stroke="#F5C27A" stroke-width="3"/>`;
    s += `<text x="${x(i)}" y="${y(D.max[i]) - 16}" text-anchor="middle" fill="#F5C27A" font-size="18" font-weight="700">${v.toFixed(0)}</text>`;
  });

  // Eixo X
  D.meses.forEach((t, i) => {
    s += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" fill="${i === iM ? '#F2CE79' : i > iM ? '#A9BEB9' : '#7F9893'}" font-size="16" font-weight="${i === iM ? 800 : 500}">${t}</text>`;
  });

  s += '</svg>';
  box.innerHTML = s;
}
