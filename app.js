// Gestão Setor de Secretaria de Vendas - Neo Service — deploy automático via GitHub + Netlify
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sb = createClient(
  'https://dbhqgxdsbploioujmqrs.supabase.co',
  'sb_publishable_NEGrJ-b5PT0ol3DBwFHn4g_4aGgQBLg'
);

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
        <div class="login-divider"><span>ou</span></div>
        <button id="btnSignup" class="ghost">Criar conta</button>
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
  btnSignup.onclick = async () => {
    if (!valida()) return;
    const { error } = await sb.auth.signUp({ email: email.value.trim(), password: senha.value });
    renderLogin(error ? error.message : 'Conta criada! Confirme pelo link enviado ao seu e-mail e depois clique em Entrar.', error ? 'erro' : 'ok');
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
    ['producao', '📅', 'Produção'],
    ['analytics', '📉', 'Analytics'],
    ['insights', '💡', 'Insights'],
  ]],
  ['⚙️ Operação', [
    ['pipeline', '🔄', 'Pipeline'],
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
    ['fechamento', '💰', 'Fechamento'],
    ['escala', '📅', 'Escala'],
    ['cadastros', '🛠️', 'Administração'],
  ]],
];
function shell(inner) {
  app.innerHTML = `
  <div class="layout">
    <aside>
      <div class="side-brand"><span class="logo">🏢</span><div><b>Secretaria de Vendas</b><small>Neo Service</small></div></div>
      ${PILARES.map(([grp, items]) => `
        <div class="side-group">${grp}</div>
        ${items.map(([v, ic, l]) => `<button class="side-item ${state.view===v?'active':''}" data-v="${v}"><span>${ic}</span>${l}</button>`).join('')}
      `).join('')}
      <div class="side-footer">
        <button id="btnExportAll" class="ghost">⬇ Exportar planilha</button>
        <button id="btnSair" class="ghost">Sair</button>
      </div>
    </aside>
    <main>${inner}</main>
  </div>`;
  document.querySelectorAll('.side-item').forEach(b => b.onclick = () => { state.view = b.dataset.v; render(); });
  btnSair.onclick = async () => { await sb.auth.signOut(); renderLogin(); };
  btnExportAll.onclick = exportarPlanilhaCompleta;
}
function render() {
  ({ dashboard: renderDashboard, producao: renderProducao, analytics: renderAnalytics, insights: renderInsights,
     pipeline: renderDemandas, operacoes: renderOperacoes, repasse: renderRepasse, validacao: renderValidacao,
     followup: renderFollowup, integracoes: () => renderStub('🔌 Integrações', 'Conecte Anapro, Mega, Sienge, bancos e assinatura digital. Cada integração aparecerá aqui com status de conexão e última sincronização.', ['Anapro — entrada automática de propostas', 'Mega / Sienge — ERP', 'Bancos — status de análise de crédito', 'Assinatura digital — acompanhamento de envelopes']),
     automacoes: () => renderStub('⚡ Automações', 'Regras de negócio e fluxos automáticos. A primeira automação ativa é o monitoramento de plantão (veja Insights). Próximas:', ['Alerta automático por e-mail/Teams às 12h e 17h', 'Distribuição automática de processos por carga de trabalho', 'Cobrança automática de follow-up sem resposta', 'Fechamento mensal gerado e enviado automaticamente']),
     documentos: () => renderStub('📄 Documentos', 'Repositório de contratos, minutas, anexos e modelos vinculados a cada processo.', ['Upload de anexos por processo', 'Modelos de contrato por empreendedora', 'Histórico de versões']),
     chamados: renderChamados, fechamento: renderFechamento, escala: renderEscala,
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
  const [an, emp, ativ, empr] = await Promise.all([
    sb.from('analistas').select('id,nome,status').order('nome'),
    sb.from('empreendedoras').select('id,nome').order('nome'),
    sb.from('atividades').select('id,nome,ativa').order('nome'),
    sb.from('empreendimentos').select('id,nome,empreendedora_id').order('nome'),
  ]);
  state.lookups = { analistas: an.data||[], empreendedoras: emp.data||[], atividades: ativ.data||[], empreendimentos: empr.data||[] };
}

// ---------- DASHBOARD ----------
async function renderDashboard() {
  const [{ data: vol }, rkAll] = await Promise.all([
    sb.from('volume_mensal').select('*'),
    sb.from('ranking_analistas').select('*'),
  ]);
  const meses = [...new Set((rkAll.data||[]).map(r => r.mes.slice(0,7)))].sort().reverse();
  if (!state.dashMes && meses.length) state.dashMes = meses[0];
  const rk = (rkAll.data||[]).filter(r => r.mes.slice(0,7) === state.dashMes)
    .sort((a,b) => b.total - a.total);
  const totAll = (vol||[]).reduce((s,v)=>s+v.total,0);
  const concAll = (vol||[]).reduce((s,v)=>s+v.concluidas,0);
  const last12 = (vol||[]).slice(-12);
  const max = Math.max(...last12.map(v=>v.total), 1);

  shell(`
    <div class="kpis">
      <div class="kpi"><div class="v">${totAll}</div><div class="l">📋 Total de processos</div></div>
      <div class="kpi"><div class="v" style="color:var(--ok)">${concAll}</div><div class="l">✅ Concluídos</div></div>
      <div class="kpi"><div class="v" style="color:var(--warn)">${totAll-concAll}</div><div class="l">⚠️ Pendentes</div></div>
      <div class="kpi"><div class="v" style="color:var(--accent)">${totAll?(100*concAll/totAll).toFixed(1):0}%</div><div class="l">📊 % conclusão</div></div>
    </div>
    <div class="card">
      <h2>Volume mensal (últimos 12 meses)</h2>
      <div class="chart">${last12.map(v => `
        <div class="bar-wrap" title="${mesLabel(v.mes.slice(0,7))}: ${v.total}">
          <div class="bar-val">${v.total}</div>
          <div class="bar" style="height:${Math.round(140*v.total/max)}px"></div>
          <div class="bar-lbl">${mesLabel(v.mes.slice(0,7))}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <h2 style="margin:0">🏆 Ranking de produtividade</h2>
        <select id="dashMes">${meses.map(m=>`<option value="${m}" ${m===state.dashMes?'selected':''}>${mesLabel(m)}</option>`).join('')}</select>
      </div>
      <table><thead><tr><th>#</th><th>Analista</th><th>Total</th><th>Concluídos</th><th>Pendentes</th><th>% Concl.</th><th>Tempo médio (h)</th></tr></thead>
      <tbody>${rk.map((r,i) => `<tr>
        <td>${['🥇','🥈','🥉'][i] ?? (i+1)}</td><td>${esc(r.nome)}</td><td>${r.total}</td>
        <td style="color:var(--ok)">${r.concluidas}</td><td style="color:var(--warn)">${r.pendentes}</td>
        <td>${r.pct_concl}%</td><td>${r.tempo_medio_h ?? '—'}</td>
      </tr>`).join('') || '<tr><td colspan="7">Sem dados neste mês.</td></tr>'}</tbody></table>
    </div>`);
  document.getElementById('dashMes').onchange = (e) => { state.dashMes = e.target.value; renderDashboard(); };
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
  const [{ data: al }, { data: sla }, { data: tops }] = await Promise.all([
    sb.from('alerta_hoje').select('*'),
    sb.from('insights_sla').select('*'),
    sb.from('top_empreendedoras').select('*').limit(8),
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
    </div>
    <div class="card">
      <h2>🏢 Empreendedoras com maior volume</h2>
      <table><thead><tr><th>Empreendedora</th><th>Total</th><th>Pendentes</th></tr></thead>
      <tbody>${(tops||[]).map(t => `<tr><td>${esc(t.nome)}</td><td>${t.total}</td>
        <td style="color:${t.pendentes?'var(--warn)':'var(--muted)'}">${t.pendentes}</td></tr>`).join('')}</tbody></table>
    </div>`);
}

// ---------- ANALYTICS ----------
async function renderAnalytics() {
  const [rkAll, { data: ativs }, { data: tops }] = await Promise.all([
    sb.from('ranking_analistas').select('*'),
    sb.from('volume_atividades').select('*').limit(10),
    sb.from('top_empreendedoras').select('*').limit(10),
  ]);
  const meses = [...new Set((rkAll.data||[]).map(r => r.mes.slice(0,7)))].sort().reverse();
  if (!state.dashMes && meses.length) state.dashMes = meses[0];
  const rk = (rkAll.data||[]).filter(r => r.mes.slice(0,7) === state.dashMes).sort((a,b) => b.total - a.total);
  const maxA = Math.max(...(ativs||[]).map(a=>a.total), 1);
  shell(`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <h2 style="margin:0">🏆 Produtividade por analista</h2>
        <select id="dashMes">${meses.map(m=>`<option value="${m}" ${m===state.dashMes?'selected':''}>${mesLabel(m)}</option>`).join('')}</select>
      </div>
      <table><thead><tr><th>#</th><th>Analista</th><th>Total</th><th>Concluídos</th><th>Pendentes</th><th>% Concl.</th><th>Tempo médio (h)</th></tr></thead>
      <tbody>${rk.map((r,i) => `<tr>
        <td>${['🥇','🥈','🥉'][i] ?? (i+1)}</td><td>${esc(r.nome)}</td><td>${r.total}</td>
        <td style="color:var(--ok)">${r.concluidas}</td><td style="color:var(--warn)">${r.pendentes}</td>
        <td>${r.pct_concl}%</td><td>${r.tempo_medio_h ?? '—'}</td></tr>`).join('') || '<tr><td colspan="7">Sem dados neste mês.</td></tr>'}</tbody></table>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📝 Atividades mais realizadas</h2>
        ${(ativs||[]).map(a => `<div class="hbar-row"><span class="hbar-lbl">${esc(a.nome)}</span>
          <div class="hbar"><div style="width:${Math.round(100*a.total/maxA)}%"></div></div>
          <b>${a.total}</b></div>`).join('')}
      </div>
      <div class="card">
        <h2>🏢 Volume por empreendedora</h2>
        <table><thead><tr><th>Empreendedora</th><th>Total</th><th>Pendentes</th></tr></thead>
        <tbody>${(tops||[]).map(t => `<tr><td>${esc(t.nome)}</td><td>${t.total}</td><td>${t.pendentes}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>`);
  document.getElementById('dashMes').onchange = (e) => { state.dashMes = e.target.value; renderAnalytics(); };
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
  const { data: fups } = await sb.from('fups')
    .select('id,criado_em,autor,texto,demanda_id,demandas(numero,proponente1_nome,status)')
    .order('criado_em', { ascending: false }).limit(60);
  shell(`
    <div class="card">
      <h2>💬 Follow-ups recentes</h2>
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
        </div>`).join('') : '<div class="ok-box">Nenhum follow-up registrado ainda.</div>'}
    </div>`);
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
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

// ---------- CADASTROS / ADMINISTRAÇÃO ----------
async function renderCadastros() {
  const L = state.lookups;
  const { data: usuarios } = await sb.from('perfis').select('*').order('criado_em');
  const usersBloco = `
    <div class="card">
      <h2>👤 Usuários e níveis de acesso</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">
        <b>admin</b>: tudo, inclusive metas e usuários · <b>analista</b>: opera o sistema · <b>leitura</b>: só visualiza.
        ${state.role === 'admin' ? 'Novos usuários criam conta na tela de login (ou você cria no painel Supabase) e aparecem aqui para você definir o nível.' : ''}
      </p>
      ${state.role === 'admin' ? `
      <div class="filters" style="margin-bottom:14px;padding:12px;background:var(--bg2);border-radius:10px">
        <div><label>E-mail do novo usuário</label><input id="nuEmail" type="email" placeholder="pessoa@empresa.com"></div>
        <div><label>Senha inicial</label><input id="nuSenha" type="text" placeholder="mín. 6 caracteres"></div>
        <div><label>Nível</label><select id="nuNivel">
          <option value="analista">analista</option><option value="admin">admin</option><option value="leitura">leitura</option>
        </select></div>
        <button id="btnCriarUser">+ Criar usuário</button>
        <span id="nuMsg" class="msg" style="margin:0"></span>
      </div>` : ''}
      <table><thead><tr><th>E-mail</th><th>Nível</th><th>Desde</th></tr></thead>
      <tbody>${(usuarios||[]).map(u => `<tr>
        <td>${esc(u.email)}${u.user_id === state.session.user.id ? ' <span class="tag RECEBIDO">você</span>' : ''}</td>
        <td>${state.role === 'admin' && u.user_id !== state.session.user.id
          ? `<select class="selRole" data-uid="${u.user_id}">
              ${['admin','analista','leitura'].map(r=>`<option ${u.role===r?'selected':''}>${r}</option>`).join('')}</select>`
          : `<span class="tag ${u.role==='admin'?'CONCLUIDO':u.role==='leitura'?'PENDENTE':'RECEBIDO'}">${esc(u.role)}</span>`}</td>
        <td>${fmtDt(u.criado_em)}</td></tr>`).join('')}</tbody></table>
    </div>`;
  const bloco = (titulo, items, tipo, extra) => `
    <div class="card">
      <h2>${titulo}</h2>
      <div class="cad-list">${items.map(i => `
        <div class="cad-item">${esc(i.nome)}${extra ? extra(i) : ''}
          <button class="ghost cad-edit" data-t="${tipo}" data-id="${i.id}" data-n="${esc(i.nome)}">✎</button>
        </div>`).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <input id="new_${tipo}" placeholder="Novo nome..." style="flex:1">
        ${tipo === 'empreendimentos' ? `<select id="new_emp_ed">${L.empreendedoras.map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select>` : ''}
        <button class="ghost cad-add" data-t="${tipo}">Adicionar</button>
      </div>
    </div>`;
  shell(`
    ${usersBloco}
    <div class="grid-cad">
      ${bloco('👥 Analistas', L.analistas, 'analistas', i => ` <span class="tag ${i.status==='Ativo'?'CONCLUIDO':'PENDENTE'}">${esc(i.status)}</span>`)}
      ${bloco('🏢 Empreendedoras', L.empreendedoras, 'empreendedoras')}
      ${bloco('🏗️ Empreendimentos', L.empreendimentos.map(e => ({...e, nome: e.nome + (L.empreendedoras.find(x=>x.id===e.empreendedora_id) ? ' · ' + L.empreendedoras.find(x=>x.id===e.empreendedora_id).nome : '')})), 'empreendimentos')}
      ${bloco('📝 Atividades', L.atividades, 'atividades', i => i.ativa ? '' : ' <span class="tag PENDENTE">inativa</span>')}
    </div>`);
  document.querySelectorAll('.selRole').forEach(s => s.onchange = async () => {
    const { error } = await sb.from('perfis').update({ role: s.value }).eq('user_id', s.dataset.uid);
    if (error) alert(error.message);
  });
  const btnCU = document.getElementById('btnCriarUser');
  if (btnCU) btnCU.onclick = async () => {
    const email = nuEmail.value.trim(), senha = nuSenha.value, nivel = nuNivel.value;
    const msg = document.getElementById('nuMsg');
    if (!email || !senha) { msg.textContent = 'Preencha e-mail e senha.'; return; }
    btnCU.disabled = true; msg.textContent = 'Criando...';
    const { data, error } = await sb.functions.invoke('criar-usuario', { body: { email, senha, nivel } });
    btnCU.disabled = false;
    if (error || data?.error) { msg.textContent = data?.error || error.message; return; }
    msg.textContent = '';
    renderCadastros();
  };
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

// ---------- PRODUÇÃO (análise avançada + metas) ----------
function svgLine(points, w, h, color, dash) {
  if (!points.length) return '';
  const xs = points.map((_, i) => i / Math.max(points.length - 1, 1) * (w - 20) + 10);
  const max = Math.max(...points, 1);
  const ys = points.map(v => h - 14 - (v / max) * (h - 28));
  return `<polyline fill="none" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ''} points="${xs.map((x, i) => x + ',' + ys[i]).join(' ')}"/>`;
}
async function renderProducao() {
  const [{ data: pd }, { data: pad }, { data: solo }, { data: metaF }, { data: cfg }] = await Promise.all([
    sb.from('producao_diaria').select('*'),
    sb.from('producao_analista_dia').select('*'),
    sb.from('fds_solo').select('*'),
    sb.from('metas_fds').select('*'),
    sb.from('metas_config').select('*'),
  ]);
  const dias = pd || [];
  const ult60 = dias.slice(-60);
  // semanas (ISO): agrupar por segunda-feira
  const semanas = {};
  dias.forEach(d => {
    const dt = new Date(d.dia + 'T12:00');
    const seg = new Date(dt); seg.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    const k = seg.toISOString().slice(0, 10);
    const s = semanas[k] = semanas[k] || { total: 0, fds: 0 };
    s.total += d.total;
    if (d.dow >= 6) s.fds += d.total;
  });
  const semKeys = Object.keys(semanas).sort();
  const semVals = semKeys.map(k => semanas[k].total);
  const ult12sem = semKeys.slice(-12);
  // média móvel de 7 dias
  const mm7 = ult60.map((_, i) => {
    const win = ult60.slice(Math.max(0, i - 6), i + 1);
    return win.reduce((s, x) => s + x.total, 0) / win.length;
  });
  // dia da semana
  const dowNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const porDow = [1,2,3,4,5,6,7].map(dw => {
    const ds = dias.filter(d => d.dow == dw);
    return ds.length ? Math.round(ds.reduce((s, x) => s + x.total, 0) / ds.length * 10) / 10 : 0;
  });
  const maxDow = Math.max(...porDow, 1);
  // fds %
  const totalGeral = dias.reduce((s, d) => s + d.total, 0);
  const totalFds = dias.filter(d => d.dow >= 6).reduce((s, d) => s + d.total, 0);
  // capacidade solo por analista
  const soloPorAnalista = {};
  (solo || []).forEach(s => {
    const a = soloPorAnalista[s.analista] = soloPorAnalista[s.analista] || { n: 0, tot: 0 };
    a.n++; a.tot += s.producao;
  });
  // tendência: últimas 2 semanas completas
  const tend = semVals.length >= 3 ? semVals[semVals.length - 2] - semVals[semVals.length - 3] : 0;
  const meta = (metaF || [])[0] || {};
  const cfgMap = {}; (cfg || []).forEach(c => cfgMap[c.id] = c.valor);
  // status da meta do dia (hoje)
  const hojeStr = new Date().toISOString().slice(0, 10);
  const prodHoje = (dias.find(d => d.dia === hojeStr) || {}).total || 0;
  const metaDia = cfgMap.diaria || 0;
  const pctDia = metaDia ? Math.round(100 * prodHoje / metaDia) : null;
  const farol = (p) => p === null ? '—' : p >= 100 ? '🟢 Dentro da meta' : p >= 70 ? '🟡 Atenção' : '🔴 Fora da meta';

  shell(`
    <div class="kpis">
      <div class="kpi"><div class="v">${prodHoje}</div><div class="l">📥 Produção hoje ${metaDia ? '/ meta ' + metaDia : ''}</div></div>
      <div class="kpi"><div class="v">${pctDia !== null ? pctDia + '%' : '—'}</div><div class="l">${farol(pctDia)}</div></div>
      <div class="kpi"><div class="v" style="color:${tend >= 0 ? 'var(--ok)' : 'var(--err)'}">${tend >= 0 ? '▲' : '▼'} ${Math.abs(tend)}</div><div class="l">Tendência semanal</div></div>
      <div class="kpi"><div class="v">${totalGeral ? Math.round(100 * totalFds / totalGeral) : 0}%</div><div class="l">🗓️ Peso do fim de semana</div></div>
    </div>
    <div class="card">
      <h2>📈 Produção diária (últimos 60 dias) + média móvel 7d</h2>
      <svg viewBox="0 0 700 180" style="width:100%;height:180px">
        ${svgLine(ult60.map(d => d.total), 700, 180, 'url(#g1)' , false)}
        ${svgLine(mm7, 700, 180, '#ffb84d', true)}
        <defs><linearGradient id="g1"><stop offset="0%" stop-color="#6d8bff"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>
      </svg>
      <div style="font-size:12px;color:var(--muted)">— produção diária &nbsp;&nbsp; ‑ ‑ média móvel 7 dias</div>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📊 Acumulado semanal (últimas 12 semanas)</h2>
        ${ult12sem.map(k => { const v = semanas[k]; const maxS = Math.max(...ult12sem.map(x => semanas[x].total), 1);
          return `<div class="hbar-row"><span class="hbar-lbl">${new Date(k+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
          <div class="hbar"><div style="width:${Math.round(100*v.total/maxS)}%"></div></div><b>${v.total}</b>
          <span style="color:var(--muted);font-size:11px">(fds: ${v.fds})</span></div>`; }).join('')}
      </div>
      <div class="card">
        <h2>📆 Média por dia da semana</h2>
        ${dowNames.map((n, i) => `<div class="hbar-row"><span class="hbar-lbl">${n}</span>
          <div class="hbar"><div style="width:${Math.round(100*porDow[i]/maxDow)}%"></div></div><b>${porDow[i]}</b></div>`).join('')}
        <p style="color:var(--muted);font-size:12px;margin-top:8px">Melhor dia: <b>${dowNames[porDow.indexOf(Math.max(...porDow))]}</b> · Menor: <b>${dowNames[porDow.indexOf(Math.min(...porDow.filter(x=>x>0)))]}</b></p>
      </div>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>🧍 Capacidade real — fim de semana com 1 analista</h2>
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Considera apenas dias de sáb/dom em que um único analista produziu (${(solo||[]).length} dias no histórico).</p>
        ${Object.keys(soloPorAnalista).length ? `<table><thead><tr><th>Analista</th><th>Dias solo</th><th>Média/dia</th></tr></thead>
        <tbody>${Object.entries(soloPorAnalista).sort((a,b)=>b[1].tot/b[1].n-a[1].tot/a[1].n).map(([n,x]) =>
          `<tr><td>${esc(n)}</td><td>${x.n}</td><td><b>${Math.round(x.tot/x.n*10)/10}</b></td></tr>`).join('')}</tbody></table>`
        : '<div class="msg">Sem fins de semana com analista único no histórico.</div>'}
      </div>
      <div class="card">
        <h2>🎯 Metas de fim de semana (automáticas)</h2>
        <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Calculadas do histórico de ${meta.amostras || 0} fins de semana solo.</p>
        <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
          <div class="kpi"><div class="v" style="color:var(--warn)">${meta.meta_minima ?? '—'}</div><div class="l">Meta mínima</div></div>
          <div class="kpi"><div class="v" style="color:var(--accent)">${meta.meta_esperada ?? '—'}</div><div class="l">Meta esperada</div></div>
          <div class="kpi"><div class="v" style="color:var(--ok)">${meta.meta_excelente ?? '—'}</div><div class="l">Meta excelente</div></div>
        </div>
        ${state.role === 'admin' ? `
        <h2 style="margin-top:14px">⚙️ Metas configuráveis</h2>
        <div class="filters">
          ${['diaria','semanal','mensal'].map(k => `<div><label>Meta ${k}</label><input id="meta_${k}" type="number" value="${cfgMap[k] ?? ''}" style="min-width:100px"></div>`).join('')}
          <button id="btnSalvarMetas">Salvar</button>
        </div>` : ''}
      </div>
    </div>`);
  if (state.role === 'admin') {
    const btn = document.getElementById('btnSalvarMetas');
    if (btn) btn.onclick = async () => {
      for (const k of ['diaria','semanal','mensal']) {
        const v = document.getElementById('meta_' + k).value;
        if (v) await sb.from('metas_config').upsert({ id: k, valor: Number(v), atualizado_em: new Date().toISOString() });
      }
      renderProducao();
    };
  }
}

// ---------- REPASSE ----------
async function renderRepasse() {
  const { data: rows } = await sb.from('clientes').select('*, empreendimentos(nome), analistas(nome)').order('criado_em', { ascending: false }).limit(100);
  const STATUS_REP = ['PROPOSTA','CREDITO','PENDENCIA','CONTRATO','ASSINATURA','REPASSE_CONCLUIDO'];
  const tagCor = (s) => s === 'REPASSE_CONCLUIDO' ? 'CONCLUIDO' : s === 'PENDENCIA' ? 'PENDENTE' : 'RECEBIDO';
  shell(`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <h2 style="margin:0">🏦 Gestão de Repasse — cadastro único do cliente</h2>
        ${state.role !== 'leitura' ? '<button id="btnNovoCli">+ Novo cliente</button>' : ''}
      </div>
      ${(rows||[]).length ? `<table><thead><tr><th>Cliente</th><th>CPF</th><th>Empreendimento</th><th>Unidade</th><th>Banco</th><th>Responsável</th><th>Status</th><th></th></tr></thead>
      <tbody>${(rows||[]).map(c => `<tr>
        <td>${esc(c.nome)}</td><td>${esc(c.cpf)}</td><td>${esc(c.empreendimentos?.nome)}</td><td>${esc(c.unidade)}</td>
        <td>${esc(c.banco)}</td><td>${esc(c.analistas?.nome)}</td>
        <td><span class="tag ${tagCor(c.status)}">${esc(c.status)}</span></td>
        <td><button class="ghost btnCli" data-id="${c.id}">Abrir</button></td></tr>`).join('')}</tbody></table>`
      : '<div class="ok-box">Nenhum cliente cadastrado ainda. O cadastro único alimenta a timeline e os formulários automaticamente.</div>'}
    </div>`);
  const btnNovo = document.getElementById('btnNovoCli');
  if (btnNovo) btnNovo.onclick = () => openCliente(null);
  document.querySelectorAll('.btnCli').forEach(b => b.onclick = () => openCliente(b.dataset.id));

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

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { renderLogin(); return; }
  state.session = session;
  // garante perfil e carrega nível de acesso
  await sb.from('perfis').upsert({ user_id: session.user.id, email: session.user.email }, { onConflict: 'user_id', ignoreDuplicates: true });
  const { data: perfil } = await sb.from('perfis').select('role,nome').eq('user_id', session.user.id).single();
  state.role = perfil?.role || 'analista';
  await loadLookups();
  render();
}
init();
