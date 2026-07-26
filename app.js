// Gestão Setor de Secretaria de Vendas - Neo Service — deploy automático via GitHub + Netlify
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { CONFIG } from './config.js';

const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

const app = document.getElementById('app');
const PAGE = 25;
let state = {
  session: null, view: 'dashboard',
  page: 0, total: 0,
  filtros: { status: '', analista: '', busca: '', mes: '' },
  lookups: {},
  escalaMes: new Date().toISOString().slice(0, 7),
  dashMes: '',
  fechMes: new Date().toISOString().slice(0, 7),
};

function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDt(d){ return d ? new Date(d).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''; }
function mesLabel(m){ const [y,mo]=m.split('-'); return ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][mo-1]+'/'+y.slice(2); }

// ---------- LOGIN ----------
const FEATURES = [
  ['📈', 'Dashboard & Insights', 'KPIs, ranking de produtividade e alertas de SLA em tempo real.'],
  ['📅', 'Análise de Produção', 'Metas automáticas, tendência semanal e capacidade real por analista.'],
  ['🔄', 'Pipeline de Processos', 'Controle completo das demandas, do recebimento à conclusão.'],
  ['🏦', 'Gestão de Repasse', 'Cadastro único do cliente com timeline automática do processo.'],
  ['📆', 'Escala de Plantão', 'Organização mensal da equipe com alerta de cobertura diária.'],
  ['💰', 'Fechamento Mensal', 'Extrato por analista e canal, pronto para exportação.'],
];
function renderLogin(msg = '', tipo = 'erro') {
  app.innerHTML = `
  <div id="login-page">
    <div class="login-hero">
      <div class="hero-badge">🔒 SISTEMA INTERNO</div>
      <h1>Gestão que organiza.<br>Informação que move<br><span>resultados.</span></h1>
      <p class="hero-sub">Painel de gestão operacional da equipe Secretaria de Vendas.</p>
      <div class="hero-features">
        ${FEATURES.map(([ic,t,d]) => `<div class="hf"><div class="hf-ic">${ic}</div><div><b>${t}</b><small>${d}</small></div></div>`).join('')}
      </div>
    </div>
    <div class="login-panel">
      <div class="card" id="login-card">
        <div class="login-icon">🏢</div>
        <h2>Gestão Operacional</h2>
        <div class="login-brandline">Secretaria de Vendas</div>
        <div class="sub">Painel interno da equipe</div>
        <label>E-mail corporativo</label>
        <div class="input-ic"><span>✉️</span><input id="email" type="email" autocomplete="username" placeholder="seu.email@neoservice.com.br"></div>
        <label>Senha</label>
        <div class="input-ic"><span>🔒</span><input id="senha" type="password" autocomplete="current-password" placeholder="••••••••••"></div>
        <div class="login-row">
          <label class="chk-inline"><input type="checkbox" id="manterConectado" checked> Manter conectado</label>
          <a href="#" id="linkEsqueci">Esqueci minha senha</a>
        </div>
        <button id="btnLogin">Entrar →</button>
        <p style="color:var(--muted2);font-size:11.5px;text-align:center;margin-top:12px">Acesso somente por convite do administrador.</p>
        <div class="msg ${tipo}">${esc(msg)}</div>
        <div class="login-footer-note">🛡️ Ambiente Corporativo &nbsp;·&nbsp; Versão 1.0.0</div>
      </div>
    </div>
    <div class="login-copyright">Neo Service © ${new Date().getFullYear()} · Sistema interno · Uso exclusivo da equipe</div>
  </div>`;
  const valida = () => {
    if (!email.value.trim() || !senha.value) { renderLogin('Preencha e-mail e senha.'); return false; }
    if (senha.value.length < 6) { renderLogin('A senha precisa ter pelo menos 6 caracteres.'); return false; }
    return true;
  };
  btnLogin.onclick = async () => {
    if (!valida()) return;
    const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: senha.value });
    if (error) renderLogin(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message); else init();
  };
  linkEsqueci.onclick = async (e) => {
    e.preventDefault();
    const em = email.value.trim();
    if (!em) { renderLogin('Digite seu e-mail acima e clique em "Esqueci minha senha" de novo.'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(em);
    renderLogin(error ? error.message : 'Enviamos um link de redefinição de senha para ' + em + '.', error ? 'erro' : 'ok');
  };
  [email, senha].forEach(el => el && el.addEventListener('keydown', e => { if (e.key === 'Enter') btnLogin.click(); }));
}

// ---------- SHELL (4 pilares) ----------
const PILARES = [
  ['📊 Inteligência', [
    ['dashboard', '📈', 'Dashboard'],
    ['metas', '🎯', 'Metas & Indicadores'],
    ['analytics', '📉', 'Analytics'],
    ['insights', '💡', 'Insights'],
  ]],
  ['⚙️ Operação', [
    ['pipeline', '📅', 'Produção'],
    ['esteira', '⛓️', 'Esteira'],
    ['qualidade', '🔁', 'Qualidade / Retrabalho'],
    ['operacoes', '🗂️', 'Operações'],
    ['repasse', '🏦', 'Repasse'],
    ['validacao', '✅', 'Validação'],
    ['followup', '💬', 'Follow-up'],
  ]],
  ['🤖 Plataforma', [
    ['integracoes', '🔌', 'Integrações'],
    ['automacoes', '⚡', 'Automações'],
    ['documentos', '📄', 'Documentos'],
  ]],
  ['🏢 Gestão', [
    ['chamados', '📨', 'Demandas'],
    ['implantacao', '🚀', 'Produtos em Implantação'],
    ['fechamento', '💰', 'Fechamento'],
    ['escala', '📅', 'Escala'],
    ['cadastros', '🛠️', 'Administração'],
  ]],
];
// Telas restritas a gestão (admin = supervisor/coordenador). Analistas não veem inteligência nem administração.
const VIEWS_GESTAO = ['dashboard', 'analytics', 'insights', 'fechamento', 'escala', 'cadastros', 'integracoes', 'automacoes', 'metas', 'implantacao'];
function podeVer(view) {
  return state.role === 'admin' ? true : !VIEWS_GESTAO.includes(view);
}
function shell(inner) {
  const pilaresVisiveis = PILARES
    .map(([grp, items]) => [grp, items.filter(([v]) => podeVer(v))])
    .filter(([, items]) => items.length);
  app.innerHTML = `
  <div class="layout">
    <aside>
      <div class="side-brand"><span class="logo">🏢</span><div><b>Secretaria de Vendas</b><small>Neo Service</small></div></div>
      ${pilaresVisiveis.map(([grp, items]) => `
        <div class="side-group">${grp}</div>
        ${items.map(([v, ic, l]) => `<button class="side-item ${state.view===v?'active':''}" data-v="${v}"><span>${ic}</span>${l}</button>`).join('')}
      `).join('')}
      <div class="side-footer">
        <button id="btnApresentacao" class="ghost">${state.modoApresentacao ? '👁️ Modo Normal' : '📺 Modo Apresentação'}</button>
        <button id="btnExportAll" class="ghost">⬇ Exportar planilha</button>
        <button id="btnSair" class="ghost">Sair</button>
      </div>
    </aside>
    <main>${inner}</main>
  </div>`;
  document.querySelectorAll('.side-item').forEach(b => b.onclick = () => { state.view = b.dataset.v; render(); });
  btnSair.onclick = async () => { await sb.auth.signOut(); renderLogin(); };
  btnExportAll.onclick = exportarPlanilhaCompleta;
  btnApresentacao.onclick = () => { state.modoApresentacao = !state.modoApresentacao; render(); };
}
function nomeExib(nome, rank) {
  return state.modoApresentacao ? `Colaborador ${rank}` : nome;
}
function render() {
  if (!podeVer(state.view)) state.view = 'pipeline';
  ({ dashboard: renderDashboard, analytics: renderAnalytics, insights: renderInsights,
     pipeline: renderDemandas, esteira: renderEsteira, operacoes: renderOperacoes, repasse: renderRepasse, validacao: renderValidacao,
     followup: renderFollowup, integracoes: () => renderStub('🔌 Integrações', 'Conecte Anapro, Mega, Sienge, bancos e assinatura digital. Cada integração aparecerá aqui com status de conexão e última sincronização.', ['Anapro — entrada automática de propostas', 'Mega / Sienge — ERP', 'Bancos — status de análise de crédito', 'Assinatura digital — acompanhamento de envelopes']),
     automacoes: () => renderStub('⚡ Automações', 'Regras de negócio e fluxos automáticos. A primeira automação ativa é o monitoramento de plantão (veja Insights). Próximas:', ['Alerta automático por e-mail/Teams às 12h e 17h', 'Distribuição automática de processos por carga de trabalho', 'Cobrança automática de follow-up sem resposta', 'Fechamento mensal gerado e enviado automaticamente']),
     documentos: () => renderStub('📄 Documentos', 'Repositório de contratos, minutas, anexos e modelos vinculados a cada processo.', ['Upload de anexos por processo', 'Modelos de contrato por empreendedora', 'Histórico de versões']),
     chamados: renderChamados, fechamento: renderFechamento, escala: renderEscala,
     metas: renderMetas, qualidade: renderQualidade, implantacao: renderImplantacao,
     cadastros: renderCadastros })[state.view]();
}
function renderStub(titulo, texto, itens) {
  shell(`
    <div class="card" style="max-width:720px">
      <h2>${titulo}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${texto}</p>
      ${itens.map(i => `<div class="chk"><span style="color:var(--accent)">◦</span> ${i}</div>`).join('')}
      <div class="msg" style="margin-top:16px">🚧 Módulo em evolução — estrutura pronta para receber estas funcionalidades.</div>
    </div>`);
}

async function loadLookups() {
  const [an, emp, ativ, empr, cli] = await Promise.all([
    sb.from('analistas').select('id,nome,status,cargo').order('nome'),
    sb.from('empreendedoras').select('id,nome').order('nome'),
    sb.from('atividades').select('id,nome,ativa').order('nome'),
    sb.from('empreendimentos').select('id,nome,empreendedora_id').order('nome'),
    sb.from('clientes').select('id,nome').order('nome'),
  ]);
  state.lookups = { analistas: an.data||[], empreendedoras: emp.data||[], atividades: ativ.data||[], empreendimentos: empr.data||[] };
  state.clientesLookup = cli.data || [];
}

// ---------- DASHBOARD (executivo: KPIs + produção + ranking, tudo numa tela) ----------
function pctFmt(num, den) {
  if (!den) return '0%';
  const p = 100 * num / den;
  return (p >= 99.995 ? '100' : p.toFixed(2)) + '%';
}
async function renderDashboard() {
  const hoje0 = new Date();
  const ymAdd = (ym, n) => { const [y,m]=ym.split('-').map(Number); const d=new Date(y,m-1+n,1); return d.toISOString().slice(0,7); };
  const thisYm = hoje0.toISOString().slice(0,7);
  const dAdd = (dt, n) => { const d=new Date(dt+'T12:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const todayStr = hoje0.toISOString().slice(0,10);
  if (!state.dashAnalista) state.dashAnalista = '';
  if (!state.volAte) state.volAte = thisYm;
  if (!state.volDe) state.volDe = ymAdd(thisYm, -11);
  if (!state.diaAte) state.diaAte = todayStr;
  if (!state.diaDe) state.diaDe = dAdd(todayStr, -59);

  const [{ data: vol }, rkAll, { data: pd }, { data: pad }, { data: solo }, { data: metaF }, { data: cfg }, { data: ativs }, { data: tops }] = await Promise.all([
    sb.from('volume_mensal').select('*'),
    sb.from('ranking_analistas').select('*'),
    sb.from('producao_diaria').select('*'),
    sb.from('producao_analista_dia').select('*'),
    sb.from('fds_solo').select('*'),
    sb.from('metas_fds').select('*'),
    sb.from('metas_config').select('*'),
    sb.from('volume_atividades').select('*'),
    sb.from('top_empreendedoras').select('*'),
  ]);
  const { data: eventos } = await sb.from('eventos_especiais').select('*');
  const diasLancamento = new Set((eventos||[]).map(e => e.data));
  const meses = [...new Set((rkAll.data||[]).map(r => r.mes.slice(0,7)))].sort().reverse();
  if (!state.dashMes && meses.length) state.dashMes = meses[0];
  let rk = (rkAll.data||[]).filter(r => r.mes.slice(0,7) === state.dashMes).sort((a,b) => b.total - a.total);
  if (state.dashAnalista) rk = rk.filter(r => r.nome === state.dashAnalista);
  const todosAnalistas = [...new Set((rkAll.data||[]).map(r => r.nome))].sort();

  const totAll = (vol||[]).reduce((s,v)=>s+v.total,0);
  const concAll = (vol||[]).reduce((s,v)=>s+v.concluidas,0);
  const volPorMes = {}; (vol||[]).forEach(v => volPorMes[v.mes.slice(0,7)] = v);
  const primeiroMesComDado = (vol||[]).map(v=>v.mes.slice(0,7)).filter(k=>volPorMes[k].total>0).sort()[0];

  // --- Volume mensal: intervalo livre (De/Até), não só presets ---
  // meses anteriores ao primeiro registro real não entram no gráfico (evita parede de barras zeradas)
  const volDeEfetivo = primeiroMesComDado && state.volDe < primeiroMesComDado ? primeiroMesComDado : state.volDe;
  const mesesLista = [];
  { let cur = volDeEfetivo; let guard = 0;
    while (cur <= state.volAte && guard++ < 120) { mesesLista.push(cur); cur = ymAdd(cur, 1); } }
  const volSerie = mesesLista.map(k => volPorMes[k] || { mes: k+'-01', total: 0, concluidas: 0 });
  const maxVol = Math.max(...volSerie.map(v=>v.total), 1);
  const avisoRecorte = primeiroMesComDado && state.volDe < primeiroMesComDado;

  // --- produção diária: intervalo livre (De/Até) ---
  const dias = pd || [];
  const porDia = {}; dias.forEach(d => porDia[d.dia] = d);
  const diasLista = [];
  { let cur = state.diaDe; let guard = 0;
    while (cur <= state.diaAte && guard++ < 400) { diasLista.push(cur); cur = dAdd(cur, 1); } }
  const dowOf = (k) => ((new Date(k+'T12:00').getDay()+6)%7)+1;
  const serieDias = diasLista.map(k => porDia[k] || { dia: k, total: 0, dow: dowOf(k) });

  // headcount (nº de analistas distintos que lançaram algo naquele dia) — usado pra normalizar a produção
  const porDiaHeadcount = {};
  (pad || []).forEach(p => { const s = porDiaHeadcount[p.dia] = porDiaHeadcount[p.dia] || new Set(); s.add(p.analista); });
  const serieNormalizada = serieDias.map(d => {
    const n = porDiaHeadcount[d.dia] ? porDiaHeadcount[d.dia].size : 0;
    return { ...d, nAnalistas: n, porAnalista: n ? Math.round(d.total/n*10)/10 : 0 };
  });

  // acumulado semanal — deriva do mesmo intervalo escolhido (não mais fixo em 12 semanas)
  const semanas = {};
  serieDias.forEach(d => {
    const dt = new Date(d.dia + 'T12:00');
    const seg = new Date(dt); seg.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    const k = seg.toISOString().slice(0, 10);
    const s = semanas[k] = semanas[k] || { total: 0, fds: 0 };
    s.total += d.total;
    if (d.dow >= 6) s.fds += d.total;
  });
  const semKeys = Object.keys(semanas).sort();
  const semVals = semKeys.map(k => semanas[k].total);

  // dias de lançamento distorcem médias (volume atípico com equipe reforçada) — podem ser excluídos
  const lancNoPeriodo = serieDias.filter(d => diasLancamento.has(d.dia) && d.total > 0);
  const baseMedias = state.excluirLancamentos ? serieDias.filter(d => !diasLancamento.has(d.dia)) : serieDias;
  const dowNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const porDow = [1,2,3,4,5,6,7].map(dw => {
    const ds = baseMedias.filter(d => d.dow == dw);
    return ds.length ? Math.round(ds.reduce((s, x) => s + x.total, 0) / ds.length * 10) / 10 : 0;
  });
  const maxDow = Math.max(...porDow, 1);
  const totalGeral = serieDias.reduce((s, d) => s + d.total, 0);
  const totalFds = serieDias.filter(d => d.dow >= 6).reduce((s, d) => s + d.total, 0);
  const soloPorAnalista = {};
  (solo || []).forEach(s => { const a = soloPorAnalista[s.analista] = soloPorAnalista[s.analista] || { n: 0, tot: 0 }; a.n++; a.tot += s.producao; });
  const soloDatas = (solo||[]).map(s=>s.dia).sort();
  const fmtDia = (d) => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '';
  const soloPeriodo = soloDatas.length ? `${fmtDia(soloDatas[0])} até ${fmtDia(soloDatas[soloDatas.length-1])}` : '—';
  const tend = semVals.length >= 3 ? semVals[semVals.length - 2] - semVals[semVals.length - 3] : 0;
  const meta = (metaF || [])[0] || {};
  const cfgMap = {}; (cfg || []).forEach(c => cfgMap[c.id] = c.valor);
  const hojeStr = todayStr;
  const ehFds = dowOf(hojeStr) >= 6;
  const prodHoje = (serieDias.find(d => d.dia === hojeStr) || {}).total || (porDia[hojeStr]?.total || 0);
  const metaFdsEfetiva = cfgMap.fds_esperada ?? meta.meta_esperada ?? 0;
  const metaDia = ehFds ? metaFdsEfetiva : (cfgMap.diaria || 0);
  const pctDia = metaDia ? Math.round(100 * prodHoje / metaDia) : null;
  const farol = (p) => p === null ? '—' : p >= 100 ? '🟢 Dentro da meta' : p >= 70 ? '🟡 Atenção' : '🔴 Fora da meta';

  const presetBtn = (id, label) => `<button class="ghost preset-btn" data-target="${id}">${label}</button>`;

  shell(`
    <div class="kpis">
      <div class="kpi"><div class="v">${totAll}</div><div class="l">📋 Total de processos</div></div>
      <div class="kpi"><div class="v" style="color:var(--ok)">${concAll}</div><div class="l">✅ Concluídos</div></div>
      <div class="kpi"><div class="v" style="color:var(--warn)">${totAll-concAll}</div><div class="l">⚠️ Pendentes</div></div>
      <div class="kpi"><div class="v" style="color:var(--accent)">${pctFmt(concAll, totAll)}</div><div class="l">📊 % conclusão</div></div>
    </div>
    <div class="card filters" style="align-items:center">
      <div><label>Mês do ranking</label><select id="dashMes">${meses.map(m=>`<option value="${m}" ${m===state.dashMes?'selected':''}>${mesLabel(m)}</option>`).join('')}</select></div>
      <div><label>Analista (ranking)</label><select id="dashAnalista"><option value="">Todos</option>
        ${todosAnalistas.map(n=>`<option value="${esc(n)}" ${state.dashAnalista===n?'selected':''}>${esc(n)}</option>`).join('')}</select></div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <h2 style="margin:0">Volume mensal — ${mesLabel(volDeEfetivo)} a ${mesLabel(state.volAte)}</h2>
        <div class="spacer"></div>
        ${[3,6,12,24].map(n=>presetBtn('vol'+n, n+'m')).join('')}
        <input id="volDe" type="month" value="${state.volDe}" style="min-width:120px">
        <span style="color:var(--muted)">até</span>
        <input id="volAte" type="month" value="${state.volAte}" style="min-width:120px">
      </div>
      ${avisoRecorte ? `<p style="color:var(--muted);font-size:12px;margin:-4px 0 8px">Sem produção registrada antes de ${mesLabel(primeiroMesComDado)} — meses anteriores foram ocultados do gráfico.</p>` : ''}
      <div class="chart">${volSerie.map(v => `
        <div class="bar-wrap" title="${mesLabel(v.mes.slice(0,7))}: ${v.total}">
          <div class="bar-val">${v.total}</div>
          <div class="bar" style="height:${Math.round(140*v.total/maxVol)}px"></div>
          <div class="bar-lbl">${mesLabel(v.mes.slice(0,7))}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v">${prodHoje}</div><div class="l">📥 Produção hoje ${metaDia ? '/ meta ' + metaDia + (ehFds ? ' (fds)' : '') : ''}</div></div>
      <div class="kpi"><div class="v">${pctDia !== null ? pctDia + '%' : '—'}</div><div class="l">${farol(pctDia)}</div></div>
      <div class="kpi"><div class="v" style="color:${tend >= 0 ? 'var(--ok)' : 'var(--err)'}">${tend >= 0 ? '▲' : '▼'} ${Math.abs(tend)}</div><div class="l">Tendência semanal</div></div>
      <div class="kpi"><div class="v">${totalGeral ? Math.round(100 * totalFds / totalGeral) : 0}%</div><div class="l">🗓️ Peso do fim de semana (no período)</div></div>
    </div>
    ${lancNoPeriodo.length ? `
    <div class="card" style="border-color:var(--warn);background:var(--warn-soft);margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <b style="font-size:13px">⚠️ ${lancNoPeriodo.length} dia(s) de lançamento neste período</b>
        <span style="font-size:12.5px;color:var(--muted)">
          ${lancNoPeriodo.slice(0,4).map(d=>`${fmtDia(d.dia)} (${d.total})`).join(' · ')}${lancNoPeriodo.length>4?' …':''}
          — volume atípico com equipe reforçada. Isso distorce médias e metas.
        </span>
        <div class="spacer"></div>
        <button id="btnToggleLanc" class="ghost">${state.excluirLancamentos ? '↩️ Incluir de volta nas médias' : '🚫 Excluir das médias'}</button>
      </div>
    </div>` : ''}
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
        <h2 style="margin:0">📈 Produção — ${fmtDia(state.diaDe)} a ${fmtDia(state.diaAte)}</h2>
        ${state.role === 'admin' ? '<button id="btnMarcarLanc" class="ghost" style="font-size:11.5px;padding:4px 8px">🚀 Marcar dia de lançamento</button>' : ''}
        <div class="spacer"></div>
        ${[30,60,90,180].map(n=>presetBtn('dia'+n, n+'d')).join('')}
        <input id="diaDe" type="date" value="${state.diaDe}">
        <span style="color:var(--muted)">até</span>
        <input id="diaAte" type="date" value="${state.diaAte}">
      </div>
      <p style="color:var(--muted);font-size:12px;margin-bottom:6px">Total por dia (topo) e <b>produção média por analista ativo naquele dia</b> (embaixo) — essa segunda linha não distorce quando um fim de semana teve mais gente escalada que o normal.</p>
      <svg viewBox="0 0 700 100" style="width:100%;height:100px">
        ${svgLine(serieDias.map(d => d.total), 700, 100, '#6d8bff', false)}
      </svg>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">— produção total por dia</div>
      <svg viewBox="0 0 700 100" style="width:100%;height:100px">
        ${svgLine(serieNormalizada.map(d => d.porAnalista), 700, 100, '#2dd4bf', false)}
      </svg>
      <div style="font-size:11px;color:var(--muted)">— produção média por analista ativo no dia (total ÷ nº de analistas que lançaram algo)</div>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📊 Acumulado semanal (dentro do período escolhido acima)</h2>
        ${semKeys.map(k => { const v = semanas[k]; const maxS = Math.max(...semKeys.map(x => semanas[x].total), 1);
          return `<div class="hbar-row"><span class="hbar-lbl">${new Date(k+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
          <div class="hbar"><div style="width:${Math.round(100*v.total/maxS)}%"></div></div><b>${v.total}</b>
          <span style="color:var(--muted);font-size:11px">(fds: ${v.fds})</span></div>`; }).join('') || '<p style="color:var(--muted);font-size:12.5px">Sem semanas completas no período.</p>'}
      </div>
      <div class="card">
        <h2>📆 Média por dia da semana (no período escolhido)${state.excluirLancamentos ? ' — sem lançamentos' : ''}</h2>
        ${dowNames.map((n, i) => `<div class="hbar-row"><span class="hbar-lbl">${n}</span>
          <div class="hbar"><div style="width:${Math.round(100*porDow[i]/maxDow)}%"></div></div><b>${porDow[i]}</b></div>`).join('')}
        <p style="color:var(--muted);font-size:12px;margin-top:8px">Melhor dia: <b>${dowNames[porDow.indexOf(Math.max(...porDow))]}</b> · Menor: <b>${dowNames[porDow.indexOf(Math.min(...porDow.filter(x=>x>0)))]}</b></p>
      </div>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>🧍 Capacidade real — fim de semana com 1 analista</h2>
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Considera <b>todo o histórico</b> (não segue os filtros acima) — dias de sáb/dom em que um único analista produziu: ${(solo||[]).length} dias, de ${soloPeriodo}.</p>
        ${Object.keys(soloPorAnalista).length ? `<table><thead><tr><th>Analista</th><th>Dias solo</th><th>Média/dia</th></tr></thead>
        <tbody>${Object.entries(soloPorAnalista).sort((a,b)=>b[1].tot/b[1].n-a[1].tot/a[1].n).map(([n,x]) =>
          `<tr><td>${esc(n)}</td><td>${x.n}</td><td><b>${Math.round(x.tot/x.n*10)/10}</b></td></tr>`).join('')}</tbody></table>`
        : '<div class="msg">Sem fins de semana com analista único no histórico.</div>'}
      </div>
      <div class="card">
        <h2>🎯 Meta de fim de semana</h2>
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:6px">Sugestão automática (média histórica de ${meta.amostras || 0} fins de semana solo) — usada só como referência:</p>
        <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
          <div class="kpi"><div class="v" style="color:var(--warn)">${meta.meta_minima ?? '—'}</div><div class="l">Sugestão mínima</div></div>
          <div class="kpi"><div class="v" style="color:var(--accent)">${meta.meta_esperada ?? '—'}</div><div class="l">Sugestão esperada</div></div>
          <div class="kpi"><div class="v" style="color:var(--ok)">${meta.meta_excelente ?? '—'}</div><div class="l">Sugestão excelente</div></div>
        </div>
        ${state.role === 'admin' ? `
        <h2 style="margin-top:14px">✏️ Meta oficial (definida por você — vale mais que a sugestão)</h2>
        <div class="filters">
          ${[['fds_minima','Mínima'],['fds_esperada','Esperada'],['fds_excelente','Excelente']].map(([k,l]) =>
            `<div><label>${l}</label><input id="meta_${k}" type="number" value="${cfgMap[k] ?? ''}" placeholder="${meta['meta_'+k.split('_')[1]] ?? ''}" style="min-width:100px"></div>`).join('')}
        </div>
        <h2 style="margin-top:14px">⚙️ Outras metas configuráveis</h2>
        <div class="filters">
          ${['diaria','semanal','mensal'].map(k => `<div><label>Meta ${k}</label><input id="meta_${k}" type="number" value="${cfgMap[k] ?? ''}" style="min-width:100px"></div>`).join('')}
          <button id="btnSalvarMetas">Salvar todas</button>
        </div>` : ''}
      </div>
    </div>
    <div class="card">
      <h2 style="margin:0">🏆 Ranking de produtividade — ${mesLabel(state.dashMes)}${state.dashAnalista ? ' — ' + esc(state.dashAnalista) : ''}</h2>
      <p style="color:var(--muted);font-size:12px;margin:2px 0 8px">Usa o filtro "Mês do ranking" acima, independente do período dos gráficos.</p>
      <table><thead><tr><th>#</th><th>Analista</th><th>Total</th><th>Concluídos</th><th>Pendentes</th><th>% Concl.</th><th>Tempo médio (h)</th><th>Score</th><th>Classe</th></tr></thead>
      <tbody>${rk.map((r,i) => `<tr>
        <td>${['🥇','🥈','🥉'][i] ?? (i+1)}</td><td>${esc(nomeExib(r.nome, i+1))}</td><td>${r.total}</td>
        <td style="color:var(--ok)">${r.concluidas}</td><td style="color:var(--warn)">${r.pendentes}</td>
        <td>${r.pct_concl}%</td><td>${r.tempo_medio_h ?? '—'}</td>
        <td><b>${r.score ?? '—'}</b></td>
        <td><span class="tag ${r.classe==='Alta'?'CONCLUIDO':r.classe==='Média'?'RECEBIDO':'PENDENTE'}">${esc(r.classe||'—')}</span></td>
      </tr>`).join('') || '<tr><td colspan="9">Sem dados neste mês.</td></tr>'}</tbody></table>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📝 Todas as atividades (todo o histórico)</h2>
        <div style="max-height:420px;overflow-y:auto">
        ${(ativs||[]).map(a => `<div class="hbar-row"><span class="hbar-lbl">${esc(a.nome)}</span>
          <div class="hbar"><div style="width:${Math.round(100*a.total/Math.max(...(ativs||[]).map(x=>x.total),1))}%"></div></div>
          <b>${a.total}</b></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h2>🏢 Todas as empreendedoras (todo o histórico)</h2>
        <div style="max-height:420px;overflow-y:auto">
        <table><thead><tr><th>Empreendedora</th><th>Total</th><th>Pendentes</th></tr></thead>
        <tbody>${(tops||[]).map(t => `<tr><td>${esc(t.nome)}</td><td>${t.total}</td><td>${t.pendentes}</td></tr>`).join('')}</tbody></table>
        </div>
      </div>
    </div>`);
  document.getElementById('dashMes').onchange = (e) => { state.dashMes = e.target.value; renderDashboard(); };
  document.getElementById('dashAnalista').onchange = (e) => { state.dashAnalista = e.target.value; renderDashboard(); };
  document.getElementById('volDe').onchange = (e) => { state.volDe = e.target.value; renderDashboard(); };
  document.getElementById('volAte').onchange = (e) => { state.volAte = e.target.value; renderDashboard(); };
  document.getElementById('diaDe').onchange = (e) => { state.diaDe = e.target.value; renderDashboard(); };
  document.getElementById('diaAte').onchange = (e) => { state.diaAte = e.target.value; renderDashboard(); };
  const bTL = document.getElementById('btnToggleLanc');
  if (bTL) bTL.onclick = () => { state.excluirLancamentos = !state.excluirLancamentos; renderDashboard(); };
  const bML = document.getElementById('btnMarcarLanc');
  if (bML) bML.onclick = () => openMarcarLancamento(eventos || []);
  document.querySelectorAll('.preset-btn').forEach(b => b.onclick = () => {
    const t = b.dataset.target;
    if (t.startsWith('vol')) { const n = Number(t.slice(3)); state.volAte = thisYm; state.volDe = ymAdd(thisYm, -(n-1)); }
    else { const n = Number(t.slice(3)); state.diaAte = todayStr; state.diaDe = dAdd(todayStr, -(n-1)); }
    renderDashboard();
  });
  if (state.role === 'admin') {
    const btn = document.getElementById('btnSalvarMetas');
    if (btn) btn.onclick = async () => {
      for (const k of ['diaria','semanal','mensal','fds_minima','fds_esperada','fds_excelente']) {
        const el = document.getElementById('meta_' + k);
        if (el && el.value !== '') await sb.from('metas_config').upsert({ id: k, valor: Number(el.value), atualizado_em: new Date().toISOString() });
      }
      renderDashboard();
    };
  }
}

// ---------- DEMANDAS ----------
function buildQuery(sel, count) {
  let q = sb.from('demandas').select(sel, count ? { count: 'exact' } : {});
  const f = state.filtros;
  if (f.status) q = q.eq('status', f.status);
  if (f.analista) q = q.eq('analista_id', f.analista);
  if (f.busca) q = q.or(`proponente1_nome.ilike.%${f.busca}%,unidade.ilike.%${f.busca}%,numero_processo.ilike.%${f.busca}%`);
  if (f.mes) {
    const [y, m] = f.mes.split('-').map(Number);
    q = q.gte('recebido_em', new Date(y, m-1, 1).toISOString()).lt('recebido_em', new Date(y, m, 1).toISOString());
  }
  return q;
}
async function renderDemandas() {
  const { data: rows, count } = await buildQuery(
    'id,numero,recebido_em,proponente1_nome,unidade,status,analistas(nome),empreendedoras(nome),empreendimentos(nome),atividades(nome)', true
  ).order('recebido_em', { ascending: false }).range(state.page*PAGE, state.page*PAGE+PAGE-1);
  state.total = count || 0;
  const L = state.lookups, f = state.filtros;
  const pages = Math.max(1, Math.ceil(state.total / PAGE));
  shell(`
    <div class="card filters">
      <div><label>Busca (nome / unidade / processo)</label><input id="fBusca" value="${esc(f.busca)}"></div>
      <div><label>Status</label><select id="fStatus"><option value="">Todos</option>
        ${['RECEBIDO','EM_ANALISE','CONCLUIDO','PENDENTE'].map(s=>`<option ${f.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div><label>Analista</label><select id="fAnalista"><option value="">Todos</option>
        ${L.analistas.map(a=>`<option value="${a.id}" ${f.analista===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>
      <div><label>Mês</label><input id="fMes" type="month" value="${esc(f.mes)}"></div>
      <button id="btnFiltrar">Filtrar</button>
      <button id="btnLimpar" class="ghost">Limpar</button>
      <div class="spacer"></div>
      ${state.role !== 'leitura' ? '<button id="btnNova">+ Novo processo</button>' : ''}
    </div>
    <div class="card">
      <table><thead><tr><th>Nº</th><th>Recebido</th><th>Proponente</th><th>Empreendedora</th><th>Empreendimento</th><th>Unidade</th><th>Atividade</th><th>Analista</th><th>Status</th><th></th></tr></thead>
      <tbody>${(rows||[]).map(r => `<tr>
        <td>${r.numero ?? ''}</td><td>${fmtDt(r.recebido_em)}</td><td>${esc(r.proponente1_nome)}</td>
        <td>${esc(r.empreendedoras?.nome)}</td><td>${esc(r.empreendimentos?.nome)}</td>
        <td>${esc(r.unidade)}</td><td>${esc(r.atividades?.nome)}</td><td>${esc(r.analistas?.nome)}</td>
        <td><span class="tag ${esc(r.status)}">${esc(r.status)}</span></td>
        <td><button class="ghost btnEdit" data-id="${r.id}">Abrir</button></td></tr>`).join('')}
      </tbody></table>
      <div class="pag">
        <span>${state.total} registros · pág. ${state.page+1}/${pages}</span>
        <button class="ghost" id="pgPrev" ${state.page===0?'disabled':''}>◀</button>
        <button class="ghost" id="pgNext" ${state.page>=pages-1?'disabled':''}>▶</button>
      </div>
    </div>`);
  const bN = document.getElementById('btnNova');
  if (bN) bN.onclick = () => openForm(null);
  btnFiltrar.onclick = () => { state.filtros = { busca:fBusca.value.trim(), status:fStatus.value, analista:fAnalista.value, mes:fMes.value }; state.page=0; renderDemandas(); };
  btnLimpar.onclick = () => { state.filtros = { status:'',analista:'',busca:'',mes:'' }; state.page=0; renderDemandas(); };
  pgPrev.onclick = () => { state.page--; renderDemandas(); };
  pgNext.onclick = () => { state.page++; renderDemandas(); };
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
}

// ---------- FORM DEMANDA + FUP + CHECKLIST ----------
async function openForm(id) {
  let d = { status: 'RECEBIDO', recebido_em: new Date().toISOString() };
  let fups = [], checks = [];
  if (id) {
    const [dd, ff, cc] = await Promise.all([
      sb.from('demandas').select('*').eq('id', id).single(),
      sb.from('fups').select('*').eq('demanda_id', id).order('criado_em', { ascending: false }),
      sb.from('validacao_itens').select('*').eq('demanda_id', id),
    ]);
    d = dd.data; fups = ff.data||[]; checks = cc.data||[];
  }
  const L = state.lookups;
  const dtLocal = (v) => v ? new Date(new Date(v).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : '';
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal">
    <h2>${id ? 'Demanda Nº ' + (d.numero ?? '') : 'Nova demanda'}</h2>
    <div class="grid2">
      <div><label>Recebido em</label><input id="mReceb" type="datetime-local" value="${dtLocal(d.recebido_em)}"></div>
      <div><label>Nº processo / canal</label><input id="mProc" value="${esc(d.numero_processo)}"></div>
      <div><label>Proponente 1</label><input id="mP1" value="${esc(d.proponente1_nome)}"></div>
      <div><label>CPF 1</label><input id="mC1" value="${esc(d.proponente1_cpf)}"></div>
      <div><label>Proponente 2</label><input id="mP2" value="${esc(d.proponente2_nome)}"></div>
      <div><label>CPF 2</label><input id="mC2" value="${esc(d.proponente2_cpf)}"></div>
      <div><label>Empreendedora</label><select id="mEmpdora"><option value=""></option>
        ${L.empreendedoras.map(e=>`<option value="${e.id}" ${d.empreendedora_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select></div>
      <div><label>Empreendimento</label><select id="mEmp"><option value=""></option>
        ${L.empreendimentos.map(e=>`<option value="${e.id}" data-ed="${e.empreendedora_id||''}" ${d.empreendimento_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select></div>
      <div><label>Unidade</label><input id="mUnid" value="${esc(d.unidade)}"></div>
      <div><label>Atividade</label><select id="mAtiv"><option value=""></option>
        ${L.atividades.filter(a=>a.ativa).map(a=>`<option value="${a.id}" ${d.atividade_id===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>
      <div><label>Analista</label><select id="mAnal"><option value=""></option>
        ${L.analistas.map(a=>`<option value="${a.id}" ${d.analista_id===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>
      <div><label>Status</label><select id="mStatus">
        ${['RECEBIDO','EM_ANALISE','CONCLUIDO','PENDENTE'].map(s=>`<option ${d.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div><label>Concluído em</label><input id="mConcl" type="datetime-local" value="${dtLocal(d.concluido_em)}"></div>
      <div><label>Obs</label><input id="mObs" value="${esc(d.obs)}"></div>
    </div>
    ${id ? `
    <h2 style="margin-top:16px">✅ Checklist de validação</h2>
    <div id="mChecks">${checks.map(c => `
      <div class="chk"><input type="checkbox" data-cid="${c.id}" ${c.ok?'checked':''}> <span>${esc(c.item)}</span>
      <button class="ghost del-chk" data-cid="${c.id}">✕</button></div>`).join('') || '<div class="msg">Nenhum item ainda.</div>'}</div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <input id="mNewChk" placeholder="Novo item do checklist" style="flex:1">
      <button id="mAddChk" class="ghost">Adicionar</button>
    </div>
    <h2 style="margin-top:16px">💬 Follow-ups</h2>
    <div id="mFups">${fups.map(f => `<div class="fup"><b>${esc(f.autor||'')}</b> <span style="color:var(--muted)">${fmtDt(f.criado_em)}</span><br>${esc(f.texto)}</div>`).join('') || '<div class="msg">Nenhum follow-up ainda.</div>'}</div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <input id="mNewFup" placeholder="Registrar follow-up..." style="flex:1">
      <button id="mAddFup" class="ghost">Registrar</button>
    </div>` : ''}
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:end">
      <button id="mCancel" class="ghost">Cancelar</button>
      <button id="mSave">Salvar</button>
    </div>
    <div class="msg" id="mMsg"></div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('mEmpdora').onchange = () => {
    const ed = $('mEmpdora').value;
    [...$('mEmp').options].forEach(o => o.hidden = !!o.value && !!ed && o.dataset.ed !== ed);
  };
  $('mCancel').onclick = () => div.remove();
  if (id) {
    div.querySelectorAll('#mChecks input[type=checkbox]').forEach(c => c.onchange = async () => {
      await sb.from('validacao_itens').update({ ok: c.checked }).eq('id', c.dataset.cid);
    });
    div.querySelectorAll('.del-chk').forEach(b => b.onclick = async () => {
      await sb.from('validacao_itens').delete().eq('id', b.dataset.cid);
      div.remove(); openForm(id);
    });
    $('mAddChk').onclick = async () => {
      if (!$('mNewChk').value.trim()) return;
      await sb.from('validacao_itens').insert({ demanda_id: id, item: $('mNewChk').value.trim() });
      div.remove(); openForm(id);
    };
    $('mAddFup').onclick = async () => {
      if (!$('mNewFup').value.trim()) return;
      await sb.from('fups').insert({ demanda_id: id, texto: $('mNewFup').value.trim(), autor: state.session?.user?.email });
      div.remove(); openForm(id);
    };
  }
  $('mSave').onclick = async () => {
    const rec = {
      recebido_em: $('mReceb').value ? new Date($('mReceb').value).toISOString() : null,
      numero_processo: $('mProc').value || null,
      proponente1_nome: $('mP1').value || null, proponente1_cpf: $('mC1').value || null,
      proponente2_nome: $('mP2').value || null, proponente2_cpf: $('mC2').value || null,
      empreendedora_id: $('mEmpdora').value || null, empreendimento_id: $('mEmp').value || null,
      unidade: $('mUnid').value || null, atividade_id: $('mAtiv').value || null,
      analista_id: $('mAnal').value || null, status: $('mStatus').value,
      concluido_em: $('mConcl').value ? new Date($('mConcl').value).toISOString() : ($('mStatus').value === 'CONCLUIDO' ? new Date().toISOString() : null),
      obs: $('mObs').value || null,
    };
    if (!rec.recebido_em) { $('mMsg').textContent = 'Informe a data de recebimento.'; return; }
    const r = id ? await sb.from('demandas').update(rec).eq('id', id) : await sb.from('demandas').insert(rec);
    if (r.error) { $('mMsg').textContent = r.error.message; return; }
    div.remove(); render();
  };
}

// ---------- ESCALA ----------
async function renderEscala() {
  const [y, m] = state.escalaMes.split('-').map(Number);
  const ndays = new Date(y, m, 0).getDate();
  const ini = `${state.escalaMes}-01`, fim = `${state.escalaMes}-${String(ndays).padStart(2,'0')}`;
  const { data: esc_ } = await sb.from('escala_plantao').select('id,analista_id,data').gte('data', ini).lte('data', fim);
  const byKey = {}; (esc_||[]).forEach(e => byKey[e.analista_id + '|' + e.data] = e.id);
  const dows = ['D','S','T','Q','Q','S','S'];
  const ans = state.lookups.analistas.filter(a => a.status !== 'Inativo');
  shell(`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <h2 style="margin:0">📅 Escala de plantão</h2>
        <input type="month" id="escMes" value="${state.escalaMes}">
        <span style="color:var(--muted);font-size:12px">Clique numa célula para marcar/desmarcar o plantão</span>
      </div>
      <div style="overflow-x:auto">
      <table class="escala"><thead><tr><th>Analista</th>
        ${Array.from({length:ndays},(_,i)=>{const dw=new Date(y,m-1,i+1).getDay();return `<th class="${dw===0||dw===6?'wend':''}">${i+1}<br><span style="font-weight:400">${dows[dw]}</span></th>`}).join('')}
        <th>Total</th></tr></thead>
      <tbody>${ans.map(a => {
        let tot = 0;
        const cells = Array.from({length:ndays},(_,i)=>{
          const dt = `${state.escalaMes}-${String(i+1).padStart(2,'0')}`;
          const on = byKey[a.id+'|'+dt]; if (on) tot++;
          const dw = new Date(y,m-1,i+1).getDay();
          return `<td class="esc-cell ${on?'on':''} ${dw===0||dw===6?'wend':''}" data-a="${a.id}" data-d="${dt}">${on?'✕':''}</td>`;
        }).join('');
        return `<tr><td>${esc(a.nome)}</td>${cells}<td><b>${tot}</b></td></tr>`;
      }).join('')}
      <tr><td style="color:var(--muted)">Cobertura</td>${Array.from({length:ndays},(_,i)=>{
        const dt = `${state.escalaMes}-${String(i+1).padStart(2,'0')}`;
        const n = ans.filter(a=>byKey[a.id+'|'+dt]).length;
        return `<td style="color:${n===0?'var(--err)':'var(--muted)'}">${n}</td>`;
      }).join('')}<td></td></tr>
      </tbody></table></div>
    </div>`);
  escMes.onchange = (e) => { state.escalaMes = e.target.value; renderEscala(); };
  document.querySelectorAll('.esc-cell').forEach(c => c.onclick = async () => {
    const key = c.dataset.a + '|' + c.dataset.d;
    if (byKey[key]) await sb.from('escala_plantao').delete().eq('id', byKey[key]);
    else await sb.from('escala_plantao').insert({ analista_id: c.dataset.a, data: c.dataset.d });
    renderEscala();
  });
}

// ---------- INSIGHTS ----------
async function renderInsights() {
  const [{ data: al }, { data: sla }] = await Promise.all([
    sb.from('alerta_hoje').select('*'),
    sb.from('insights_sla').select('*'),
  ]);
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
  const disparar = (al||[]).filter(a => a.disparar_alerta);
  const estourados = (sla||[]).filter(s => s.horas_aberto > 24);
  shell(`
    <div class="kpis">
      <div class="kpi"><div class="v" style="color:${disparar.length?'var(--err)':'var(--ok)'}">${disparar.length}</div><div class="l">🚨 Plantão sem atividade</div></div>
      <div class="kpi"><div class="v" style="color:${(sla||[]).length?'var(--warn)':'var(--ok)'}">${(sla||[]).length}</div><div class="l">📥 Processos em aberto</div></div>
      <div class="kpi"><div class="v" style="color:${estourados.length?'var(--err)':'var(--ok)'}">${estourados.length}</div><div class="l">⏰ SLA acima de 24h</div></div>
    </div>
    <div class="card">
      <h2>🚨 Plantão de hoje — ${esc(hoje)}</h2>
      ${disparar.length ? `<div class="alert-box">⚠️ <b>${disparar.length} analista(s) escalado(s) sem atividade registrada:</b> ${disparar.map(a=>esc(a.nome)).join(', ')} — verifique às 12h e 17h.</div>` : `<div class="ok-box">✅ Todos os escalados de hoje já registraram atividade (ou não há escalados).</div>`}
      ${(al||[]).length ? `<table style="margin-top:12px"><thead><tr><th>Analista</th><th>Atividades hoje</th><th>Situação</th></tr></thead>
      <tbody>${(al||[]).map(a => `<tr><td>${esc(a.nome)}</td><td>${a.atividades_hoje}</td>
        <td><span class="tag ${a.situacao==='PREENCHEU'?'CONCLUIDO':'PENDENTE'}">${esc(a.situacao)}</span></td></tr>`).join('')}</tbody></table>` : ''}
    </div>
    <div class="card">
      <h2>⏰ Processos em aberto (mais antigos primeiro)</h2>
      ${(sla||[]).length ? `<table><thead><tr><th>Nº</th><th>Proponente</th><th>Empreendedora</th><th>Analista</th><th>Recebido</th><th>Horas em aberto</th></tr></thead>
      <tbody>${(sla||[]).slice(0,15).map(s => `<tr>
        <td>${s.numero ?? ''}</td><td>${esc(s.proponente1_nome)}</td><td>${esc(s.empreendedora)}</td><td>${esc(s.analista)}</td>
        <td>${fmtDt(s.recebido_em)}</td>
        <td style="color:${s.horas_aberto>24?'var(--err)':'var(--warn)'};font-weight:700">${s.horas_aberto}h</td></tr>`).join('')}</tbody></table>` : '<div class="ok-box">✅ Nenhum processo em aberto. Backlog zerado!</div>'}
    </div>`);
}

// ---------- ANALYTICS ----------
async function renderAnalytics() {
  if (!state.anaAnalista) state.anaAnalista = '';
  const [{ data: evo }, { data: tempoAtiv }, { data: mix }, { data: empMes }] = await Promise.all([
    sb.from('evolucao_analista_mes').select('*'),
    sb.from('tempo_por_atividade').select('*'),
    sb.from('mix_atividade_analista').select('*'),
    sb.from('empreendedora_mes').select('*'),
  ]);
  const mesesEvo = [...new Set((evo||[]).map(e => e.mes.slice(0,7)))].sort();
  const ult6 = mesesEvo.slice(-6);
  const analistas = [...new Set((evo||[]).map(e => e.analista))].sort();
  const evoMap = {}; (evo||[]).forEach(e => evoMap[e.analista + '|' + e.mes.slice(0,7)] = e.total);

  // gargalos: atividades mais lentas
  const lentas = [...(tempoAtiv||[])].sort((a,b) => b.horas_medias - a.horas_medias).slice(0,12);
  const maxH = Math.max(...lentas.map(a=>a.horas_medias), 1);

  // concentração de clientes no último mês com dado
  const ultMesEmp = [...new Set((empMes||[]).map(e=>e.mes.slice(0,7)))].sort().pop();
  const empUlt = (empMes||[]).filter(e => e.mes.slice(0,7) === ultMesEmp).sort((a,b)=>b.total-a.total);
  const totalEmpUlt = empUlt.reduce((s,e)=>s+e.total,0);
  const top5share = totalEmpUlt ? Math.round(100 * empUlt.slice(0,5).reduce((s,e)=>s+e.total,0) / totalEmpUlt) : 0;

  // mix do analista selecionado
  const mixSel = state.anaAnalista ? (mix||[]).filter(m => m.analista === state.anaAnalista).sort((a,b)=>b.total-a.total).slice(0,15) : [];
  const maxMix = Math.max(...mixSel.map(m=>m.total), 1);

  shell(`
    <div class="card">
      <h2>📈 Evolução por analista (últimos 6 meses)</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Mostra quem está crescendo ou caindo mês a mês — útil para conversas de performance.</p>
      <table><thead><tr><th>Analista</th>${ult6.map(m=>`<th>${mesLabel(m)}</th>`).join('')}<th>Tendência</th></tr></thead>
      <tbody>${analistas.map(a => {
        const vals = ult6.map(m => evoMap[a+'|'+m] || 0);
        const metadeA = vals.slice(0, 3).reduce((s,v)=>s+v,0), metadeB = vals.slice(3).reduce((s,v)=>s+v,0);
        const dir = metadeB > metadeA * 1.1 ? '<span style="color:var(--ok)">▲ subindo</span>'
                  : metadeB < metadeA * 0.9 ? '<span style="color:var(--err)">▼ caindo</span>'
                  : '<span style="color:var(--muted)">— estável</span>';
        return `<tr><td><b>${esc(nomeExib(a, 1))}</b></td>${vals.map(v=>`<td>${v||'—'}</td>`).join('')}<td>${dir}</td></tr>`;
      }).join('')}</tbody></table>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>🐢 Gargalos — atividades que mais demoram</h2>
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Tempo médio entre receber e concluir. Só atividades com 5+ casos. Onde atacar para ganhar velocidade.</p>
        ${lentas.map(a => `<div class="hbar-row"><span class="hbar-lbl">${esc(a.atividade)}</span>
          <div class="hbar"><div style="width:${Math.round(100*a.horas_medias/maxH)}%"></div></div>
          <b>${a.horas_medias}h</b><span style="color:var(--muted);font-size:11px">(${a.total}x)</span></div>`).join('')
          || '<p style="color:var(--muted);font-size:12.5px">Sem dados suficientes.</p>'}
      </div>
      <div class="card">
        <h2>🎯 Concentração de clientes — ${ultMesEmp ? mesLabel(ultMesEmp) : '—'}</h2>
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">O quanto o volume depende de poucas empreendedoras (risco de concentração).</p>
        <div class="kpis" style="grid-template-columns:1fr 1fr;margin-bottom:10px">
          <div class="kpi"><div class="v" style="color:${top5share>70?'var(--warn)':'var(--accent)'}">${top5share}%</div><div class="l">Top 5 clientes</div></div>
          <div class="kpi"><div class="v">${empUlt.length}</div><div class="l">Clientes ativos no mês</div></div>
        </div>
        <table><thead><tr><th>Empreendedora</th><th>Volume</th><th>% do mês</th></tr></thead>
        <tbody>${empUlt.slice(0,10).map(e => `<tr><td>${esc(e.nome ?? e.empreendedora)}</td><td>${e.total}</td>
          <td>${totalEmpUlt ? Math.round(100*e.total/totalEmpUlt) : 0}%</td></tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">
        <h2 style="margin:0">🧩 Perfil de trabalho do analista</h2>
        <select id="anaAnalista"><option value="">Escolha um analista...</option>
          ${analistas.map(n=>`<option value="${esc(n)}" ${state.anaAnalista===n?'selected':''}>${esc(n)}</option>`).join('')}</select>
      </div>
      ${state.anaAnalista ? `
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Quais atividades ${esc(state.anaAnalista)} mais executa — mostra especialização ou sobrecarga em um tipo só.</p>
        ${mixSel.map(m => `<div class="hbar-row"><span class="hbar-lbl">${esc(m.atividade)}</span>
          <div class="hbar"><div style="width:${Math.round(100*m.total/maxMix)}%"></div></div><b>${m.total}</b></div>`).join('')}`
      : '<p style="color:var(--muted);font-size:12.5px">Selecione um analista acima para ver o perfil de atividades dele.</p>'}
    </div>`);
  document.getElementById('anaAnalista').onchange = (e) => { state.anaAnalista = e.target.value; renderAnalytics(); };
}

// ---------- OPERAÇÕES (fila do dia) ----------
async function renderOperacoes() {
  const hoje0 = new Date(); hoje0.setHours(0,0,0,0);
  const [{ data: doDia }, { data: pend }] = await Promise.all([
    sb.from('demandas').select('id,numero,recebido_em,proponente1_nome,status,unidade,analistas(nome),atividades(nome)').gte('recebido_em', hoje0.toISOString()).order('recebido_em', { ascending: false }),
    sb.from('demandas').select('id,numero,recebido_em,proponente1_nome,status,unidade,analistas(nome),atividades(nome)').neq('status','CONCLUIDO').order('recebido_em').limit(50),
  ]);
  const bloco = (titulo, rows, vazio) => `
    <div class="card">
      <h2>${titulo}</h2>
      ${rows.length ? `<table><thead><tr><th>Nº</th><th>Recebido</th><th>Proponente</th><th>Unidade</th><th>Atividade</th><th>Analista</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td>${r.numero ?? ''}</td><td>${fmtDt(r.recebido_em)}</td><td>${esc(r.proponente1_nome)}</td>
        <td>${esc(r.unidade)}</td><td>${esc(r.atividades?.nome)}</td><td>${esc(r.analistas?.nome)}</td>
        <td><span class="tag ${esc(r.status)}">${esc(r.status)}</span></td>
        <td><button class="ghost btnEdit" data-id="${r.id}">Abrir</button></td></tr>`).join('')}</tbody></table>` : `<div class="ok-box">${vazio}</div>`}
    </div>`;
  shell(`
    ${bloco('🗂️ Fila de pendências (todas em aberto)', pend||[], '✅ Nenhuma pendência! Fila limpa.')}
    ${bloco('📥 Registradas hoje', doDia||[], 'Nenhum processo registrado hoje ainda.')}`);
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
}

// ---------- VALIDAÇÃO ----------
async function renderValidacao() {
  const { data: itens } = await sb.from('validacao_itens')
    .select('demanda_id, ok, demandas(id,numero,proponente1_nome,status,analistas(nome))');
  const porDemanda = {};
  (itens||[]).forEach(i => {
    const d = porDemanda[i.demanda_id] = porDemanda[i.demanda_id] || { d: i.demandas, tot: 0, ok: 0 };
    d.tot++; if (i.ok) d.ok++;
  });
  const lista = Object.values(porDemanda).sort((a,b) => (a.ok/a.tot) - (b.ok/b.tot));
  shell(`
    <div class="card">
      <h2>✅ Validação — checklists em andamento</h2>
      <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Cada processo pode ter um checklist (aberto pelo botão "Abrir" no Pipeline). Aqui você acompanha o avanço de todos.</p>
      ${lista.length ? `<table><thead><tr><th>Nº</th><th>Proponente</th><th>Analista</th><th>Status</th><th>Checklist</th><th>Progresso</th><th></th></tr></thead>
      <tbody>${lista.map(x => `<tr>
        <td>${x.d?.numero ?? ''}</td><td>${esc(x.d?.proponente1_nome)}</td><td>${esc(x.d?.analistas?.nome)}</td>
        <td><span class="tag ${esc(x.d?.status)}">${esc(x.d?.status)}</span></td>
        <td>${x.ok}/${x.tot}</td>
        <td><div class="hbar" style="width:120px"><div style="width:${Math.round(100*x.ok/x.tot)}%"></div></div></td>
        <td><button class="ghost btnEdit" data-id="${x.d?.id}">Abrir</button></td></tr>`).join('')}</tbody></table>`
      : '<div class="ok-box">Nenhum checklist criado ainda. Abra um processo no Pipeline e adicione itens de validação.</div>'}
    </div>`);
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
}

// ---------- FOLLOW-UP ----------
async function renderFollowup() {
  if (state.followupBusca === undefined) state.followupBusca = '';
  const { data: fupsAll } = await sb.from('fups')
    .select('id,criado_em,autor,texto,demanda_id,demandas(numero,proponente1_nome,status)')
    .order('criado_em', { ascending: false }).limit(300);
  const termo = state.followupBusca.trim().toLowerCase();
  const fups = !termo ? (fupsAll||[]).slice(0,60) : (fupsAll||[]).filter(f =>
    (f.texto||'').toLowerCase().includes(termo) ||
    (f.autor||'').toLowerCase().includes(termo) ||
    (f.demandas?.proponente1_nome||'').toLowerCase().includes(termo) ||
    String(f.demandas?.numero||'').includes(termo));
  shell(`
    <div class="card filters">
      <div style="flex:1"><label>Buscar (proponente, nº processo, autor ou texto)</label><input id="fupBusca" value="${esc(state.followupBusca)}" placeholder="Digite para buscar..."></div>
      <button id="btnFupBuscar">Buscar</button>
      ${state.followupBusca ? '<button id="btnFupLimpar" class="ghost">Limpar</button>' : ''}
    </div>
    <div class="card">
      <h2>💬 Follow-ups ${termo ? `— ${fups.length} resultado(s)` : 'recentes'}</h2>
      <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Registros feitos dentro de cada processo (Pipeline → Abrir → Follow-ups).</p>
      ${(fups||[]).length ? (fups||[]).map(f => `
        <div class="fup">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
            <b>Nº ${f.demandas?.numero ?? '?'}</b> · ${esc(f.demandas?.proponente1_nome)}
            <span class="tag ${esc(f.demandas?.status)}">${esc(f.demandas?.status)}</span>
            <span style="margin-left:auto;color:var(--muted);font-size:12px">${esc(f.autor||'')} · ${fmtDt(f.criado_em)}</span>
            <button class="ghost btnEdit" data-id="${f.demanda_id}" style="padding:2px 8px">Abrir</button>
          </div>
          ${esc(f.texto)}
        </div>`).join('') : `<div class="ok-box">${termo ? 'Nenhum follow-up encontrado para essa busca.' : 'Nenhum follow-up registrado ainda.'}</div>`}
    </div>`);
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
  btnFupBuscar.onclick = () => { state.followupBusca = fupBusca.value; renderFollowup(); };
  fupBusca.addEventListener('keydown', e => { if (e.key === 'Enter') btnFupBuscar.click(); });
  const bL = document.getElementById('btnFupLimpar');
  if (bL) bL.onclick = () => { state.followupBusca = ''; renderFollowup(); };
}

// ---------- CHAMADOS (Demandas internas) ----------
async function renderChamados() {
  const { data: rows } = await sb.from('chamados').select('*').order('criado_em', { ascending: false }).limit(100);
  shell(`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <h2 style="margin:0">📨 Demandas internas (chamados entre áreas)</h2>
        <button id="btnNovoCh">+ Nova demanda interna</button>
      </div>
      ${(rows||[]).length ? `<table><thead><tr><th>Aberto em</th><th>Título</th><th>Solicitante</th><th>Área</th><th>Prioridade</th><th>Status</th><th></th></tr></thead>
      <tbody>${(rows||[]).map(c => `<tr>
        <td>${fmtDt(c.criado_em)}</td><td>${esc(c.titulo)}</td><td>${esc(c.solicitante)}</td><td>${esc(c.area)}</td>
        <td><span class="tag ${c.prioridade==='CRITICA'||c.prioridade==='ALTA'?'PENDENTE':'RECEBIDO'}">${esc(c.prioridade)}</span></td>
        <td><span class="tag ${c.status==='RESOLVIDO'?'CONCLUIDO':c.status==='ABERTO'?'PENDENTE':'RECEBIDO'}">${esc(c.status)}</span></td>
        <td>${c.status!=='RESOLVIDO' ? `<button class="ghost btnResolver" data-id="${c.id}">Resolver</button>` : ''}</td></tr>`).join('')}</tbody></table>`
      : '<div class="ok-box">Nenhuma demanda interna aberta.</div>'}
    </div>`);
  btnNovoCh.onclick = async () => {
    const titulo = prompt('Título da demanda interna:');
    if (!titulo || !titulo.trim()) return;
    const area = prompt('Área/setor relacionado (ex.: Financeiro, Jurídico, Comercial):') || '';
    const prioridade = (prompt('Prioridade (BAIXA, NORMAL, ALTA, CRITICA):', 'NORMAL') || 'NORMAL').toUpperCase();
    await sb.from('chamados').insert({ titulo: titulo.trim(), area: area.trim(), prioridade, solicitante: state.session?.user?.email });
    renderChamados();
  };
  document.querySelectorAll('.btnResolver').forEach(b => b.onclick = async () => {
    await sb.from('chamados').update({ status: 'RESOLVIDO', resolvido_em: new Date().toISOString() }).eq('id', b.dataset.id);
    renderChamados();
  });
}

async function openMarcarLancamento(eventos) {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:480px">
    <h2>🚀 Dias de lançamento</h2>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:12px">Marque os dias de lançamento para que o volume atípico não distorça médias, metas e a capacidade real da equipe.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <input id="mlData" type="date" style="flex:1;min-width:140px">
      <input id="mlDesc" placeholder="Empreendimento / descrição" style="flex:2;min-width:160px">
      <button id="mlAdd" class="ghost">+ Marcar</button>
    </div>
    <div id="mlLista">${eventos.sort((a,b)=>b.data.localeCompare(a.data)).map(e=>`
      <div class="cad-item">${new Date(e.data+'T12:00').toLocaleDateString('pt-BR')} — ${esc(e.descricao||'Lançamento')}
        <button class="ghost ml-del" data-id="${e.id}">✕</button></div>`).join('')
      || '<p style="color:var(--muted);font-size:12.5px">Nenhum dia marcado ainda.</p>'}</div>
    <div class="msg" id="mlMsg"></div>
    <div style="display:flex;justify-content:end;margin-top:14px"><button id="mlFechar" class="ghost">Fechar</button></div>
  </div>`;
  document.body.appendChild(div);
  div.querySelector('#mlFechar').onclick = () => { div.remove(); renderDashboard(); };
  div.querySelector('#mlAdd').onclick = async () => {
    const data = div.querySelector('#mlData').value;
    if (!data) { div.querySelector('#mlMsg').textContent = 'Escolha a data.'; return; }
    const { error } = await sb.from('eventos_especiais').insert({
      data, tipo: 'lancamento', descricao: div.querySelector('#mlDesc').value || null,
      criado_por: state.session?.user?.id });
    if (error) { div.querySelector('#mlMsg').textContent = error.message; return; }
    div.remove(); renderDashboard();
  };
  div.querySelectorAll('.ml-del').forEach(b => b.onclick = async () => {
    await sb.from('eventos_especiais').delete().eq('id', b.dataset.id);
    div.remove(); renderDashboard();
  });
}

// ---------- PRODUTOS EM IMPLANTAÇÃO — LANÇAMENTOS ----------
// Replica o Painel_Implantacao_CRM: KPIs da carteira, criticidade por prazo de lançamento,
// checklist de implantação e pendências por empreendimento.
async function renderImplantacao() {
  const { data: itens } = await sb.from('implantacao_painel').select('*').order('previsao_lancamento');
  const lista = itens || [];
  const total = lista.length;
  const emImpl = lista.filter(i => i.status_auto === 'Em andamento').length;
  const concl = lista.filter(i => i.status_auto === 'Concluído').length;
  const naoIni = lista.filter(i => i.status_auto === 'Não iniciado').length;
  const criticos = lista.filter(i => i.criticidade === '🔴 Risco crítico').length;
  const avancoMedio = total ? Math.round(lista.reduce((s,i)=>s+Number(i.avanco_pct||0),0)/total) : 0;
  const pendAbertas = lista.reduce((s,i)=>s+Number(i.pendencias_abertas||0),0);
  const unidades = lista.reduce((s,i)=>s+Number(i.unidades||0),0);
  const vencidos = lista.filter(i => i.dias_para_lancamento !== null && i.dias_para_lancamento < 0 && i.status_auto !== 'Concluído').length;
  const ate30 = lista.filter(i => i.dias_para_lancamento !== null && i.dias_para_lancamento >= 0 && i.dias_para_lancamento <= 30).length;
  const emRisco = total ? Math.round(100*lista.filter(i=>['🔴 Risco crítico','🟠 Risco de atraso'].includes(i.criticidade)).length/total) : 0;
  const foco = lista.filter(i => i.status_auto !== 'Concluído' && i.dias_para_lancamento !== null)
    .sort((a,b)=>a.dias_para_lancamento-b.dias_para_lancamento).slice(0,5);

  shell(`
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">🚀 Produtos em Implantação — Lançamentos</h2>
        <span style="color:var(--muted);font-size:12.5px">Carteira de implantação: avanço, pendências e prazo de lançamento.</span>
        <div class="spacer"></div>
        ${state.role !== 'leitura' ? '<button id="btnNovaImpl">+ Novo produto</button>' : ''}
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v">${total}</div><div class="l">🏗️ Total de produtos</div></div>
      <div class="kpi"><div class="v" style="color:var(--accent)">${emImpl}</div><div class="l">⚙️ Em implantação</div></div>
      <div class="kpi"><div class="v" style="color:var(--ok)">${concl}</div><div class="l">✅ Concluídos</div></div>
      <div class="kpi"><div class="v" style="color:var(--muted)">${naoIni}</div><div class="l">⏸️ Não iniciados</div></div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v" style="color:${criticos?'var(--err)':'var(--ok)'}">${criticos}</div><div class="l">🔴 Em risco crítico</div></div>
      <div class="kpi"><div class="v">${avancoMedio}%</div><div class="l">📊 Avanço médio</div></div>
      <div class="kpi"><div class="v" style="color:var(--warn)">${pendAbertas}</div><div class="l">⚠️ Pendências abertas</div></div>
      <div class="kpi"><div class="v">${unidades.toLocaleString('pt-BR')}</div><div class="l">🏠 Total de unidades</div></div>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📊 Inteligência da carteira</h2>
        <table><tbody>
          <tr><td>Lançamentos vencidos</td><td style="text-align:right"><b style="color:${vencidos?'var(--err)':'var(--ok)'}">${vencidos}</b></td></tr>
          <tr><td>Lançamentos em ≤ 30 dias</td><td style="text-align:right"><b style="color:${ate30?'var(--warn)':'var(--muted)'}">${ate30}</b></td></tr>
          <tr><td>Carteira em risco</td><td style="text-align:right"><b style="color:${emRisco>50?'var(--err)':emRisco>25?'var(--warn)':'var(--ok)'}">${emRisco}%</b></td></tr>
          <tr><td>Pendências abertas</td><td style="text-align:right"><b>${pendAbertas}</b></td></tr>
        </tbody></table>
        <p style="color:var(--muted);font-size:11.5px;margin-top:8px">Criticidade por semanas até o lançamento: 🟢 no prazo &gt;8 · 🟡 atenção 6–8 · 🟠 risco de atraso 4–6 · 🔴 crítico &lt;4</p>
      </div>
      <div class="card">
        <h2>🎯 Foco imediato</h2>
        ${foco.map(i => `<div class="hbar-row">
          <span class="hbar-lbl" style="min-width:150px">${esc(i.empreendimento)}</span>
          <div class="hbar"><div style="width:${i.avanco_pct}%"></div></div>
          <b>${i.avanco_pct}%</b>
          <span style="font-size:11px;color:${i.dias_para_lancamento<0?'var(--err)':'var(--muted)'}">${i.dias_para_lancamento<0?Math.abs(i.dias_para_lancamento)+'d atrasado':i.dias_para_lancamento+'d'}</span>
        </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nada em risco imediato.</p>'}
      </div>
    </div>
    <div class="card">
      <h2>Carteira de implantação</h2>
      <div style="overflow-x:auto">
      <table style="min-width:1000px"><thead><tr>
        <th>Empreendedora</th><th>Empreendimento</th><th>Tipo</th><th>Sistemas</th><th>Fase</th>
        <th>Avanço</th><th>Status</th><th>Pend.</th><th>Unid.</th><th>Lançamento</th><th>Criticidade</th><th></th>
      </tr></thead>
      <tbody>${lista.map(i => `<tr>
        <td>${esc(i.empreendedora)}</td>
        <td><b>${esc(i.empreendimento)}</b></td>
        <td>${esc(i.tipo||'—')}</td>
        <td style="font-size:11.5px;color:var(--muted)">${esc(i.sistemas||'—')}</td>
        <td>${esc(i.fase||'—')}</td>
        <td><div class="hbar" style="min-width:70px"><div style="width:${i.avanco_pct}%"></div></div><span style="font-size:11px">${i.avanco_pct}%</span></td>
        <td><span class="tag ${i.status_auto==='Concluído'?'CONCLUIDO':i.status_auto==='Em andamento'?'RECEBIDO':'PENDENTE'}">${esc(i.status_auto)}</span></td>
        <td style="text-align:center;color:${i.pendencias_abertas>0?'var(--warn)':'var(--muted)'}">${i.pendencias_abertas}</td>
        <td style="text-align:right">${i.unidades}</td>
        <td>${i.previsao_lancamento ? new Date(i.previsao_lancamento+'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
        <td style="white-space:nowrap;font-size:12px">${esc(i.criticidade)}</td>
        <td><button class="ghost btn-impl" data-id="${i.id}">Abrir</button></td>
      </tr>`).join('')}</tbody></table>
      </div>
    </div>`);
  document.querySelectorAll('.btn-impl').forEach(b => b.onclick = () => openImplantacao(b.dataset.id));
  const bN = document.getElementById('btnNovaImpl');
  if (bN) bN.onclick = () => openImplantacao(null);
}

async function openImplantacao(id) {
  let it = null, checklist = [], pendencias = [];
  if (id) {
    const [ii, cc, pp] = await Promise.all([
      sb.from('implantacao_painel').select('*').eq('id', id).single(),
      sb.from('implantacao_checklist').select('*').eq('implantacao_id', id).order('ordem'),
      sb.from('implantacao_pendencias').select('*').eq('implantacao_id', id).order('criado_em'),
    ]);
    it = ii.data; checklist = cc.data || []; pendencias = pp.data || [];
  }
  const ro = state.role === 'leitura';
  const grupos = [...new Set(checklist.map(c => c.grupo))];
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:720px">
    <h2>${id ? '🚀 ' + esc(it.empreendimento) : '🚀 Novo produto em implantação'}</h2>
    ${id ? `<div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
      <div class="kpi"><div class="v" style="font-size:20px">${it.avanco_pct}%</div><div class="l">Avanço</div></div>
      <div class="kpi"><div class="v" style="font-size:20px;color:${it.pendencias_abertas?'var(--warn)':'var(--ok)'}">${it.pendencias_abertas}</div><div class="l">Pendências</div></div>
      <div class="kpi"><div class="v" style="font-size:20px">${it.unidades}</div><div class="l">Unidades</div></div>
      <div class="kpi"><div class="v" style="font-size:13px">${esc(it.criticidade)}</div><div class="l">${it.dias_para_lancamento!==null?(it.dias_para_lancamento<0?Math.abs(it.dias_para_lancamento)+' dias atrasado':it.dias_para_lancamento+' dias'):'—'}</div></div>
    </div>` : ''}
    <div class="grid2">
      <div><label>Empreendedora</label><input id="imEmpreendedora" value="${esc(it?.empreendedora)}" ${ro?'disabled':''}></div>
      <div><label>Empreendimento</label><input id="imEmpreendimento" value="${esc(it?.empreendimento)}" ${ro?'disabled':''}></div>
      <div><label>Tipo</label><select id="imTipo" ${ro?'disabled':''}>
        ${['Loteamento','Incorporação','Loteamento e Casas'].map(t=>`<option ${it?.tipo===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div><label>Fase</label><select id="imFase" ${ro?'disabled':''}>
        ${['Documentação','Parametrização','Operação'].map(f=>`<option ${it?.fase===f?'selected':''}>${f}</option>`).join('')}</select></div>
      <div style="grid-column:1/-1"><label>Sistemas</label><input id="imSistemas" value="${esc(it?.sistemas)}" placeholder="CRM: Anapro · ERP: Sienge" ${ro?'disabled':''}></div>
      <div style="grid-column:1/-1"><label>Link do sistema</label><input id="imLink" value="${esc(it?.link_sistema)}" ${ro?'disabled':''}></div>
      <div><label>Unidades</label><input id="imUnidades" type="number" value="${it?.unidades ?? 0}" ${ro?'disabled':''}></div>
      <div><label>Previsão de lançamento</label><input id="imPrev" type="date" value="${it?.previsao_lancamento ?? ''}" ${ro?'disabled':''}></div>
      <div style="grid-column:1/-1"><label>Observações</label><textarea id="imObs" rows="4" ${ro?'disabled':''}>${esc(it?.observacoes)}</textarea></div>
    </div>
    ${id ? `
    <h2 style="margin-top:18px">📋 Checklist de implantação</h2>
    ${grupos.map(g => `
      <div style="margin-bottom:10px">
        <div style="font-size:12px;color:var(--muted);font-weight:600;margin:8px 0 4px">${esc(g)}</div>
        ${checklist.filter(c=>c.grupo===g).map(c => `
          <label class="cad-item" style="display:flex;align-items:flex-start;gap:8px;cursor:${ro?'default':'pointer'}">
            <input type="checkbox" class="ck-item" data-id="${c.id}" ${c.concluido?'checked':''} ${ro?'disabled':''} style="margin-top:3px">
            <span style="flex:1;font-size:12.5px">${esc(c.item)}${c.formato?` <span style="color:var(--muted2);font-size:11px">(${esc(c.formato)})</span>`:''}</span>
          </label>`).join('')}
      </div>`).join('')}
    <h2 style="margin-top:14px">⚠️ Pendências / alertas</h2>
    <table><thead><tr><th>Pendência</th><th>Área</th><th>Status</th><th></th></tr></thead>
    <tbody>${pendencias.map(p=>`<tr>
      <td>${esc(p.pendencia)}</td><td>${esc(p.area||'—')}</td>
      <td><span class="tag ${p.resolvida?'CONCLUIDO':'PENDENTE'}">${p.resolvida?'Resolvida':'Aberta'}</span></td>
      <td>${!ro && !p.resolvida ? `<button class="ghost pd-resolver" data-id="${p.id}">Resolver</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">Sem pendências registradas.</td></tr>'}</tbody></table>
    ${!ro ? `<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <input id="pdNova" placeholder="Nova pendência" style="flex:2;min-width:180px">
      <input id="pdArea" placeholder="Área (ex.: Contratos)" style="flex:1;min-width:120px">
      <button id="btnAddPend" class="ghost">+ Adicionar</button>
    </div>` : ''}
    ` : ''}
    <div class="msg" id="imMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="imCancel" class="ghost">Fechar</button>
      ${!ro ? `<button id="imSalvar">${id?'Salvar alterações':'Criar produto'}</button>` : ''}
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('imCancel').onclick = () => div.remove();
  const bS = $('imSalvar');
  if (bS) bS.onclick = async () => {
    const rec = {
      empreendedora: $('imEmpreendedora').value.trim(),
      empreendimento: $('imEmpreendimento').value.trim(),
      tipo: $('imTipo').value, fase: $('imFase').value,
      sistemas: $('imSistemas').value || null, link_sistema: $('imLink').value || null,
      unidades: Number($('imUnidades').value || 0),
      previsao_lancamento: $('imPrev').value || null,
      observacoes: $('imObs').value || null,
      atualizado_em: new Date().toISOString(),
    };
    if (!rec.empreendedora || !rec.empreendimento) { $('imMsg').textContent = 'Informe empreendedora e empreendimento.'; return; }
    let r;
    if (id) r = await sb.from('implantacoes').update(rec).eq('id', id);
    else {
      const ins = await sb.from('implantacoes').insert(rec).select('id').single();
      r = ins;
      if (!ins.error) {
        // novo produto já nasce com o checklist padrão de 12 itens
        const modelo = await sb.from('implantacao_checklist').select('grupo,item,formato,ordem').limit(12);
        if (modelo.data?.length) {
          await sb.from('implantacao_checklist').insert(modelo.data.map(m => ({ ...m, implantacao_id: ins.data.id })));
        }
      }
    }
    if (r.error) { $('imMsg').textContent = r.error.message; return; }
    div.remove(); renderImplantacao();
  };
  div.querySelectorAll('.ck-item').forEach(c => c.onchange = async () => {
    await sb.from('implantacao_checklist').update({ concluido: c.checked }).eq('id', c.dataset.id);
  });
  div.querySelectorAll('.pd-resolver').forEach(b => b.onclick = async () => {
    await sb.from('implantacao_pendencias').update({ resolvida: true }).eq('id', b.dataset.id);
    div.remove(); openImplantacao(id);
  });
  const bP = $('btnAddPend');
  if (bP) bP.onclick = async () => {
    const p = $('pdNova').value.trim();
    if (!p) return;
    await sb.from('implantacao_pendencias').insert({ implantacao_id: id, pendencia: p, area: $('pdArea').value || null });
    div.remove(); openImplantacao(id);
  };
}

// ---------- QUALIDADE / RETRABALHO ----------
// Categorias padronizadas: o "porquê" do erro, que vira plano de ação/treinamento.
const CATEGORIAS_ERRO = {
  'Dados cadastrais': ['Nome/grafia', 'CPF/RG', 'E-mail', 'Telefone', 'Endereço', 'Estado civil', 'Profissão/renda'],
  'Documental': ['Documento faltante', 'Documento ilegível', 'Documento vencido', 'Assinatura ausente', 'Documento incorreto'],
  'Contratual': ['Cláusula incorreta', 'Quadro resumo divergente', 'Minuta desatualizada', 'Testemunha/assinante errado'],
  'Cálculo / Valores': ['Valor da unidade', 'Fluxo de pagamento', 'Comissionamento', 'Correção/juros', 'Desconto indevido'],
  'Sistema / Cadastro': ['Cadastro no ERP', 'Cadastro no CRM', 'Unidade errada', 'Status incorreto'],
  'Prazo / SLA': ['Fora do prazo de emissão', 'Fora do prazo de resposta', 'Follow-up não realizado'],
  'Outro': ['Outro'],
};
async function renderQualidade() {
  const mesAtual = new Date().toISOString().slice(0,7);
  if (!state.qualMes) state.qualMes = mesAtual;
  const ini = state.qualMes + '-01';
  const [y, m] = state.qualMes.split('-').map(Number);
  const fim = new Date(y, m, 1).toISOString().slice(0,10);
  const { data: aps } = await sb.from('apontamentos_erro')
    .select('*, analistas(nome), demandas(numero, proponente1_nome)')
    .gte('criado_em', ini).lt('criado_em', fim).order('criado_em', { ascending: false });
  const lista = aps || [];
  // analista comum vê os próprios apontamentos; gestão vê todos
  const souGestao = state.role === 'admin';
  const meuId = (state.lookups.analistas.find(a => a.nome === state.perfilNome) || {}).id;
  const visiveis = souGestao ? lista : lista.filter(a => a.analista_id === meuId);
  const porCat = {}; visiveis.forEach(a => porCat[a.categoria] = (porCat[a.categoria]||0)+1);
  const porAnalista = {}; visiveis.forEach(a => { const n = a.analistas?.nome || '—'; porAnalista[n] = (porAnalista[n]||0)+1; });
  const maxCat = Math.max(1, ...Object.values(porCat));
  const abertos = visiveis.filter(a => !a.resolvido).length;
  const porOrigem = { cliente: visiveis.filter(a=>a.origem==='cliente').length,
                      validacao_interna: visiveis.filter(a=>a.origem==='validacao_interna').length };

  shell(`
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">🔁 Qualidade / Retrabalho</h2>
        <span style="color:var(--muted);font-size:12.5px">${souGestao ? 'Apontamentos de erro de toda a equipe.' : 'Seus apontamentos do mês, em tempo real.'}</span>
        <div class="spacer"></div>
        <input id="qualMes" type="month" value="${state.qualMes}">
        ${state.role !== 'leitura' ? '<button id="btnNovoApont">+ Registrar apontamento</button>' : ''}
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v">${visiveis.length}</div><div class="l">🔁 Apontamentos no mês</div></div>
      <div class="kpi"><div class="v" style="color:${abertos?'var(--warn)':'var(--ok)'}">${abertos}</div><div class="l">⏳ Em aberto</div></div>
      <div class="kpi"><div class="v" style="color:var(--err)">${porOrigem.cliente}</div><div class="l">👤 Apontados pelo cliente</div></div>
      <div class="kpi"><div class="v">${porOrigem.validacao_interna}</div><div class="l">✅ Pegos na validação interna</div></div>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📊 Por categoria (o "porquê")</h2>
        ${Object.entries(porCat).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`
          <div class="hbar-row"><span class="hbar-lbl">${esc(c)}</span>
          <div class="hbar"><div style="width:${Math.round(100*n/maxCat)}%"></div></div><b>${n}</b></div>`).join('')
          || '<p style="color:var(--muted);font-size:12.5px">Nenhum apontamento neste mês. 🎉</p>'}
      </div>
      ${souGestao ? `<div class="card">
        <h2>👥 Por analista</h2>
        ${Object.entries(porAnalista).sort((a,b)=>b[1]-a[1]).map(([n,q],i)=>`
          <div class="hbar-row"><span class="hbar-lbl">${esc(nomeExib(n,i+1))}</span>
          <div class="hbar"><div style="width:${Math.round(100*q/Math.max(1,...Object.values(porAnalista)))}%"></div></div><b>${q}</b></div>`).join('')
          || '<p style="color:var(--muted);font-size:12.5px">Sem registros.</p>'}
      </div>` : ''}
    </div>
    <div class="card">
      <h2>Apontamentos de ${mesLabel(state.qualMes)}</h2>
      <table><thead><tr><th>Data</th><th>Processo</th><th>Analista</th><th>Origem</th><th>Categoria</th><th>Detalhe</th><th>Descrição</th><th>Status</th><th></th></tr></thead>
      <tbody>${visiveis.map((a,i) => `<tr>
        <td>${fmtDt(a.criado_em)}</td>
        <td>${esc(a.demandas?.numero ?? '—')}${a.demandas?.proponente1_nome ? '<br><span style="color:var(--muted);font-size:11px">'+esc(a.demandas.proponente1_nome)+'</span>' : ''}</td>
        <td>${esc(nomeExib(a.analistas?.nome || '—', i+1))}</td>
        <td><span class="tag ${a.origem==='cliente'?'ERRO':'RECEBIDO'}">${a.origem==='cliente'?'Cliente':'Validação interna'}</span></td>
        <td>${esc(a.categoria)}</td><td>${esc(a.subcategoria||'—')}</td>
        <td style="max-width:260px">${esc(a.descricao||'—')}</td>
        <td><span class="tag ${a.resolvido?'CONCLUIDO':'PENDENTE'}">${a.resolvido?'Resolvido':'Em aberto'}</span></td>
        <td>${state.role!=='leitura' && !a.resolvido ? `<button class="ghost btn-resolver" data-id="${a.id}">Resolver</button>` : ''}</td>
      </tr>`).join('') || '<tr><td colspan="9">Nenhum apontamento registrado neste mês.</td></tr>'}</tbody></table>
    </div>`);
  document.getElementById('qualMes').onchange = (e) => { state.qualMes = e.target.value; renderQualidade(); };
  const bN = document.getElementById('btnNovoApont');
  if (bN) bN.onclick = () => openApontamento();
  document.querySelectorAll('.btn-resolver').forEach(b => b.onclick = async () => {
    await sb.from('apontamentos_erro').update({ resolvido: true }).eq('id', b.dataset.id);
    renderQualidade();
  });
}

async function openApontamento() {
  const L = state.lookups;
  const equipe = L.analistas.filter(a => a.status !== 'Inativo');
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:560px">
    <h2>🔁 Registrar apontamento de erro</h2>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:12px">Padronizar o motivo é o que transforma o retrabalho em plano de ação e treinamento.</p>
    <div class="grid2">
      <div><label>Origem do apontamento</label><select id="apOrigem">
        <option value="validacao_interna">Validação interna (pegamos antes)</option>
        <option value="cliente">Cliente apontou</option></select></div>
      <div><label>Analista responsável</label><select id="apAnalista"><option value="">—</option>
        ${equipe.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select></div>
      <div><label>Categoria do erro</label><select id="apCat">
        ${Object.keys(CATEGORIAS_ERRO).map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div><label>Detalhe</label><select id="apSub"></select></div>
      <div style="grid-column:1/-1"><label>Nº do processo (opcional)</label><input id="apProc" placeholder="Busque pelo número do processo"></div>
      <div style="grid-column:1/-1"><label>Descrição do que ocorreu</label><input id="apDesc" placeholder="Ex.: e-mail do comprador digitado errado, contrato voltou para correção"></div>
    </div>
    <div class="msg" id="apMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="apCancel" class="ghost">Cancelar</button><button id="apSalvar">Registrar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const subs = () => {
    const c = div.querySelector('#apCat').value;
    div.querySelector('#apSub').innerHTML = (CATEGORIAS_ERRO[c]||[]).map(s=>`<option>${s}</option>`).join('');
  };
  subs();
  div.querySelector('#apCat').onchange = subs;
  div.querySelector('#apCancel').onclick = () => div.remove();
  div.querySelector('#apSalvar').onclick = async () => {
    const num = div.querySelector('#apProc').value.trim();
    let demandaId = null;
    if (num) {
      const { data } = await sb.from('demandas').select('id').eq('numero', num).maybeSingle();
      demandaId = data?.id || null;
      if (!demandaId) { div.querySelector('#apMsg').textContent = `Processo nº ${num} não encontrado. Deixe em branco ou corrija.`; return; }
    }
    const { error } = await sb.from('apontamentos_erro').insert({
      demanda_id: demandaId,
      analista_id: div.querySelector('#apAnalista').value || null,
      origem: div.querySelector('#apOrigem').value,
      categoria: div.querySelector('#apCat').value,
      subcategoria: div.querySelector('#apSub').value,
      descricao: div.querySelector('#apDesc').value || null,
      registrado_por: state.session?.user?.id,
    });
    if (error) { div.querySelector('#apMsg').textContent = error.message; return; }
    div.remove(); renderQualidade();
  };
}

// ---------- METAS & INDICADORES ----------
// Replica a aba "Acompanhamento mensal-metas" da planilha de Desempenho de Processos.
// % atingimento = 1 - (erros / processos), comparado à meta de cada indicador.
async function renderMetas() {
  const anoAtual = new Date().getFullYear();
  if (!state.metaAno) state.metaAno = anoAtual;
  const [{ data: kpis }, { data: mensal }, { data: porAnalistaRaw }] = await Promise.all([
    sb.from('indicadores_kpi').select('*').eq('ativo', true).order('ordem'),
    sb.from('indicador_mensal').select('*'),
    sb.from('indicador_analista_mensal').select('*, analistas(nome, status)'),
  ]);
  const porInd = {};
  (mensal || []).forEach(r => { (porInd[r.indicador_id] = porInd[r.indicador_id] || {})[r.mes.slice(0,7)] = r; });
  const meses = Array.from({length:12}, (_,i) => `${state.metaAno}-${String(i+1).padStart(2,'0')}`);
  const TRIM = [['1º Trim', 0, 3], ['2º Trim', 3, 6], ['3º Trim', 6, 9], ['4º Trim', 9, 12]];
  const atingimento = (r) => (!r || !r.quantidade_processos) ? null
    : 1 - (r.quantidade_erros / r.quantidade_processos);
  const pctTxt = (v) => v === null ? '—' : (v*100).toFixed(1) + '%';
  const cor = (v, meta) => v === null ? 'var(--muted)' : v >= meta ? 'var(--ok)' : v >= meta*0.95 ? 'var(--warn)' : 'var(--err)';
  // agregado do trimestre: soma processos e erros do período (não média de percentuais)
  const trimestre = (indId, ini, fim) => {
    const rs = meses.slice(ini, fim).map(m => (porInd[indId]||{})[m]).filter(Boolean);
    if (!rs.length) return null;
    const p = rs.reduce((s,r)=>s+r.quantidade_processos,0);
    const e = rs.reduce((s,r)=>s+r.quantidade_erros,0);
    return p ? 1 - e/p : null;
  };
  const anos = [...new Set([anoAtual, anoAtual-1, ...(mensal||[]).map(r=>+r.mes.slice(0,4))])].sort((a,b)=>b-a);

  // ranking individual — hoje só "Emissão de contrato sem erro" tem granularidade por analista
  const porAnalista = {};
  (porAnalistaRaw||[]).forEach(r => {
    const n = r.analistas?.nome || '—';
    const a = porAnalista[n] = porAnalista[n] || { nome: n, status: r.analistas?.status, meses: {} };
    a.meses[r.mes.slice(0,7)] = r;
  });
  const ranking = Object.values(porAnalista).map(a => {
    const rs = meses.map(m => a.meses[m]).filter(Boolean);
    const proc = rs.reduce((s,r)=>s+r.quantidade_processos,0);
    const err = rs.reduce((s,r)=>s+r.quantidade_erros,0);
    const media = proc ? 1 - err/proc : null;
    const ultimo = rs[rs.length-1], penultimo = rs[rs.length-2];
    const tend = (ultimo && penultimo && penultimo.quantidade_processos)
      ? (1-ultimo.quantidade_erros/ultimo.quantidade_processos) - (1-penultimo.quantidade_erros/penultimo.quantidade_processos) : null;
    return { ...a, proc, err, media, ultimoPct: ultimo ? 1-ultimo.quantidade_erros/ultimo.quantidade_processos : null, tend };
  }).sort((a,b) => (b.media??-1) - (a.media??-1));
  const statusTag = (a) => a.status === 'Desligado' ? '⚫ Desligado' : a.status === 'Em licença' ? '🔵 Em licença'
    : a.media === null ? '—' : a.media >= 1.05 ? '🟢 Excelente' : a.media >= 0.95 ? '🟢 Ótimo' : a.media >= 0.90 ? '🟡 Atenção' : '🔴 Abaixo da meta';
  const naMeta = ranking.filter(a => a.status === 'Ativo' && a.media !== null && a.media >= 0.95).length;
  const ativosComDado = ranking.filter(a => a.status === 'Ativo' && a.media !== null).length;

  shell(`
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">🎯 Metas & Indicadores</h2>
        <span style="color:var(--muted);font-size:12.5px">Indicadores fixos do setor — base das apresentações mensais.</span>
        <div class="spacer"></div>
        <select id="metaAno">${anos.map(a=>`<option ${a===state.metaAno?'selected':''}>${a}</option>`).join('')}</select>
        ${state.role === 'admin' ? '<button id="btnEditarMetas" class="ghost">✏️ Lançar dados do mês</button>' : ''}
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h2 style="margin:0 0 4px">🏆 Ranking individual — Emissão de contrato sem erro</h2>
      <p style="color:var(--muted);font-size:12px;margin-bottom:10px">Colaboradores na meta (≥95%): <b>${naMeta} / ${ativosComDado}</b></p>
      <table><thead><tr><th>#</th><th>Colaborador</th><th>Atingimento</th><th>Último mês</th><th>Tendência</th><th>Processos</th><th>Erros</th><th>Status</th></tr></thead>
      <tbody>${ranking.map((a,i) => `<tr>
        <td>${i+1}</td><td>${esc(nomeExib(a.nome, i+1))}</td>
        <td style="font-weight:600">${pctTxt(a.media)}</td>
        <td>${pctTxt(a.ultimoPct)}</td>
        <td style="color:${a.tend===null?'var(--muted)':a.tend>=0?'var(--ok)':'var(--err)'}">${a.tend===null?'—':(a.tend>=0?'▲':'▼')+' '+Math.abs(a.tend*100).toFixed(1)+'%'}</td>
        <td>${a.proc}</td><td>${a.err}</td>
        <td>${statusTag(a)}</td>
      </tr>`).join('') || '<tr><td colspan="8">Sem dados ainda.</td></tr>'}</tbody></table>
    </div>
    ${(kpis||[]).map(k => {
      const serie = meses.map(m => atingimento((porInd[k.id]||{})[m]));
      const comDado = serie.filter(v => v !== null);
      const mediaAno = comDado.length ? comDado.reduce((s,v)=>s+v,0)/comDado.length : null;
      return `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <h2 style="margin:0;font-size:15px">${esc(k.nome)}</h2>
          <span class="tag ${mediaAno===null?'':mediaAno>=k.meta_percentual?'CONCLUIDO':'ERRO'}">Meta ${(k.meta_percentual*100).toFixed(0)}%</span>
          <div class="spacer"></div>
          <span style="font-size:12.5px;color:var(--muted)">Média do ano:</span>
          <b style="color:${cor(mediaAno, k.meta_percentual)}">${pctTxt(mediaAno)}</b>
        </div>
        <div style="overflow-x:auto">
          <table style="min-width:760px">
            <thead><tr><th style="text-align:left">Mês</th>
              ${meses.map(m=>`<th>${mesLabel(m).slice(0,3)}</th>`).join('')}</tr></thead>
            <tbody>
              <tr><td><b>Atingimento</b></td>
                ${serie.map(v=>`<td style="color:${cor(v,k.meta_percentual)};font-weight:600">${pctTxt(v)}</td>`).join('')}</tr>
              <tr><td style="color:var(--muted)">Processos</td>
                ${meses.map(m=>`<td style="color:var(--muted)">${(porInd[k.id]||{})[m]?.quantidade_processos ?? '—'}</td>`).join('')}</tr>
              <tr><td style="color:var(--muted)">Erros</td>
                ${meses.map(m=>{const r=(porInd[k.id]||{})[m];return `<td style="color:${r&&r.quantidade_erros>0?'var(--err)':'var(--muted)'}">${r?r.quantidade_erros:'—'}</td>`;}).join('')}</tr>
            </tbody>
          </table>
        </div>
        <div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-top:10px">
          ${TRIM.map(([lbl,i,f])=>{const v=trimestre(k.id,i,f);
            return `<div class="kpi"><div class="v" style="font-size:20px;color:${cor(v,k.meta_percentual)}">${pctTxt(v)}</div><div class="l">${lbl}</div></div>`;}).join('')}
        </div>
      </div>`;
    }).join('')}`);
  document.getElementById('metaAno').onchange = (e) => { state.metaAno = Number(e.target.value); renderMetas(); };
  const bE = document.getElementById('btnEditarMetas');
  if (bE) bE.onclick = () => openLancarIndicadores(kpis, porInd);
}

async function openLancarIndicadores(kpis, porInd) {
  const mesPadrao = new Date().toISOString().slice(0,7);
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:640px">
    <h2>✏️ Lançar dados do mês</h2>
    <div style="margin-bottom:12px"><label>Mês de referência</label><input id="liMes" type="month" value="${mesPadrao}"></div>
    <div id="liCampos"></div>
    <div class="msg" id="liMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="liCancel" class="ghost">Cancelar</button><button id="liSalvar">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const campos = () => {
    const m = div.querySelector('#liMes').value;
    div.querySelector('#liCampos').innerHTML = kpis.map(k => {
      const r = (porInd[k.id]||{})[m] || {};
      return `<div style="border-top:1px solid var(--border);padding:10px 0">
        <div style="font-size:13px;margin-bottom:6px"><b>${esc(k.nome)}</b> <span style="color:var(--muted)">· meta ${(k.meta_percentual*100).toFixed(0)}%</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px"><label>Qtd. processos</label><input class="li-qtd" data-id="${k.id}" type="number" min="0" value="${r.quantidade_processos ?? ''}"></div>
          <div style="flex:1;min-width:120px"><label>Qtd. erros</label><input class="li-err" data-id="${k.id}" type="number" min="0" value="${r.quantidade_erros ?? ''}"></div>
        </div></div>`;
    }).join('');
  };
  campos();
  div.querySelector('#liMes').onchange = campos;
  div.querySelector('#liCancel').onclick = () => div.remove();
  div.querySelector('#liSalvar').onclick = async () => {
    const mes = div.querySelector('#liMes').value + '-01';
    const linhas = [];
    div.querySelectorAll('.li-qtd').forEach(inp => {
      const err = div.querySelector(`.li-err[data-id="${inp.dataset.id}"]`);
      if (inp.value === '' && err.value === '') return;
      linhas.push({ indicador_id: inp.dataset.id, mes,
        quantidade_processos: Number(inp.value || 0), quantidade_erros: Number(err.value || 0),
        atualizado_em: new Date().toISOString() });
    });
    if (!linhas.length) { div.querySelector('#liMsg').textContent = 'Preencha ao menos um indicador.'; return; }
    const { error } = await sb.from('indicador_mensal').upsert(linhas, { onConflict: 'indicador_id,mes' });
    if (error) { div.querySelector('#liMsg').textContent = error.message; return; }
    div.remove(); renderMetas();
  };
}

// ---------- FECHAMENTO ----------
async function renderFechamento() {
  const [y, m] = state.fechMes.split('-').map(Number);
  const ini = new Date(y, m-1, 1).toISOString(), fim = new Date(y, m, 1).toISOString();
  const { data: rows } = await sb.from('demandas')
    .select('numero,recebido_em,numero_processo,proponente1_nome,proponente1_cpf,unidade,status,analistas(nome),empreendedoras(nome),empreendimentos(nome),atividades(nome)')
    .gte('recebido_em', ini).lt('recebido_em', fim).order('recebido_em');
  const grp = {};
  (rows||[]).forEach(r => {
    const k = r.analistas?.nome || '(sem analista)';
    (grp[k] = grp[k] || []).push(r);
  });
  shell(`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <h2 style="margin:0">💰 Fechamento mensal</h2>
        <input type="month" id="fechMes" value="${state.fechMes}">
        <button id="btnCsv" class="ghost">⬇ Exportar CSV</button>
        <span style="color:var(--muted);font-size:13px">${(rows||[]).length} processos no mês</span>
      </div>
      ${Object.entries(grp).map(([an, rs]) => `
        <h2 style="margin-top:14px">${esc(an)} — ${rs.length} processos</h2>
        <table><thead><tr><th>Nº</th><th>Data</th><th>Canal</th><th>Proponente</th><th>Empreendedora</th><th>Empreendimento</th><th>Unidade</th><th>Atividade</th><th>Status</th></tr></thead>
        <tbody>${rs.map(r => `<tr>
          <td>${r.numero ?? ''}</td><td>${fmtDt(r.recebido_em)}</td><td>${esc(r.numero_processo)}</td>
          <td>${esc(r.proponente1_nome)}</td><td>${esc(r.empreendedoras?.nome)}</td><td>${esc(r.empreendimentos?.nome)}</td>
          <td>${esc(r.unidade)}</td><td>${esc(r.atividades?.nome)}</td>
          <td><span class="tag ${esc(r.status)}">${esc(r.status)}</span></td></tr>`).join('')}</tbody></table>`).join('') || '<div class="msg">Nenhum processo no mês selecionado.</div>'}
    </div>`);
  fechMes.onchange = (e) => { state.fechMes = e.target.value; renderFechamento(); };
  btnCsv.onclick = () => {
    const head = ['Analista','Nº','Data','Canal','Proponente','CPF','Empreendedora','Empreendimento','Unidade','Atividade','Status'];
    const csv = [head.join(';')].concat((rows||[]).map(r => [
      r.analistas?.nome, r.numero, fmtDt(r.recebido_em), r.numero_processo, r.proponente1_nome, r.proponente1_cpf,
      r.empreendedoras?.nome, r.empreendimentos?.nome, r.unidade, r.atividades?.nome, r.status
    ].map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(';'))).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `fechamento-${state.fechMes}.csv`;
    a.click();
  };
}

// ---------- ADMINISTRAÇÃO (Usuários + Cadastros) ----------
const ROLE_INFO = {
  admin: { cor: 'CONCLUIDO', label: 'Admin' },
  analista: { cor: 'RECEBIDO', label: 'Analista' },
  leitura: { cor: 'PENDENTE', label: 'Leitura' },
};
async function renderCadastros() {
  if (!state.adminTab) state.adminTab = 'usuarios';
  const L = state.lookups;
  const TABS = [['usuarios','👤 Usuários'], ['cadastros','🗂️ Cadastros operacionais']];
  const tabsHtml = `<div class="admin-tabs">${TABS.map(([k,l]) =>
    `<button class="admin-tab ${state.adminTab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div>`;

  if (state.adminTab === 'usuarios') {
    const { data: usuarios } = await sb.from('perfis').select('*').order('criado_em');
    shell(`
      ${tabsHtml}
      <div class="card">
        <div class="admin-head">
          <div>
            <h2 style="margin-bottom:2px">Usuários e níveis de acesso</h2>
            <p style="color:var(--muted);font-size:12.5px">
              <b>Admin</b> — acesso total, inclusive metas e usuários &nbsp;·&nbsp;
              <b>Analista</b> — opera o sistema &nbsp;·&nbsp;
              <b>Leitura</b> — só visualiza (bloqueado no banco, não só na tela)
            </p>
          </div>
          ${state.role === 'admin' ? '<button id="btnAbrirConvite">✉️ Convidar usuário</button>' : ''}
        </div>
        ${state.role === 'admin' ? `
        <div id="conviteBox" class="invite-box hidden">
          <div><label>E-mail para convidar</label><input id="nuEmail" type="email" placeholder="pessoa@neoservice.com.br"></div>
          <div><label>Nível de acesso</label><select id="nuNivel">
            <option value="analista">Analista</option><option value="admin">Admin</option><option value="leitura">Leitura</option>
          </select></div>
          <button id="btnCriarUser">Enviar convite</button>
          <span id="nuMsg" class="msg" style="margin:0;flex-basis:100%"></span>
        </div>` : ''}
        <table class="users-table"><thead><tr><th>Usuário</th><th>Nível de acesso</th><th>Desde</th><th>Ações</th></tr></thead>
        <tbody>${(usuarios||[]).map(u => {
          const isSelf = u.user_id === state.session.user.id;
          const info = ROLE_INFO[u.role] || ROLE_INFO.analista;
          return `<tr style="${u.ativo===false?'opacity:.5':''}">
          <td><div class="user-cell"><div class="user-avatar">${esc(u.email[0]?.toUpperCase() || '?')}</div>
            <div><b>${esc(u.email)}</b>${isSelf ? ' <span class="tag RECEBIDO">você</span>' : ''}${u.ativo===false ? ' <span class="tag PENDENTE">inativo</span>' : ''}</div></div></td>
          <td>${state.role === 'admin' && !isSelf
            ? `<select class="selRole" data-uid="${u.user_id}">
                ${Object.keys(ROLE_INFO).map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${ROLE_INFO[r].label}</option>`).join('')}</select>`
            : `<span class="tag ${info.cor}">${info.label}</span>`}</td>
          <td style="color:var(--muted)">${fmtDt(u.criado_em)}</td>
          <td>${state.role === 'admin' && !isSelf ? `
            <button class="ghost btn-toggle-ativo" data-uid="${u.user_id}" data-ativo="${u.ativo!==false}" style="font-size:12px;padding:4px 9px">${u.ativo===false ? '✅ Reativar' : '⏸ Inativar'}</button>
            <button class="ghost btn-excluir-user" data-uid="${u.user_id}" data-email="${esc(u.email)}" style="font-size:12px;padding:4px 9px;color:var(--err)">🗑 Excluir</button>`
            : ''}</td></tr>`;
        }).join('')}</tbody></table>
      </div>`);
    const btnAbrir = document.getElementById('btnAbrirConvite');
    if (btnAbrir) btnAbrir.onclick = () => conviteBox.classList.toggle('hidden');
    document.querySelectorAll('.selRole').forEach(s => s.onchange = async () => {
      const { error } = await sb.from('perfis').update({ role: s.value }).eq('user_id', s.dataset.uid);
      if (error) alert(error.message);
    });
    document.querySelectorAll('.btn-toggle-ativo').forEach(b => b.onclick = async () => {
      const ativoAtual = b.dataset.ativo === 'true';
      const { error } = await sb.from('perfis').update({ ativo: !ativoAtual }).eq('user_id', b.dataset.uid);
      if (error) { alert(error.message); return; }
      renderCadastros();
    });
    document.querySelectorAll('.btn-excluir-user').forEach(b => b.onclick = async () => {
      if (!confirm(`Excluir permanentemente a conta de ${b.dataset.email}? Essa ação não pode ser desfeita.`)) return;
      const { data, error } = await sb.functions.invoke('excluir-usuario', { body: { user_id: b.dataset.uid } });
      if (error || data?.error) { alert(data?.error || error.message); return; }
      renderCadastros();
    });
    const btnCU = document.getElementById('btnCriarUser');
    if (btnCU) btnCU.onclick = async () => {
      const email = nuEmail.value.trim(), nivel = nuNivel.value;
      const msg = document.getElementById('nuMsg');
      if (!email) { msg.textContent = 'Informe o e-mail.'; return; }
      btnCU.disabled = true; msg.textContent = 'Enviando convite...';
      const { data, error } = await sb.functions.invoke('convidar-usuario', {
        body: { email, nivel, redirectTo: window.location.origin },
      });
      btnCU.disabled = false;
      if (error || data?.error) { msg.textContent = data?.error || error.message; return; }
      msg.textContent = `Convite enviado para ${email}.`;
      nuEmail.value = '';
      renderCadastros();
    };
  } else {
    const bloco = (titulo, items, tipo, extra) => `
      <div class="card">
        <h2>${titulo} <span class="count-badge">${items.length}</span></h2>
        <div class="cad-list">${items.map(i => `
          <div class="cad-item">${esc(i.nome)}${extra ? extra(i) : ''}
            <button class="ghost cad-edit" data-t="${tipo}" data-id="${i.id}" data-n="${esc(i.nome)}">✎</button>
          </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhum registro.</p>'}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <input id="new_${tipo}" placeholder="Novo nome..." style="flex:1">
          ${tipo === 'empreendimentos' ? `<select id="new_emp_ed">${L.empreendedoras.map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select>` : ''}
          <button class="ghost cad-add" data-t="${tipo}">Adicionar</button>
        </div>
      </div>`;
    shell(`
      ${tabsHtml}
      <div class="grid-cad">
        ${bloco('👥 Analistas', L.analistas, 'analistas', i => ` <span class="tag ${i.status==='Ativo'?'CONCLUIDO':'PENDENTE'}">${esc(i.status)}</span>`)}
        ${bloco('🏢 Empreendedoras', L.empreendedoras, 'empreendedoras')}
        ${bloco('🏗️ Empreendimentos', L.empreendimentos.map(e => ({...e, nome: e.nome + (L.empreendedoras.find(x=>x.id===e.empreendedora_id) ? ' · ' + L.empreendedoras.find(x=>x.id===e.empreendedora_id).nome : '')})), 'empreendimentos')}
        ${bloco('📝 Atividades', L.atividades, 'atividades', i => i.ativa ? '' : ' <span class="tag PENDENTE">inativa</span>')}
      </div>`);
    document.querySelectorAll('.cad-add').forEach(b => b.onclick = async () => {
      const t = b.dataset.t;
      const inp = document.getElementById('new_' + t);
      if (!inp.value.trim()) return;
      const rec = { nome: inp.value.trim() };
      if (t === 'empreendimentos') rec.empreendedora_id = document.getElementById('new_emp_ed').value;
      const { error } = await sb.from(t).insert(rec);
      if (error) { alert(error.message); return; }
      await loadLookups(); renderCadastros();
    });
    document.querySelectorAll('.cad-edit').forEach(b => b.onclick = async () => {
      const t = b.dataset.t;
      const nome = prompt('Novo nome (vazio para cancelar):', b.dataset.n.split(' · ')[0]);
      if (!nome || !nome.trim()) return;
      const { error } = await sb.from(t).update({ nome: nome.trim() }).eq('id', b.dataset.id);
      if (error) { alert(error.message); return; }
      await loadLookups(); renderCadastros();
    });
  }
  document.querySelectorAll('.admin-tab').forEach(b => b.onclick = () => { state.adminTab = b.dataset.tab; renderCadastros(); });
}

// ---------- PRODUÇÃO (análise avançada + metas) ----------
function svgLine(points, w, h, color, dash) {
  if (!points.length) return '';
  const xs = points.map((_, i) => i / Math.max(points.length - 1, 1) * (w - 20) + 10);
  const max = Math.max(...points, 1);
  const ys = points.map(v => h - 14 - (v / max) * (h - 28));
  return `<polyline fill="none" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ''} points="${xs.map((x, i) => x + ',' + ys[i]).join(' ')}"/>`;
}
// ---------- ESTEIRA (fila de produção por etapa) ----------
const PRIORIDADES = ['NORMAL', 'ALTA', 'URGENTE'];
const ESTEIRA_TIPOS = [
  ['analise_credito', 'Análise de Crédito'],
  ['emissao_contrato', 'Emissão de Contrato'],
  ['validacao_documento', 'Validação de Documento'],
];
async function renderEsteira() {
  if (!state.esteiraTipo) state.esteiraTipo = 'emissao_contrato';
  const [{ data: etapas }, { data: processos }] = await Promise.all([
    sb.from('etapas_esteira').select('*').eq('ativa', true).eq('esteira_tipo', state.esteiraTipo).order('ordem'),
    sb.from('esteira_processos').select('*, analistas(nome), clientes(nome)').eq('esteira_tipo', state.esteiraTipo).neq('status', 'CONCLUIDO').order('criado_em'),
  ]);
  const porEtapa = {};
  (etapas || []).forEach(e => porEtapa[e.id] = []);
  (processos || []).forEach(p => { (porEtapa[p.etapa_atual_id] = porEtapa[p.etapa_atual_id] || []).push(p); });
  const meuNome = state.perfilNome || '';

  shell(`
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">⛓️ Esteira de Produção</h2>
        <span style="color:var(--muted);font-size:12.5px">Conclua sua etapa e transfira o processo para o próximo colega, anexando os documentos.</span>
        <div class="spacer"></div>
        ${state.role !== 'leitura' ? '<button id="btnNovoEsteira">+ Novo processo</button>' : ''}
        ${state.role === 'admin' ? '<button id="btnEtapas" class="ghost">⚙️ Etapas</button>' : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        ${ESTEIRA_TIPOS.map(([k,l]) => `<button class="ghost esteira-tab ${state.esteiraTipo===k?'active':''}" data-tipo="${k}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="esteira-board">
      ${(etapas || []).map(et => `
        <div class="esteira-col">
          <div class="esteira-col-head"><b>${esc(et.nome)}</b><span class="count-badge">${(porEtapa[et.id]||[]).length}</span></div>
          <div class="esteira-cards">
            ${(porEtapa[et.id] || []).map(p => `
              <div class="esteira-card ${p.prioridade==='URGENTE'?'urgente':p.prioridade==='ALTA'?'alta':''}" data-id="${p.id}">
                <div class="ec-title">${esc(p.titulo)}</div>
                ${p.clientes?.nome ? `<div class="ec-sub">👤 ${esc(p.clientes.nome)}</div>` : ''}
                ${p.unidade ? `<div class="ec-sub">🏠 ${esc(p.unidade)}</div>` : ''}
                <div class="ec-foot">
                  ${p.analista_atual_id
                    ? `<span class="tag ${p.analistas?.nome===meuNome?'CONCLUIDO':'RECEBIDO'}">${esc(p.analistas.nome)}</span>`
                    : `<span class="tag PENDENTE">Sem responsável</span>`}
                  ${p.prioridade && p.prioridade !== 'NORMAL' ? `<span class="tag ${p.prioridade==='URGENTE'?'ERRO':'PENDENTE'}" style="margin-left:auto">${esc(p.prioridade)}</span>` : ''}
                </div>
              </div>`).join('') || '<div class="ec-empty">Fila vazia</div>'}
          </div>
        </div>`).join('')}
    </div>`);

  document.querySelectorAll('.esteira-card').forEach(c => c.onclick = () => openProcessoEsteira(c.dataset.id, etapas));
  const bN = document.getElementById('btnNovoEsteira');
  if (bN) bN.onclick = () => openProcessoEsteira(null, etapas);
  const bE = document.getElementById('btnEtapas');
  if (bE) bE.onclick = () => openGerenciarEtapas(etapas);
  document.querySelectorAll('.esteira-tab').forEach(b => b.onclick = () => { state.esteiraTipo = b.dataset.tipo; renderEsteira(); });
}

async function openProcessoEsteira(id, etapas) {
  let p = null, historico = [], anexos = [], transicoes = [];
  if (id) {
    const [pp, hh, aa] = await Promise.all([
      sb.from('esteira_processos').select('*, analistas(nome), clientes(nome)').eq('id', id).single(),
      sb.from('esteira_historico').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
      sb.from('esteira_anexos').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
    ]);
    p = pp.data; historico = hh.data || []; anexos = aa.data || [];
    const { data: tt } = await sb.from('esteira_transicoes').select('*').eq('etapa_origem_id', p.etapa_atual_id).order('ordem_botao');
    transicoes = tt || [];
  }
  const L = state.lookups;
  const equipe = L.analistas.filter(a => a.status !== 'Inativo');
  const etapaIdx = p ? etapas.findIndex(e => e.id === p.etapa_atual_id) : 0;
  const ro = state.role === 'leitura';
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal">
    <h2>${id ? '⛓️ ' + esc(p.titulo) : '⛓️ Novo processo na esteira'}</h2>
    <div class="grid2">
      <div style="grid-column:1/-1"><label>Título / referência do processo</label><input id="epTitulo" value="${esc(p?.titulo)}" placeholder="Ex.: nome do proponente ou nº do processo" ${ro?'disabled':''}></div>
      <div><label>Cliente (cadastro de Repasse)</label><select id="epCliente" ${ro?'disabled':''}><option value="">—</option>
        ${(state.clientesLookup||[]).map(c=>`<option value="${c.id}" ${p?.cliente_id===c.id?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div><label>Empreendimento</label><select id="epEmp" ${ro?'disabled':''}><option value="">—</option>
        ${L.empreendimentos.map(e=>`<option value="${e.id}" ${p?.empreendimento_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select></div>
      <div><label>Unidade</label><input id="epUnidade" value="${esc(p?.unidade)}" placeholder="Ex.: QD5LT12" ${ro?'disabled':''}></div>
      <div><label>Prioridade</label><select id="epPrioridade" ${ro?'disabled':''}>
        ${PRIORIDADES.map(x=>`<option ${(p?.prioridade||'NORMAL')===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div><label>Responsável atual</label><select id="epAnalista" ${ro?'disabled':''}><option value="">Sem responsável (na fila)</option>
        ${equipe.map(a=>`<option value="${a.id}" ${p?.analista_atual_id===a.id?'selected':''}>${esc(a.nome)}${a.cargo && a.cargo!=='analista' ? ' ('+esc(a.cargo)+')' : ''}</option>`).join('')}</select></div>
      ${id ? `<div><label>Etapa atual</label><input value="${esc(etapas[etapaIdx]?.nome)}" disabled></div>` : ''}
      <div style="grid-column:1/-1"><label>Observações</label><input id="epObs" value="${esc(p?.obs)}" placeholder="Informações para o próximo responsável" ${ro?'disabled':''}></div>
    </div>
    ${id ? `
    <h2 style="margin-top:18px">📎 Documentos e links</h2>
    <div class="anexo-list">${anexos.map(a => `
      <div class="anexo-item">${a.tipo==='link' ? '🔗' : iconeArquivo(a.nome)}
        <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.nome)}</a>
        <span style="color:var(--muted2);font-size:11px">${esc(a.criado_por||'')}</span>
        ${!ro ? `<button class="ghost del-anexo" data-id="${a.id}" data-path="${a.tipo==='arquivo'?esc(a.storage_path||''):''}">✕</button>` : ''}
      </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nenhum documento anexado.</p>'}</div>
    ${!ro ? `
    <div class="upload-box">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <input id="epLinkNome" placeholder="Nome do link (ex.: Pasta do processo)" style="flex:1;min-width:150px">
        <input id="epLinkUrl" placeholder="https://... (SharePoint, Drive, etc.)" style="flex:2;min-width:200px">
        <button id="btnAddLink" class="ghost">+ Link</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="epArquivo" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" style="flex:1;min-width:200px">
        <button id="btnUpload" class="ghost">⬆ Enviar documento</button>
      </div>
      <p style="color:var(--muted2);font-size:11.5px;margin-top:6px">PDF, Word, Excel, imagens e ZIP · até 50 MB · armazenado de forma privada no sistema</p>
      <div id="upMsg" class="msg" style="margin-top:4px"></div>
    </div>` : ''}
    <h2 style="margin-top:18px">🕓 Histórico do processo</h2>
    <div class="timeline">${historico.map(h => `
      <div class="tl-item"><div class="tl-dot"></div>
        <div><b>${fmtDt(h.criado_em)}</b> — ${esc(h.evento)}${h.autor ? ` <span style="color:var(--muted2);font-size:11px">· ${esc(h.autor)}</span>` : ''}</div></div>`).join('')}</div>
    ` : ''}
    <div class="msg" id="epMsg"></div>
    ${id && !ro ? `
    <div class="transfer-box">
      <b style="font-size:13px">➡️ Concluir minha etapa e transferir</b>
      <div style="margin-top:8px"><label>Enviar para (responsável pela próxima etapa)</label><select id="epProxAnalista">
        <option value="">Deixar na fila (qualquer um pega)</option>
        ${equipe.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${transicoes.map(t => `<button class="btn-transicao" data-destino="${t.etapa_destino_id||''}" data-rotulo="${esc(t.rotulo)}">${esc(t.rotulo)}</button>`).join('')
          || '<span style="color:var(--muted);font-size:12.5px">Nenhuma transição configurada para esta etapa.</span>'}
      </div>
    </div>` : ''}
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:end;flex-wrap:wrap">
      <button id="epCancel" class="ghost">Fechar</button>
      ${id && !ro ? '<button id="btnFinalizar" class="ghost">✅ Concluir processo</button>' : ''}
      ${!ro ? `<button id="epSalvar">${id ? 'Salvar alterações' : 'Criar processo'}</button>` : ''}
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('epCancel').onclick = () => div.remove();

  const coletar = () => ({
    titulo: $('epTitulo').value.trim(),
    cliente_id: $('epCliente').value || null,
    empreendimento_id: $('epEmp').value || null,
    unidade: $('epUnidade').value || null,
    prioridade: $('epPrioridade').value,
    analista_atual_id: $('epAnalista').value || null,
    obs: $('epObs').value || null,
  });

  const btnSalvar = $('epSalvar');
  if (btnSalvar) btnSalvar.onclick = async () => {
    const rec = coletar();
    if (!rec.titulo) { $('epMsg').textContent = 'Informe o título do processo.'; return; }
    rec.status = rec.analista_atual_id ? 'EM_ANDAMENTO' : 'AGUARDANDO';
    let r;
    if (id) r = await sb.from('esteira_processos').update(rec).eq('id', id);
    else { rec.etapa_atual_id = etapas[0].id; rec.esteira_tipo = state.esteiraTipo; r = await sb.from('esteira_processos').insert(rec); }
    if (r.error) { $('epMsg').textContent = r.error.message; return; }
    div.remove(); renderEsteira();
  };
  if (!id) return;

  div.querySelectorAll('.btn-transicao').forEach(btn => btn.onclick = async () => {
    const destino = btn.dataset.destino || null;
    const rotulo = btn.dataset.rotulo;
    const proxAnalista = $('epProxAnalista').value || null;
    if (!destino) {
      const { error } = await sb.from('esteira_processos').update({ status: 'CONCLUIDO', concluido_em: new Date().toISOString() }).eq('id', id);
      if (error) { $('epMsg').textContent = error.message; return; }
      await sb.from('esteira_historico').insert({ processo_id: id, evento: rotulo, autor: state.session?.user?.email });
      div.remove(); renderEsteira(); return;
    }
    const rec = { ...coletar(), etapa_atual_id: destino, analista_atual_id: proxAnalista,
      status: proxAnalista ? 'EM_ANDAMENTO' : 'AGUARDANDO' };
    const { error } = await sb.from('esteira_processos').update(rec).eq('id', id);
    if (error) { $('epMsg').textContent = error.message; return; }
    await sb.from('esteira_historico').insert({ processo_id: id, evento: rotulo, autor: state.session?.user?.email });
    div.remove(); renderEsteira();
  });
  const btnFinalizar = $('btnFinalizar');
  if (btnFinalizar) btnFinalizar.onclick = async () => {
    const { error } = await sb.from('esteira_processos').update({ status: 'CONCLUIDO', concluido_em: new Date().toISOString() }).eq('id', id);
    if (error) { $('epMsg').textContent = error.message; return; }
    div.remove(); renderEsteira();
  };
  const btnAddLink = $('btnAddLink');
  if (btnAddLink) btnAddLink.onclick = async () => {
    const nome = $('epLinkNome').value.trim(); let url = $('epLinkUrl').value.trim();
    if (!nome || !url) { $('upMsg').textContent = 'Informe nome e endereço do link.'; return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    await sb.from('esteira_anexos').insert({ processo_id: id, tipo: 'link', nome, url, criado_por: state.session?.user?.email });
    div.remove(); openProcessoEsteira(id, etapas);
  };
  const btnUpload = $('btnUpload');
  if (btnUpload) btnUpload.onclick = async () => {
    const f = $('epArquivo').files[0];
    const msg = $('upMsg');
    if (!f) { msg.textContent = 'Escolha um arquivo.'; return; }
    if (f.size > 50 * 1024 * 1024) { msg.textContent = 'Arquivo muito grande (máx. 50 MB).'; return; }
    btnUpload.disabled = true; msg.textContent = 'Enviando...';
    const path = `${id}/${Date.now()}_${f.name.replace(/[^\w.\-]/g, '_')}`;
    const { error: upErr } = await sb.storage.from('esteira-documentos').upload(path, f);
    if (upErr) { msg.textContent = upErr.message; btnUpload.disabled = false; return; }
    const { data: signed } = await sb.storage.from('esteira-documentos').createSignedUrl(path, 60 * 60 * 24 * 365);
    await sb.from('esteira_anexos').insert({ processo_id: id, tipo: 'arquivo', nome: f.name,
      url: signed?.signedUrl || path, storage_path: path, criado_por: state.session?.user?.email });
    div.remove(); openProcessoEsteira(id, etapas);
  };
  div.querySelectorAll('.del-anexo').forEach(b => b.onclick = async () => {
    if (b.dataset.path) { try { await sb.storage.from('esteira-documentos').remove([b.dataset.path]); } catch (e) {} }
    await sb.from('esteira_anexos').delete().eq('id', b.dataset.id);
    div.remove(); openProcessoEsteira(id, etapas);
  });
}
function iconeArquivo(nome) {
  const ext = (nome.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return '📕';
  if (['doc','docx'].includes(ext)) return '📘';
  if (['xls','xlsx','csv'].includes(ext)) return '📗';
  if (['png','jpg','jpeg','gif'].includes(ext)) return '🖼️';
  if (ext === 'zip') return '🗜️';
  return '📄';
}

async function openGerenciarEtapas(etapas) {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:480px">
    <h2>⚙️ Etapas da Esteira</h2>
    <div id="etapasList">${etapas.map(e => `
      <div class="cad-item">${e.ordem}. ${esc(e.nome)}
        <button class="ghost del-etapa" data-id="${e.id}">✕</button></div>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <input id="novaEtapa" placeholder="Nome da nova etapa" style="flex:1">
      <button id="btnAddEtapa" class="ghost">Adicionar</button>
    </div>
    <div style="display:flex;justify-content:end;margin-top:14px"><button id="etCancel" class="ghost">Fechar</button></div>
  </div>`;
  document.body.appendChild(div);
  div.querySelector('#etCancel').onclick = () => div.remove();
  div.querySelector('#btnAddEtapa').onclick = async () => {
    const nome = div.querySelector('#novaEtapa').value.trim();
    if (!nome) return;
    const maxOrdem = Math.max(0, ...etapas.map(e => e.ordem));
    await sb.from('etapas_esteira').insert({ nome, ordem: maxOrdem + 10, esteira_tipo: state.esteiraTipo });
    div.remove(); renderEsteira();
  };
  div.querySelectorAll('.del-etapa').forEach(b => b.onclick = async () => {
    const { count } = await sb.from('esteira_processos').select('id', { count: 'exact', head: true }).eq('etapa_atual_id', b.dataset.id).neq('status', 'CONCLUIDO');
    if (count > 0) { alert('Existem processos nesta etapa. Mova-os antes de remover.'); return; }
    await sb.from('etapas_esteira').update({ ativa: false }).eq('id', b.dataset.id);
    div.remove(); renderEsteira();
  });
}

// ---------- REPASSE ----------
async function renderRepasse() {
  if (state.repasseBusca === undefined) state.repasseBusca = '';
  const { data: rowsAll } = await sb.from('clientes').select('*, empreendimentos(nome), analistas(nome)').order('criado_em', { ascending: false }).limit(500);
  const termo = state.repasseBusca.trim().toLowerCase();
  const rows = !termo ? (rowsAll||[]).slice(0,100) : (rowsAll||[]).filter(c =>
    (c.nome||'').toLowerCase().includes(termo) || (c.cpf||'').includes(termo) ||
    (c.unidade||'').toLowerCase().includes(termo) || (c.empreendimentos?.nome||'').toLowerCase().includes(termo));
  const STATUS_REP = ['PROPOSTA','CREDITO','PENDENCIA','CONTRATO','ASSINATURA','REPASSE_CONCLUIDO'];
  const tagCor = (s) => s === 'REPASSE_CONCLUIDO' ? 'CONCLUIDO' : s === 'PENDENCIA' ? 'PENDENTE' : 'RECEBIDO';
  shell(`
    <div class="card filters">
      <div style="flex:1"><label>Buscar (nome, CPF, unidade ou empreendimento)</label><input id="repBusca" value="${esc(state.repasseBusca)}" placeholder="Digite para buscar..."></div>
      <button id="btnRepBuscar">Buscar</button>
      ${state.repasseBusca ? '<button id="btnRepLimpar" class="ghost">Limpar</button>' : ''}
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <h2 style="margin:0">🏦 Gestão de Repasse — cadastro único do cliente ${termo ? `— ${rows.length} resultado(s)` : ''}</h2>
        ${state.role !== 'leitura' ? '<button id="btnNovoCli">+ Novo cliente</button>' : ''}
      </div>
      ${(rows||[]).length ? `<table><thead><tr><th>Cliente</th><th>CPF</th><th>Empreendimento</th><th>Unidade</th><th>Banco</th><th>Responsável</th><th>Status</th><th></th></tr></thead>
      <tbody>${(rows||[]).map(c => `<tr>
        <td>${esc(c.nome)}</td><td>${esc(c.cpf)}</td><td>${esc(c.empreendimentos?.nome)}</td><td>${esc(c.unidade)}</td>
        <td>${esc(c.banco)}</td><td>${esc(c.analistas?.nome)}</td>
        <td><span class="tag ${tagCor(c.status)}">${esc(c.status)}</span></td>
        <td><button class="ghost btnCli" data-id="${c.id}">Abrir</button></td></tr>`).join('')}</tbody></table>`
      : `<div class="ok-box">${termo ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda. O cadastro único alimenta a timeline e os formulários automaticamente.'}</div>`}
    </div>`);
  const btnNovo = document.getElementById('btnNovoCli');
  if (btnNovo) btnNovo.onclick = () => openCliente(null);
  document.querySelectorAll('.btnCli').forEach(b => b.onclick = () => openCliente(b.dataset.id));
  btnRepBuscar.onclick = () => { state.repasseBusca = repBusca.value; renderRepasse(); };
  repBusca.addEventListener('keydown', e => { if (e.key === 'Enter') btnRepBuscar.click(); });
  const bRL = document.getElementById('btnRepLimpar');
  if (bRL) bRL.onclick = () => { state.repasseBusca = ''; renderRepasse(); };

  async function openCliente(id) {
    let c = { status: 'PROPOSTA' }, eventos = [];
    if (id) {
      const [cc, ev] = await Promise.all([
        sb.from('clientes').select('*').eq('id', id).single(),
        sb.from('eventos_repasse').select('*').eq('cliente_id', id).order('data'),
      ]);
      c = cc.data; eventos = ev.data || [];
    }
    const L = state.lookups;
    const ro = state.role === 'leitura' ? 'disabled' : '';
    const div = document.createElement('div');
    div.className = 'modal-bg';
    div.innerHTML = `<div class="modal">
      <h2>${id ? '🏦 ' + esc(c.nome) : '🏦 Novo cliente'}</h2>
      <div class="grid2">
        <div><label>Nome</label><input id="cNome" value="${esc(c.nome)}" ${ro}></div>
        <div><label>CPF</label><input id="cCpf" value="${esc(c.cpf)}" ${ro}></div>
        <div><label>RG</label><input id="cRg" value="${esc(c.rg)}" ${ro}></div>
        <div><label>Estado civil</label><input id="cEc" value="${esc(c.estado_civil)}" ${ro}></div>
        <div><label>Renda (R$)</label><input id="cRenda" type="number" value="${c.renda ?? ''}" ${ro}></div>
        <div><label>Telefone 1</label><input id="cTel1" value="${esc(c.telefone1)}" ${ro}></div>
        <div><label>Telefone 2</label><input id="cTel2" value="${esc(c.telefone2)}" ${ro}></div>
        <div><label>E-mail</label><input id="cEmail" value="${esc(c.email)}" ${ro}></div>
        <div style="grid-column:1/-1"><label>Endereço</label><input id="cEnd" value="${esc(c.endereco)}" style="width:100%" ${ro}></div>
        <div><label>Banco</label><input id="cBanco" value="${esc(c.banco)}" ${ro}></div>
        <div><label>Correspondente</label><input id="cCorr" value="${esc(c.correspondente)}" ${ro}></div>
        <div><label>Empreendimento</label><select id="cEmp" ${ro}><option value=""></option>
          ${L.empreendimentos.map(e=>`<option value="${e.id}" ${c.empreendimento_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select></div>
        <div><label>Unidade</label><input id="cUnid" value="${esc(c.unidade)}" ${ro}></div>
        <div><label>Imobiliária</label><input id="cImob" value="${esc(c.imobiliaria)}" ${ro}></div>
        <div><label>Corretor</label><input id="cCorretor" value="${esc(c.corretor)}" ${ro}></div>
        <div><label>Responsável</label><select id="cResp" ${ro}><option value=""></option>
          ${L.analistas.map(a=>`<option value="${a.id}" ${c.responsavel_id===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>
        <div><label>Status</label><select id="cStatus" ${ro}>
          ${STATUS_REP.map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div style="grid-column:1/-1"><label>Observações</label><input id="cObs" value="${esc(c.obs)}" style="width:100%" ${ro}></div>
      </div>
      ${id ? `
      <h2 style="margin-top:16px">🕓 Timeline</h2>
      <div class="timeline">${eventos.map(e => `
        <div class="tl-item"><div class="tl-dot"></div>
          <div><b>${new Date(e.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</b> — ${esc(e.evento)}
          ${e.autor ? `<span style="color:var(--muted);font-size:11px"> · ${esc(e.autor)}</span>` : ''}</div></div>`).join('')}
      </div>
      ${state.role !== 'leitura' ? `<div style="display:flex;gap:8px;margin-top:8px">
        <input id="cNovoEv" placeholder="Registrar evento manual (ex.: Documentação recebida)" style="flex:1">
        <button id="cAddEv" class="ghost">Registrar</button>
      </div>` : ''}` : ''}
      <div style="display:flex;gap:8px;margin-top:14px;justify-content:end">
        <button id="cCancel" class="ghost">Fechar</button>
        ${state.role !== 'leitura' ? '<button id="cSave">Salvar</button>' : ''}
      </div>
      <div class="msg" id="cMsg"></div>
    </div>`;
    document.body.appendChild(div);
    const $ = (i) => div.querySelector('#' + i);
    $('cCancel').onclick = () => div.remove();
    const addEv = $('cAddEv');
    if (addEv) addEv.onclick = async () => {
      if (!$('cNovoEv').value.trim()) return;
      await sb.from('eventos_repasse').insert({ cliente_id: id, evento: $('cNovoEv').value.trim(), autor: state.session?.user?.email });
      div.remove(); openCliente(id);
    };
    const save = $('cSave');
    if (save) save.onclick = async () => {
      const rec = {
        nome: $('cNome').value.trim(), cpf: $('cCpf').value || null, rg: $('cRg').value || null,
        estado_civil: $('cEc').value || null, renda: $('cRenda').value ? Number($('cRenda').value) : null,
        telefone1: $('cTel1').value || null, telefone2: $('cTel2').value || null,
        email: $('cEmail').value || null, endereco: $('cEnd').value || null,
        banco: $('cBanco').value || null, correspondente: $('cCorr').value || null,
        empreendimento_id: $('cEmp').value || null, unidade: $('cUnid').value || null,
        imobiliaria: $('cImob').value || null, corretor: $('cCorretor').value || null,
        responsavel_id: $('cResp').value || null, status: $('cStatus').value,
        obs: $('cObs').value || null,
      };
      if (!rec.nome) { $('cMsg').textContent = 'Informe o nome.'; return; }
      const r = id ? await sb.from('clientes').update(rec).eq('id', id) : await sb.from('clientes').insert(rec);
      if (r.error) { $('cMsg').textContent = r.error.message; return; }
      div.remove(); renderRepasse();
    };
  }
}

// ---------- EXPORTAR PLANILHA COMPLETA (todas as abas, formato da planilha mãe) ----------
async function exportarPlanilhaCompleta() {
  const btn = document.getElementById('btnExportAll');
  const original = btn.textContent;
  btn.textContent = 'Gerando...'; btn.disabled = true;
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const [dem, an, empdoras, empt, ativ, esc_] = await Promise.all([
      sb.from('demandas').select('numero,numero_processo,recebido_em,proponente1_nome,proponente1_cpf,proponente2_nome,proponente2_cpf,unidade,status,concluido_em,fat_mensal,valor_proposta,obs,analistas(nome),empreendedoras(nome),empreendimentos(nome),atividades(nome)').order('recebido_em'),
      sb.from('analistas').select('nome,status').order('nome'),
      sb.from('empreendedoras').select('nome').order('nome'),
      sb.from('empreendimentos').select('nome,empreendedoras(nome)').order('nome'),
      sb.from('atividades').select('nome,ativa').order('nome'),
      sb.from('escala_plantao').select('data,analistas(nome)').order('data'),
    ]);
    const wb = XLSX.utils.book_new();
    const demRows = (dem.data||[]).map(r => ({
      'Nº': r.numero, 'Nº PROCESSO': r.numero_processo, 'DATA RECEB.': fmtDt(r.recebido_em),
      'NOME 1° PROPONENTE': r.proponente1_nome, 'CPF 1° PROPONENTE': r.proponente1_cpf,
      'NOME 2° PROPONENTE': r.proponente2_nome, 'CPF 2° PROPONENTE': r.proponente2_cpf,
      'EMPREENDEDORA': r.empreendedoras?.nome, 'EMPREENDIMENTO': r.empreendimentos?.nome, 'UNIDADE': r.unidade,
      'PRESTAÇÃO DE SERVIÇO': r.atividades?.nome, 'RESPONS. ATIVIDADE': r.analistas?.nome,
      'STATUS': r.status, 'DATA/HORA CONCL.': fmtDt(r.concluido_em), 'FAT. MENSAL': r.fat_mensal ? 'SIM' : 'NÃO',
      'VALOR DA PROPOSTA': r.valor_proposta, 'OBS': r.obs,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(demRows), 'DEMANDA');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((an.data||[]).map(a=>({ANALISTA:a.nome,STATUS:a.status}))), 'ANALISTAS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((empdoras.data||[]).map(e=>({EMPREENDEDORA:e.nome}))), 'EMPREENDEDORAS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((empt.data||[]).map(e=>({EMPREENDIMENTO:e.nome,EMPREENDEDORA:e.empreendedoras?.nome}))), 'EMPREENDIMENTOS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((ativ.data||[]).map(a=>({ATIVIDADE:a.nome,ATIVA:a.ativa?'SIM':'NÃO'}))), 'ATIVIDADES');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((esc_.data||[]).map(e=>({DATA:e.data,ANALISTA:e.analistas?.nome}))), 'ESCALA-2026');
    XLSX.writeFile(wb, `planilha-controle-${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (e) {
    alert('Erro ao gerar planilha: ' + e.message);
  } finally {
    btn.textContent = original; btn.disabled = false;
  }
}

// ---------- DEFINIR SENHA (link de convite / recuperação) ----------
function renderDefinirSenha(email, msg = '') {
  app.innerHTML = `
  <div id="login-page">
    <div class="login-hero">
      <div class="hero-badge">✉️ CONVITE</div>
      <h1>Bem-vindo(a) à<br>Secretaria de Vendas<br><span>Neo Service.</span></h1>
      <p class="hero-sub">Você foi convidado(a) para acessar o painel interno da equipe. Crie sua senha para começar.</p>
    </div>
    <div class="login-panel">
      <div class="card" id="login-card">
        <div class="login-icon">🔑</div>
        <h2>Criar sua senha</h2>
        <div class="login-brandline">${esc(email || '')}</div>
        <div class="sub">Escolha uma senha para acessar o sistema</div>
        <label>Nova senha</label>
        <div class="input-ic"><span>🔒</span><input id="novaSenha" type="password" placeholder="mín. 6 caracteres"></div>
        <label>Confirmar senha</label>
        <div class="input-ic"><span>🔒</span><input id="confSenha" type="password" placeholder="repita a senha"></div>
        <button id="btnDefinirSenha">Criar senha e entrar →</button>
        <div class="msg">${esc(msg)}</div>
      </div>
    </div>
    <div class="login-copyright">Neo Service © ${new Date().getFullYear()} · Sistema interno · Uso exclusivo da equipe</div>
  </div>`;
  btnDefinirSenha.onclick = async () => {
    const s1 = novaSenha.value, s2 = confSenha.value;
    if (!s1 || s1.length < 6) { renderDefinirSenha(email, 'A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (s1 !== s2) { renderDefinirSenha(email, 'As senhas não coincidem.'); return; }
    const { error } = await sb.auth.updateUser({ password: s1 });
    if (error) { renderDefinirSenha(email, error.message); return; }
    history.replaceState(null, '', window.location.pathname);
    init();
  };
}

async function init() {
  // usuário chegou por link de convite/recuperação: precisa criar a senha antes de entrar
  const hash = window.location.hash;
  if (hash.includes('type=invite') || hash.includes('type=recovery')) {
    const { data: { session } } = await sb.auth.getSession();
    if (session) { renderDefinirSenha(session.user.email); return; }
  }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { renderLogin(); return; }
  state.session = session;
  // garante perfil e carrega nível de acesso
  await sb.from('perfis').upsert({ user_id: session.user.id, email: session.user.email }, { onConflict: 'user_id', ignoreDuplicates: true });
  const { data: perfil } = await sb.from('perfis').select('role,nome,ativo').eq('user_id', session.user.id).single();
  if (perfil?.ativo === false) {
    await sb.auth.signOut();
    renderLogin('Sua conta foi desativada. Fale com o administrador do sistema.');
    return;
  }
  state.role = perfil?.role || 'analista';
  state.perfilNome = perfil?.nome || '';
  if (!podeVer(state.view)) state.view = 'pipeline';
  await loadLookups();
  render();
}
init();
