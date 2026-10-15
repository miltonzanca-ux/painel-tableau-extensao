const NUM = (v, d=1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const PCT = v => (v > 0 ? '+' : v < 0 ? '−' : '') + NUM(Math.abs(v) * 100) + '%';
const cls = v => v < 0 ? 'ok' : 'bad';

const D = {
  meses: ['10/25','11/25','12/25','01/26','02/26','03/26','04/26','05/26','06/26','07/26','08/26','09/26','10/26','11/26','12/26'],
  real: [902, 915, 948, 930, 861, 892, 958, 859, 1022, 964, 936, 978, null, null, null],
  proj: [null, null, null, null, null, null, null, null, null, null, null, null, 877.8, 921.0, 902.0],
  min:  [null, null, null, null, null, null, null, null, null, null, null, null, 842, 872, 845],
  max:  [null, null, null, null, null, null, null, null, null, null, null, null, 914, 970, 959],
  realHoje: 389.3, dia: 15, diasMes: 31,
  solicitado: 582.6, negado: 28.5, autSetMesmoDia: 537.4,
  jaAutNov: 214.6,
  autMeses: [['05/26', 1010], ['06/26', 1150], ['07/26', 1090], ['08/26', 1060], ['09/26', 1100], ['10/26', 554.1]],
  grupos: [
    ['Internamento', 352.4, 389.6],
    ['Exames', 168.9, 184.3],
    ['Outro ambulatório', 143.8, 165.2],
    ['Terapias', 92.6, 101.8],
    ['Consulta programada', 61.3, 66.9],
    ['Urgências', 58.7, 70.2]
  ],
  mat: [['M0', 22], ['M+1', 46], ['M+2', 18], ['M+3+', 14]]
};

const iM = 12;
const pAtual = D.proj[iM];
const fechAnt = D.real[11];
const anoAnt = D.real[0];
const med6 = D.real.slice(6, 12).reduce((a, b) => a + b, 0) / 6;
const $ = id => document.getElementById(id);

// Preenchimento Hero
$('hv').textContent = NUM(pAtual);
const dv = pAtual - fechAnt;
const dp = pAtual / fechAnt - 1;
$('hd').className = cls(dv);
$('hd').textContent = (dv < 0 ? '▼ −' : '▲ +') + 'R$ ' + NUM(Math.abs(dv)) + ' mi · ' + PCT(dp);
$('hdt').textContent = 'vs fecho de set/26 · R$ ' + NUM(fechAnt) + ' mi';

$('hc').innerHTML = [
  ['vs set/26', pAtual / fechAnt - 1],
  ['vs out/25', pAtual / anoAnt - 1],
  ['vs média 6 meses', pAtual / med6 - 1]
].map(([t, v]) => `<span>${t} <b class="${cls(v)}">${PCT(v)}</b></span>`).join('');

const pr = D.realHoje / pAtual;
const pc = D.dia / D.diasMes;
$('rr').textContent = 'R$' + NUM(D.realHoje) + ' mi';$('rp').textContent = NUM(pr * 100, 0) + '%';

setTimeout(() => {
  $('rb').style.width = (pr * 100) + '\%';$('n1b').style.width = (D.jaAutNov / D.proj[13] * 100) + '%';
}, 300);

$('rm').style.left = `calc(${pc * 100}% - 2px)`;
$('rs').innerHTML = `<span style="color:var(--gold);text-shadow:0 0 5px var(--gold);">▎</span> dia ${D.dia} de ${D.diasMes} · ${NUM(pc * 100, 0)}% do mês`;
$('rf').textContent = 'faltam R$ ' + NUM(pAtual - D.realHoje) + ' mi';

// Tiles
const aut = D.solicitado - D.negado;
$('a1').textContent = NUM(aut);$('a1t').innerHTML = `solicitado <b>R$ ${NUM(D.solicitado)} mi</b> · negado <b>${NUM(D.negado / D.solicitado * 100)}%</b>`;
const va = aut / D.autSetMesmoDia - 1;
$('a1d').innerHTML = `vs set/26 no mesmo dia <b class="${cls(va)}">${PCT(va)}</b>`;
$('n1').textContent = NUM(D.proj[13]);$('n1t').innerHTML = `intervalo <b>R$ ${NUM(D.min[13], 0)} a ${NUM(D.max[13], 0)} mi</b>`;
$('n1a').textContent = 'R$' + NUM(D.jaAutNov) + ' mi';$('n1p').textContent = NUM(D.jaAutNov / D.proj[13] * 100, 0) + '%';

const am = D.autMeses;
const amx = Math.max(...am.map(a => a[1]));
$('a1m').innerHTML = am.map(([m, v], i) => `
  <div class="${i === am.length - 1 ? 'at' : ''}">
    <span>${NUM(v / 1000, 2)}</span>
    <i style="height:0" data-h="${v / amx * 52}px"></i>
    <span>${m}</span>
  </div>`).join('');

setTimeout(() => {
  document.querySelectorAll('#a1m i').forEach(el => el.style.height = el.getAttribute('data-h'));
}, 400);

const gmax = Math.max(...D.grupos.map(g => g[1]));
$('grp').innerHTML = D.grupos.map(([n, v, b]) => {
  const d = v / b - 1;
  return `<span class="n">${n}</span>
          <div><div class="b" style="width:0" data-w="${v / gmax * 100}%"></div></div>
          <span class="r">${NUM(v)}</span>
          <span class="d ${cls(d)}">${PCT(d)}</span>`;
}).join('');

setTimeout(() => {
  document.querySelectorAll('#grp .b').forEach(el => el.style.width = el.getAttribute('data-w'));
}, 500);

const mcor = ['#4BB3C6', '#8FE3B4', '#F5C27A', '#F58A3D'];
$('mat').innerHTML = D.mat.map(([n, p], i) => `<div style="flex:${p};background:${mcor[i]}">${p >= 10 ? p + '%' : ''}</div>`).join('');
$('matl').innerHTML = D.mat.map(([n, p]) => `<span style="flex:${p}">${n}</span>`).join('');
$('matt').innerHTML = `<b>${D.mat[0][1] + D.mat[1][1]}%</b> do valor autorizado converte-se em custo até ao mês seguinte`;

const gMaior = D.grupos.reduce((a, g) => g[1] / g[2] - 1 < a[1] / a[2] - 1 ? g : a);
$('rod').innerHTML = `Projeção de out/26 ${NUM(Math.abs(dp) * 100)}% ${dp < 0 ? 'abaixo' : 'acima'} de set/26 · Maior queda: ${gMaior[0]} ${PCT(gMaior[1] / gMaior[2] - 1)} · Internamento = ${NUM(D.grupos[0][1] / pAtual * 100, 0)}% do projetado`;

// Gráfico SVG
function grafico() {
  const box = $('graf');
  const W = box.clientWidth;
  const H = box.clientHeight;
  if (!W || !H) return;
  
  const m = { l: 24, r: 24, t: 46, b: 44 };
  const n = D.meses.length;
  const lo = 780, hi = 1080;
  
  const x = i => m.l + (i + 0.5) * (W - m.l - m.r) / n;
  const y = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
  
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  
  [800, 900, 1000].forEach(v => {
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#1E3B37" stroke-width="1" stroke-dasharray="4 4"/>`;
  });
  
  const cw = (W - m.l - m.r) / n;
  s += `<rect x="${x(iM) - cw / 2}" y="${m.t - 30}" width="${cw}" height="${H - m.t - m.b + 30}" fill="#12302C" opacity=".7" rx="8"/>`;
  s += `<text x="${x(iM)}" y="${m.t - 14}" text-anchor="middle" fill="#F2CE79" font-size="14" font-weight="800" letter-spacing="1.5">HOJE</text>`;
  
  const pi = [...Array(n).keys()].filter(i => D.min[i] != null);
  const pathData = `M${x(11)},${y(D.real[11])} ` +
                   pi.map(i => `L${x(i)},${y(D.max[i])}`).join(' ') + ' ' +
                   pi.slice().reverse().map(i => `L${x(i)},${y(D.min[i])}`).join(' ') + ' Z';
  s += `<path d="${pathData}" fill="rgba(245,194,122,.12)"/>`;
  
  const ri = [...Array(n).keys()].filter(i => D.real[i] != null);
  s += `<polyline points="${ri.map(i => x(i) + ',' + y(D.real[i])).join(' ')}" fill="none" stroke="#4BB3C6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<polyline points="${[11, ...pi].map(i => x(i) + ',' + y(i === 11 ? D.real[i] : D.proj[i])).join(' ')}" fill="none" stroke="#F5C27A" stroke-width="4" stroke-dasharray="6 8" stroke-linecap="round"/>`;
  
  ri.forEach(i => {
    const v = D.real[i];
    const up = i === 0 || v >= D.real[i - 1];
    s += `<circle class="graf-point" cx="${x(i)}" cy="${y(v)}" r="7" fill="#4BB3C6" stroke="#0C201E" stroke-width="2"><title>${D.meses[i]} · realizado R$ ${NUM(v)} mi</title></circle>`;
    s += `<text x="${x(i)}" y="${up ? y(v) - 18 : y(v) + 32}" text-anchor="middle" fill="#ECF3F0" font-size="18" font-weight="700" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${NUM(v, 0)}</text>`;
  });
  
  pi.forEach(i => {
    const v = D.proj[i];
    s += `<circle class="graf-point" cx="${x(i)}" cy="${y(v)}" r="7" fill="#0C201E" stroke="#F5C27A" stroke-width="3"><title>${D.meses[i]} · projetado R$ ${NUM(v)} mi (${NUM(D.min[i], 0)} a ${NUM(D.max[i], 0)})</title></circle>`;
    s += `<text x="${x(i)}" y="${y(D.max[i]) - 16}" text-anchor="middle" fill="#F5C27A" font-size="18" font-weight="700" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${NUM(v, 0)}</text>`;
  });
  
  D.meses.forEach((t, i) => {
    s += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" fill="${i === iM ? '#F2CE79' : i > iM ? '#A9BEB9' : '#7F9893'}" font-size="16" font-weight="${i === iM ? 800 : 500}">${t}</text>`;
  });
  
  s += '</svg>';
  box.innerHTML = s;
}

function ajusta() {
  const p = $('palco');
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  p.style.transform = `translate(${-960 * k}px,${-540 * k}px) scale(${k})`;
}

addEventListener('resize', () => { ajusta(); grafico(); });
ajusta();
grafico();

$('abre').onclick = () => {$('prem').hidden = false; };
$('fecha').onclick = () => {$('prem').hidden = true; };
addEventListener('keydown', e => {
  if (e.key === 'p' || e.key === 'P') $('prem').hidden = !$('prem').hidden;
  if (e.key === 'Escape') $('prem').hidden = true;
});
