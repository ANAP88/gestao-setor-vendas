// Gestão Setor de Secretaria de Vendas - Neo Service — deploy automático via GitHub + Netlify
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { CONFIG } from './config.js';

// Ambiente de TESTE: qualquer site que não seja o domínio de produção usa o schema "staging"
// (mesmo banco, dados copiados, isolado do que a equipe usa de verdade).
const EH_STAGING = location.hostname !== 'secretaria-vendas-gestao.netlify.app';
// Porta de entrada exclusiva para incorporadoras: /portal na URL (ou ?portal, por compatibilidade com links já enviados)
const EH_PORTAL_LOGIN = location.pathname.replace(/\/$/, '') === '/portal' || new URLSearchParams(location.search).has('portal');
const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey,
  EH_STAGING ? { db: { schema: 'staging' } } : {});

function svgIcon(path) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">${path}</svg>`;
}
const ICONES = {
  inicio: svgIcon('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>'),
  pipeline: svgIcon('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>'),
  esteira: svgIcon('<path d="M12 2 3 6.5 12 11l9-4.5Z"/><path d="M3 12 12 16.5 21 12"/><path d="M3 17 12 21.5 21 17"/>'),
  qualidade: svgIcon('<path d="M4 12a8 8 0 0 1 14.5-4.6M20 4v4.4h-4.4"/><path d="M20 12a8 8 0 0 1-14.5 4.6M4 20v-4.4h4.4"/>'),
  chamados: svgIcon('<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z"/>'),
  operacoes: svgIcon('<path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>'),
  repasse: svgIcon('<path d="M3 10 12 4l9 6"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 19h18"/>'),
  fluxogramas: svgIcon('<path d="M9 3 3 5.5v15L9 18l6 2.5 6-2.5v-15L15 5.5 9 3Z"/><path d="M9 3v15M15 5.5v15"/>'),
  followup: svgIcon('<path d="M8 10h8M8 14h5"/><path d="M21 12a8.5 8.5 0 0 1-11.8 7.8L4 21l1.3-4.9A8.5 8.5 0 1 1 21 12Z"/>'),
  integracoes: svgIcon('<path d="M10 13a4 4 0 0 0 5.7.3l2.5-2.5a4 4 0 0 0-5.6-5.6L11 6.6"/><path d="M14 11a4 4 0 0 0-5.7-.3L5.8 13.2a4 4 0 0 0 5.6 5.6L13 17.4"/>'),
  automacoes: svgIcon('<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>'),
  documentos: svgIcon('<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
  dashboard: svgIcon('<path d="M4 20V10M12 20V4M20 20v-7"/>'),
  metas: svgIcon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  analytics: svgIcon('<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>'),
  insights: svgIcon('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z"/>'),
  implantacao: svgIcon('<path d="M12 2c2.5 2 4 5.2 4 8.5 0 2-1 4-4 6-3-2-4-4-4-6C8 7.2 9.5 4 12 2Z"/><path d="M9 15.5 6 20l3-1 1-3M15 15.5 18 20l-3-1-1-3"/><circle cx="12" cy="10" r="1.5"/>'),
  fechamento: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"/>'),
  escala: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  cadastros: svgIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  bibliotecaRepasse: svgIcon('<path d="M4 5.5A2 2 0 0 1 6 3.5h6v17H6a2 2 0 0 0-2 2Z"/><path d="M20 5.5A2 2 0 0 0 18 3.5h-6v17h6a2 2 0 0 1 2 2Z"/>'),
  arquivos: svgIcon('<path d="M4 4h6l2 2h8v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 12h8M8 16h5"/>'),
  fluxosEsteira: svgIcon('<path d="M12 2 3 6.5 12 11l9-4.5Z"/><path d="M3 12 12 16.5 21 12"/><path d="M3 17 12 21.5 21 17"/>'),
};

const app = document.getElementById('app');
const PAGE = 25;
let state = {
  session: null, view: 'inicio',
  page: 0, total: 0,
  filtros: { status: '', analista: '', busca: '', mes: '' },
  lookups: {},
  escalaMes: new Date().toISOString().slice(0, 7),
  dashMes: '',
  fechMes: new Date().toISOString().slice(0, 7),
};

function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDt(d){ return d ? new Date(d).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''; }
function tempoAberto(desde){
  if (!desde) return '—';
  const dias = Math.floor((Date.now() - new Date(desde)) / 86400000);
  if (dias < 1) return 'hoje';
  if (dias === 1) return '1 dia';
  return dias + ' dias';
}
function mesLabel(m){ const [y,mo]=m.split('-'); return ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][mo-1]+'/'+y.slice(2); }

// ---------- LOGIN ----------
const FEATURES = [
  ['dashboard', 'Dashboard & Insights', 'KPIs, ranking de produtividade e alertas de SLA em tempo real.'],
  ['pipeline', 'Análise de Produção', 'Metas automáticas, tendência semanal e capacidade real por analista.'],
  ['esteira', 'Pipeline de Processos', 'Controle completo das demandas, do recebimento à conclusão.'],
  ['repasse', 'Gestão de Repasse', 'Cadastro único do cliente com timeline automática do processo.'],
  ['escala', 'Escala de Plantão', 'Organização mensal da equipe com alerta de cobertura diária.'],
  ['fechamento', 'Fechamento Mensal', 'Extrato por analista e canal, pronto para exportação.'],
];
const ICONE_CADEADO = svgIcon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>');
const ICONE_PREDIO = svgIcon('<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3 21h18M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>');
const ICONE_EMAIL = svgIcon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6.5 8 6 8-6"/>');
const ICONE_CADEADO_MINI = svgIcon('<rect x="5" y="11" width="14" height="8" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>');
const ICONE_ESCUDO = svgIcon('<path d="M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6Z"/>');
function renderLogin(msg = '', tipo = 'erro') {
  app.innerHTML = `
  <div id="login-page">
    <div class="login-hero">
      <div class="hero-badge"><span class="hero-badge-ic">${ICONE_CADEADO_MINI}</span>SISTEMA INTERNO</div>
      <h1>Gestão que organiza.<br>Informação que move<br><span>resultados.</span></h1>
      <p class="hero-sub">Painel de gestão operacional da equipe Secretaria de Vendas.</p>
      <div class="hero-features">
        ${FEATURES.map(([v,t,d]) => `<div class="hf"><div class="hf-ic">${ICONES[v]}</div><div><b>${t}</b><small>${d}</small></div></div>`).join('')}
      </div>
    </div>
    <div class="login-panel">
      <div class="card" id="login-card">
        <div class="login-icon">${ICONE_PREDIO}</div>
        <h2>Gestão Operacional</h2>
        <div class="login-brandline">Secretaria de Vendas</div>
        <div class="sub">Painel interno da equipe</div>
        <label>E-mail corporativo</label>
        <div class="input-ic"><span>${ICONE_EMAIL}</span><input id="email" type="email" autocomplete="username" placeholder="seu.email@neoservice.com.br"></div>
        <label>Senha</label>
        <div class="input-ic"><span>${ICONE_CADEADO}</span><input id="senha" type="password" autocomplete="current-password" placeholder="••••••••••"></div>
        <div class="login-row">
          <label class="chk-inline"><input type="checkbox" id="manterConectado" checked> Manter conectado</label>
          <a href="#" id="linkEsqueci">Esqueci minha senha</a>
        </div>
        <button id="btnLogin">Entrar →</button>
        <p style="color:var(--muted2);font-size:11.5px;text-align:center;margin-top:12px">Acesso somente por convite do administrador.</p>
        <div class="msg ${tipo}">${esc(msg)}</div>
        <div class="login-footer-note"><span class="footer-ic">${ICONE_ESCUDO}</span>Ambiente Corporativo &nbsp;·&nbsp; Versão 1.0.0</div>
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

// ---------- LOGIN EXCLUSIVO DO PORTAL DO CLIENTE (?portal na URL) ----------
const PL_FEATURES = [
  [svgIcon('<path d="M4 20V10M12 20V4M20 20v-7"/>'), 'Painel Executivo', 'Indicadores operacionais atualizados em tempo real.'],
  [svgIcon('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>'), 'Gestão de Processos', 'Acompanhe cada venda em todas as etapas.'],
  [svgIcon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'), 'Assinaturas Digitais', 'Visualize quem assinou e quem ainda está pendente.'],
  [svgIcon('<path d="M21 12a8.5 8.5 0 0 1-11.8 7.8L4 21l1.3-4.9A8.5 8.5 0 1 1 21 12Z"/>'), 'Central de Interações', 'Solicite ações à Secretaria de Vendas sem e-mail ou WhatsApp.'],
];
const PL_ESTEIRA = [
  ['Venda Recebida', 'Concluído', 'done'],
  ['Análise de Crédito', 'Concluído', 'done'],
  ['Contrato', 'Concluído', 'done'],
  ['Assinatura', 'Em andamento', 'now'],
  ['Registro', 'Aguardando', ''],
  ['Concluído', 'Aguardando', ''],
];
const ICONE_CHECK_MINI = svgIcon('<path d="M20 6 9 17l-5-5"/>');
const PL_SKYLINE_BG = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
  <g fill="none" stroke="#0d3d3d" stroke-width="1.2" opacity=".18">
    <rect x="70" y="260" width="90" height="300"/><rect x="180" y="180" width="70" height="380"/>
    <rect x="270" y="320" width="60" height="240"/><rect x="600" y="220" width="80" height="340"/>
    <rect x="700" y="300" width="60" height="260"/>
    <path d="M85 260 100 235 115 260"/><path d="M195 180 210 150 225 180"/>
    <path d="M615 220 630 195 645 220"/>
    <path d="M0 560 800 560"/>
  </g>
</svg>`;
function renderLoginPortal(msg = '', tipo = 'erro') {
  app.innerHTML = `
  <div id="pl-page">
    <div class="pl-left">
      <div class="pl-left-bg">${PL_SKYLINE_BG}</div>
      <div class="pl-left-content">
        <span class="pl-badge"><span class="pl-badge-dot"></span>PORTAL DO INCORPORADOR</span>
        <h1>Acompanhe seus processos<br><span>em tempo real.</span></h1>
        <p class="pl-left-sub">Tenha acesso a todas as etapas da Secretaria de Vendas em um único lugar, desde o recebimento da venda até a conclusão da operação.</p>
        <div class="pl-features">
          ${PL_FEATURES.map(([ic,t,d]) => `<div class="pl-feat"><div class="pl-feat-ic">${ic}</div><div><b>${t}</b><small>${d}</small></div></div>`).join('')}
        </div>
        <div class="pl-stepper">
          ${PL_ESTEIRA.map(([l,st,cls]) => `
            <div class="pl-step ${cls}">
              <div class="pl-step-line ${cls==='done'?'on':''}"></div>
              <div class="pl-step-dot">${cls==='done'?ICONE_CHECK_MINI:cls==='now'?'⏳':'○'}</div>
              <div class="pl-step-lbl">${l}</div>
              <div class="pl-step-st">${st}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="pl-right">
      <div class="pl-card">
        <div class="pl-card-icon">${ICONE_CADEADO}</div>
        <h2>Portal do Incorporador</h2>
        <div class="pl-sub">Acompanhamento Operacional</div>
        <label>E-mail</label>
        <div class="input-ic"><span>${ICONE_EMAIL}</span><input id="plEmail" type="email" autocomplete="username" placeholder="seu.email@incorporadora.com.br"></div>
        <label>Senha</label>
        <div class="input-ic"><span>${ICONE_CADEADO}</span><input id="plSenha" type="password" autocomplete="current-password" placeholder="Sua senha"></div>
        <div class="pl-row">
          <label class="chk-inline"><input type="checkbox" id="plManter" checked> Manter conectado</label>
          <a href="#" id="plEsqueci">Esqueci minha senha</a>
        </div>
        <button id="plBtnLogin">Entrar →</button>
        <div class="msg ${tipo}" style="text-align:center">${esc(msg)}</div>
        <div class="pl-info-box">
          <div class="pl-info-title">Transparência em tempo real</div>
          <div class="pl-info-grid">
            ${['Processos','Assinaturas','Boletos','Pendências','SLA','Comunicação'].map(x=>`<div class="pl-info-item">${ICONE_CHECK_MINI}${x}</div>`).join('')}
          </div>
        </div>
        <div class="pl-card-footer">
          <span>${ICONE_ESCUDO} Ambiente seguro</span>
          <span>Versão 1.0.0</span>
        </div>
      </div>
    </div>
  </div>`;
  const valida = () => {
    if (!plEmail.value.trim() || !plSenha.value) { renderLoginPortal('Preencha e-mail e senha.'); return false; }
    return true;
  };
  plBtnLogin.onclick = async () => {
    if (!valida()) return;
    const { data, error } = await sb.auth.signInWithPassword({ email: plEmail.value.trim(), password: plSenha.value });
    if (error) { renderLoginPortal(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message); return; }
    const { data: perfil } = await sb.from('perfis').select('role').eq('user_id', data.user.id).single();
    if (perfil?.role !== 'cliente') {
      await sb.auth.signOut();
      renderLoginPortal('Este acesso é exclusivo para clientes do Portal. Se você é da equipe interna, use o link do sistema interno.');
      return;
    }
    init();
  };
  plEsqueci.onclick = async (e) => {
    e.preventDefault();
    const em = plEmail.value.trim();
    if (!em) { renderLoginPortal('Digite seu e-mail acima e clique em "Esqueci minha senha" de novo.'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(em);
    renderLoginPortal(error ? error.message : 'Enviamos um link de redefinição de senha para ' + em + '.', error ? 'erro' : 'ok');
  };
  [plEmail, plSenha].forEach(el => el && el.addEventListener('keydown', e => { if (e.key === 'Enter') plBtnLogin.click(); }));
}

// ---------- SHELL (4 pilares) ----------
const PILARES = [
  ['🏠 Início', [
    ['inicio', '🏠', 'Início'],
  ]],
  ['⚙️ Operação', [
    ['pipeline', '📅', 'Produção'],
    ['esteira', '⛓️', 'Esteira'],
    ['qualidade', '🔁', 'Qualidade / Retrabalho'],
    ['chamados', '📨', 'Chamados entre Áreas'],
    ['operacoes', '🗂️', 'Operações'],
    ['repasse', '🏦', 'Repasse'],
    ['bibliotecaRepasse', '📚', 'Biblioteca do Repasse'],
    ['fluxogramas', '🗺️', 'Fluxograma dos Empreendimentos'],
    ['followup', '💬', 'Follow-up'],
  ]],
  ['🤖 Plataforma', [
    ['integracoes', '🔌', 'Integrações'],
    ['automacoes', '⚡', 'Automações'],
    ['documentos', '📄', 'Documentos'],
  ]],
  ['🏢 Gestão', [
    ['dashboard', '📈', 'Dashboard'],
    ['metas', '🎯', 'Metas & Indicadores'],
    ['implantacao', '🚀', 'Produtos em Implantação'],
    ['fechamento', '💰', 'Fechamento'],
    ['escala', '📅', 'Escala'],
    ['arquivos', '📁', 'Arquivos'],
  ]],
  ['🛠️ Administração', [
    ['usuariosEquipe', '👤', 'Usuários'],
    ['cadastroOperacional', '🗂️', 'Cadastro operacional'],
  ]],
  ['🌐 Portal do Cliente', [
    ['portalUsuarios', '👤', 'Usuários do portal'],
    ['portalEmpreendimentos', '🏗️', 'Empreendimentos'],
    ['portalFluxo', '⛓️', 'Fluxo do portal'],
  ]],
];
// Telas restritas a gestão (admin = supervisor/coordenador). Analistas não veem inteligência nem administração.
const VIEWS_GESTAO = ['dashboard', 'analytics', 'insights', 'fechamento', 'escala', 'arquivos', 'integracoes', 'automacoes', 'metas', 'implantacao',
  'usuariosEquipe', 'cadastroOperacional', 'portalUsuarios', 'portalEmpreendimentos', 'portalFluxo'];
function podeVer(view) {
  return state.role === 'admin' ? true : !VIEWS_GESTAO.includes(view);
}
function shell(inner) {
  const pilaresVisiveis = PILARES
    .map(([grp, items]) => [grp, items.filter(([v]) => podeVer(v))])
    .filter(([, items]) => items.length);
  app.innerHTML = `
  ${EH_STAGING ? `<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#1a1200;text-align:center;font-weight:700;font-size:12.5px;padding:5px">
    🧪 AMBIENTE DE TESTE — nada aqui afeta o sistema real da equipe</div>` : ''}
  <div class="layout" style="${EH_STAGING ? 'margin-top:26px' : ''}">
    <aside>
      <div class="side-brand"><span class="logo">${ICONE_PREDIO}</span><div><b>Secretaria de Vendas${EH_STAGING?' (TESTE)':''}</b><small>Neo Service</small></div></div>
      ${pilaresVisiveis.map(([grp, items]) => `
        <div class="side-group">${grp}</div>
        ${items.map(([v, ic, l]) => `<button class="side-item ${state.view===v?'active':''}" data-v="${v}"><span class="side-ic">${ICONES[v] || ic}</span>${l}</button>`).join('')}
      `).join('')}
      <div class="side-footer">
        <button id="btnTrocarSenha" class="ghost">🔑 Trocar minha senha</button>
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
  btnTrocarSenha.onclick = () => abrirTrocarSenha();
  atualizarAlertaMensagensCliente();
}
// Aviso bem visível (não só o badge discreto no card da esteira) quando o cliente manda mensagem no Portal.
async function atualizarAlertaMensagensCliente() {
  const { count } = await sb.from('processo_mensagens').select('id', { count: 'exact', head: true }).eq('autor_tipo', 'cliente').eq('lida', false);
  document.querySelectorAll('.alerta-msg-cliente').forEach(el => el.remove());
  if (!count) return;
  const div = document.createElement('div');
  div.className = 'alerta-msg-cliente';
  div.innerHTML = `💬 ${count} ${count===1?'nova mensagem':'novas mensagens'} de cliente${count===1?'':'s'} no Portal — clique para ver`;
  document.body.appendChild(div);
  div.onclick = () => { state.view = 'esteira'; render(); };
}

function abrirTrocarSenha() {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:400px">
    <h2>🔑 Trocar minha senha</h2>
    <div><label>Nova senha</label><input id="tsSenha1" type="password" placeholder="Mínimo 6 caracteres"></div>
    <div style="margin-top:10px"><label>Confirmar nova senha</label><input id="tsSenha2" type="password"></div>
    <div class="msg" id="tsMsg" style="margin-top:8px"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="tsCancel" class="ghost">Fechar</button>
      <button id="tsSalvar">Salvar nova senha</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  div.querySelector('#tsCancel').onclick = () => div.remove();
  div.querySelector('#tsSalvar').onclick = async () => {
    const s1 = div.querySelector('#tsSenha1').value, s2 = div.querySelector('#tsSenha2').value;
    const msg = div.querySelector('#tsMsg');
    if (!s1 || s1.length < 6) { msg.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if (s1 !== s2) { msg.textContent = 'As senhas não coincidem.'; return; }
    const { error } = await sb.auth.updateUser({ password: s1 });
    if (error) { msg.textContent = error.message; return; }
    msg.style.color = 'var(--ok)'; msg.textContent = '✅ Senha alterada com sucesso.';
    setTimeout(() => div.remove(), 1400);
  };
}
function nomeExib(nome, rank) {
  return state.modoApresentacao ? `Colaborador ${rank}` : nome;
}
function render() {
  if (!podeVer(state.view)) state.view = 'inicio';
  ({ inicio: renderInicio, dashboard: renderDashboard, analytics: renderAnalytics, insights: renderInsights,
     pipeline: renderDemandas, esteira: renderEsteira, operacoes: renderOperacoes, repasse: renderRepasse, fluxogramas: renderFluxogramas,
     followup: renderFollowup, integracoes: () => renderStub('🔌 Integrações', 'Conecte Anapro, Mega, Sienge, bancos e assinatura digital. Cada integração aparecerá aqui com status de conexão e última sincronização.', ['Anapro — entrada automática de propostas', 'Mega / Sienge — ERP', 'Bancos — status de análise de crédito', 'Assinatura digital — acompanhamento de envelopes']),
     automacoes: renderAutomacoes,
     documentos: () => renderStub('📄 Documentos', 'Repositório de contratos, minutas, anexos e modelos vinculados a cada processo.', ['Upload de anexos por processo', 'Modelos de contrato por empreendedora', 'Histórico de versões']),
     chamados: renderChamados, fechamento: renderFechamento, escala: renderEscala,
     metas: renderMetas, qualidade: renderQualidade, implantacao: renderImplantacao,
     usuariosEquipe: renderUsuariosEquipe, cadastroOperacional: renderCadastroOperacional,
     portalUsuarios: renderPortalUsuarios, portalEmpreendimentos: renderPortalEmpreendimentos, portalFluxo: () => renderFluxosAdmin(''),
     arquivos: () => renderArquivos(''),
     bibliotecaRepasse: renderBibliotecaRepasse })[state.view]();
}
const FUNDO_NEOSERVICE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 400">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d3d3d"/><stop offset="55%" stop-color="#146060"/><stop offset="100%" stop-color="#1d7a76"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="400" fill="url(#g1)"/>
  <circle cx="1180" cy="40" r="420" fill="#ffffff" opacity=".05"/>
  <circle cx="1000" cy="-40" r="300" fill="#ffffff" opacity=".06"/>
  <circle cx="1340" cy="380" r="180" fill="#ffffff" opacity=".05"/>
  <g stroke="#ffffff" stroke-width="1.3" opacity=".28" fill="none">
    <path d="M50 330 L210 190 L370 330 Z"/>
    <path d="M90 330 L90 250 L150 250 L150 330"/>
    <path d="M170 330 L170 240 L230 240 L230 330"/>
    <path d="M250 330 L250 260 L330 260 L330 330"/>
    <path d="M0 330 L440 330"/>
    <path d="M20 360 L460 320"/>
    <path d="M40 385 L470 335"/>
    <path d="M210 190 L210 60"/>
    <path d="M120 275 L300 275"/>
  </g>
  <text x="1180" y="360" text-anchor="end" font-family="Inter,sans-serif" font-size="26" letter-spacing="1" fill="#ffffff" opacity=".85">
    <tspan font-weight="800">NEO</tspan><tspan font-weight="300">SERVICE</tspan>
  </text>
</svg>`;
const FUNDO_NEOSERVICE_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(FUNDO_NEOSERVICE);

// ---------- TELA INICIAL (escolha do que acessar) ----------
async function renderInicio() {
  const primeiroNome = (state.perfilNome || state.session?.user?.email || '').split(/[ .@]/)[0];
  const saudacao = (() => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; })();
  const atalhos = PILARES.flatMap(([grp, itens]) => itens.filter(([v]) => podeVer(v) && v !== 'inicio').map(([v, ic, l]) => ({ v, ic, l, grp })));
  shell(`
    <div class="card" style="margin-bottom:16px;background-image:url('${FUNDO_NEOSERVICE_URL}');background-size:cover;background-position:center;border:1px solid var(--border)">
      <h2 style="margin:0 0 4px;font-size:20px;color:#fff">${saudacao}${primeiroNome ? ', ' + esc(primeiroNome.charAt(0).toUpperCase()+primeiroNome.slice(1)) : ''}! 👋</h2>
      <p style="color:rgba(255,255,255,.75);font-size:13px;margin:0">Por onde você quer começar hoje?</p>
    </div>
    ${[...new Set(atalhos.map(a=>a.grp))].map(grp => `
      <div style="margin-bottom:18px">
        <div style="color:var(--muted);font-size:12px;font-weight:600;letter-spacing:.4px;margin-bottom:8px">${grp}</div>
        <div class="inicio-grid">
          ${atalhos.filter(a=>a.grp===grp).map(a => `
            <button class="inicio-card" data-v="${a.v}">
              <span class="inicio-ic">${ICONES[a.v] || a.ic}</span>
              <span>${a.l}</span>
            </button>`).join('')}
        </div>
      </div>`).join('')}`);
  document.querySelectorAll('.inicio-card').forEach(b => b.onclick = () => { state.view = b.dataset.v; render(); });
}

async function renderAutomacoes() {
  const { data: log } = await sb.from('alerta_teams_log').select('*').order('disparado_em', { ascending: false }).limit(30);
  shell(`
    <div class="card" style="max-width:820px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">⚡ Automações</h2>
        <span style="color:var(--muted);font-size:12.5px">O lembrete de plantão roda sozinho às 12h e 17h — cada disparo fica registrado abaixo.</span>
        <div class="spacer"></div>
        ${state.role === 'admin' ? '<button id="btnDispararManual" class="ghost">🔔 Enviar lembrete agora</button>' : ''}
      </div>
      <div class="msg" id="autoMsg" style="margin-top:8px"></div>
    </div>
    <div class="card">
      <h2>Histórico de disparos (últimos 30)</h2>
      <table><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Disparado por</th><th>Mensagem</th></tr></thead>
      <tbody>${(log||[]).map(l => `<tr>
        <td>${fmtDt(l.disparado_em)}</td>
        <td><span class="tag ${l.tipo==='automatico'?'CONCLUIDO':'PENDENTE'}">${l.tipo==='automatico'?'Automático (12h/17h)':'Manual'}</span></td>
        <td>${esc(l.usuario_email || '—')}</td>
        <td style="max-width:380px;font-size:12px">${esc(l.mensagem||'')}</td>
      </tr>`).join('') || '<tr><td colspan="4">Nenhum disparo registrado ainda.</td></tr>'}</tbody></table>
    </div>`);
  const bD = document.getElementById('btnDispararManual');
  if (bD) bD.onclick = async () => {
    bD.disabled = true;
    const msgEl = document.getElementById('autoMsg');
    msgEl.textContent = 'Enviando...';
    const { data, error } = await sb.functions.invoke('disparar-lembrete-manual', { method: 'POST' });
    msgEl.textContent = error ? `Erro: ${error.message}` : '✅ Lembrete enviado ao Teams.';
    renderAutomacoes();
  };
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

function dashSubTabs(ativo) {
  return `<div class="admin-tabs" style="margin-bottom:16px">
    <button class="admin-tab dash-subtab ${ativo==='dashboard'?'active':''}" data-v="dashboard">📈 Visão Geral</button>
    <button class="admin-tab dash-subtab ${ativo==='analytics'?'active':''}" data-v="analytics">📉 Analytics</button>
    <button class="admin-tab dash-subtab ${ativo==='insights'?'active':''}" data-v="insights">💡 Insights</button>
  </div>`;
}
// ---------- DASHBOARD (executivo: KPIs + produção + ranking, tudo numa tela) ----------
function pctFmt(num, den) {
  if (!den) return '0%';
  const p = 100 * num / den;
  return (p >= 99.995 ? '100' : p.toFixed(2)) + '%';
}
const PERIODO_LABELS = {
  hoje:'Hoje', ontem:'Ontem', '7d':'Últimos 7 dias', '15d':'Últimos 15 dias', '30d':'Últimos 30 dias',
  '60d':'Últimos 60 dias', '90d':'Últimos 90 dias', mes_atual:'Este mês', mes_anterior:'Mês anterior',
  '3m':'Últimos 3 meses', '6m':'Últimos 6 meses', '12m':'Últimos 12 meses', ano_atual:'Este ano',
  ano_anterior:'Ano anterior', personalizado:'Personalizado...',
};
async function renderDashboard() {
  const hoje0 = new Date();
  const ymAdd = (ym, n) => { const [y,m]=ym.split('-').map(Number); const d=new Date(y,m-1+n,1); return d.toISOString().slice(0,7); };
  const dAdd = (dt, n) => { const d=new Date(dt+'T12:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const todayStr = hoje0.toISOString().slice(0,10);
  if (!state.dashAnalista) state.dashAnalista = '';
  if (!state.periodoPreset) state.periodoPreset = '12m';
  if (!state.periodoAgrupamento) state.periodoAgrupamento = 'automatico';

  const computePeriodo = (preset) => {
    const hoje = todayStr;
    switch (preset) {
      case 'hoje': return [hoje, hoje];
      case 'ontem': { const y = dAdd(hoje,-1); return [y,y]; }
      case '7d': return [dAdd(hoje,-6), hoje];
      case '15d': return [dAdd(hoje,-14), hoje];
      case '30d': return [dAdd(hoje,-29), hoje];
      case '60d': return [dAdd(hoje,-59), hoje];
      case '90d': return [dAdd(hoje,-89), hoje];
      case 'mes_atual': return [hoje.slice(0,7)+'-01', hoje];
      case 'mes_anterior': { const pm = ymAdd(hoje.slice(0,7),-1); const [y,m]=pm.split('-').map(Number); const ult = new Date(y,m,0).getDate(); return [pm+'-01', pm+'-'+String(ult).padStart(2,'0')]; }
      case '3m': return [ymAdd(hoje.slice(0,7),-2)+'-01', hoje];
      case '6m': return [ymAdd(hoje.slice(0,7),-5)+'-01', hoje];
      case 'ano_atual': return [hoje.slice(0,4)+'-01-01', hoje];
      case 'ano_anterior': { const y=Number(hoje.slice(0,4))-1; return [y+'-01-01', y+'-12-31']; }
      case 'personalizado': return [state.periodoCustomDe || dAdd(hoje,-29), state.periodoCustomAte || hoje];
      default: return [ymAdd(hoje.slice(0,7),-11)+'-01', hoje]; // '12m'
    }
  };
  const diffDias = (de,ate) => Math.round((new Date(ate+'T12:00') - new Date(de+'T12:00'))/86400000)+1;
  const agrupamentoAuto = (de,ate) => { const n = diffDias(de,ate); return n<=31?'dia':n<=180?'semana':n<=1095?'mes':'ano'; };

  const [rkAll, { data: pd }, { data: pad }, { data: solo }, { data: metaF }, { data: cfg }, { data: ativs }, { data: tops }, { data: eventos }] = await Promise.all([
    sb.from('ranking_analistas').select('*'),
    sb.from('producao_diaria').select('*'),
    sb.from('producao_analista_dia').select('*'),
    sb.from('fds_solo').select('*'),
    sb.from('metas_fds').select('*'),
    sb.from('metas_config').select('*'),
    sb.from('volume_atividades').select('*'),
    sb.from('top_empreendedoras').select('*'),
    sb.from('eventos_especiais').select('*'),
  ]);
  const diasLancamento = new Set((eventos||[]).map(e => e.data));
  const todosAnalistas = [...new Set((rkAll.data||[]).map(r => r.nome))].sort();

  const dowOf = (k) => ((new Date(k+'T12:00').getDay()+6)%7)+1;
  const dias = pd || [];
  const porDia = {}; dias.forEach(d => porDia[d.dia] = d);
  const diasComDadoOrdenados = dias.map(d=>d.dia).sort();
  const primeiroDiaComDado = diasComDadoOrdenados[0];
  const fmtDia = (d) => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '';

  // --- Período unificado: dirige gráfico de volume, KPIs, semanal e média por dia da semana ---
  const [deRaw, ateRaw] = computePeriodo(state.periodoPreset);
  const deEfetivo = primeiroDiaComDado && deRaw < primeiroDiaComDado ? primeiroDiaComDado : deRaw;
  const ateEfetivo = ateRaw;
  const avisoRecorte = primeiroDiaComDado && deRaw < primeiroDiaComDado;
  const agrupamentoEfetivo = state.periodoAgrupamento === 'automatico' ? agrupamentoAuto(deEfetivo, ateEfetivo) : state.periodoAgrupamento;

  // Ranking agora segue o MESMO período selecionado (em vez de um "mês do ranking" separado).
  // Se o período cobre só 1 mês, o resultado é idêntico ao antigo comportamento por mês.
  const mesesNoPeriodo = new Set();
  { let cur = deEfetivo.slice(0,7); const fim = ateEfetivo.slice(0,7); let guard = 0;
    while (cur <= fim && guard++ < 600) { mesesNoPeriodo.add(cur); cur = ymAdd(cur, 1); } }
  let rkFiltrado = (rkAll.data||[]).filter(r => mesesNoPeriodo.has(r.mes.slice(0,7)));
  if (state.dashAnalista) rkFiltrado = rkFiltrado.filter(r => r.nome === state.dashAnalista);
  const porAnalistaRk = {};
  // analistas ativos ou em licença sempre aparecem, mesmo zerados (ex.: Yara em licença "conta" com zero)
  (state.lookups.analistas || []).filter(a => a.cargo === 'analista' && ['Ativo','Em licença'].includes(a.status))
    .forEach(a => { if (!state.dashAnalista || state.dashAnalista === a.nome) porAnalistaRk[a.nome] = { nome: a.nome, total: 0, concluidas: 0, pendentes: 0, tempos: [] }; });
  rkFiltrado.forEach(r => {
    const a = porAnalistaRk[r.nome] = porAnalistaRk[r.nome] || { nome: r.nome, total: 0, concluidas: 0, pendentes: 0, tempos: [] };
    a.total += r.total; a.concluidas += r.concluidas; a.pendentes += r.pendentes;
    if (r.tempo_medio_h != null) a.tempos.push(r.tempo_medio_h);
  });
  const maxTotalRk = Math.max(...Object.values(porAnalistaRk).map(a=>a.total), 1);
  const rk = Object.values(porAnalistaRk).map(a => {
    const pct_concl = a.total ? Math.round(1000*a.concluidas/a.total)/10 : 0;
    const tempo_medio_h = a.tempos.length ? Math.round(10*a.tempos.reduce((s,x)=>s+x,0)/a.tempos.length)/10 : null;
    const score = Math.round(10*(100*(0.4*(a.total?a.concluidas/a.total:0) + 0.6*(a.total/maxTotalRk))))/10;
    const classe = score>=90?'Alta':score>=78?'Média':'Baixa';
    return { ...a, pct_concl, tempo_medio_h, score, classe };
  }).sort((a,b)=>b.total-a.total);

  const diasLista = [];
  { let cur = deEfetivo; let guard = 0;
    while (cur <= ateEfetivo && guard++ < 1600) { diasLista.push(cur); cur = dAdd(cur, 1); } }
  const serieDias = diasLista.map(k => porDia[k] || { dia: k, total: 0, dow: dowOf(k) });

  // KPIs de topo (Total/Concluídos/Pendentes/%) escopados ao período selecionado
  const ateExclusivo = dAdd(ateEfetivo, 1);
  const [{ count: totAll }, { count: concAll }] = await Promise.all([
    sb.from('demandas').select('id', { count: 'exact', head: true }).gte('recebido_em', deEfetivo).lt('recebido_em', ateExclusivo),
    sb.from('demandas').select('id', { count: 'exact', head: true }).gte('recebido_em', deEfetivo).lt('recebido_em', ateExclusivo).eq('status', 'CONCLUIDO'),
  ]);

  // Volume: agrupamento automático (dia/semana/mês/ano) pra nunca virar parede de barras
  const bucketKey = (d) => agrupamentoEfetivo==='dia' ? d.dia
    : agrupamentoEfetivo==='semana' ? (() => { const dt=new Date(d.dia+'T12:00'); const seg=new Date(dt); seg.setDate(dt.getDate()-((dt.getDay()+6)%7)); return seg.toISOString().slice(0,10); })()
    : agrupamentoEfetivo==='mes' ? d.dia.slice(0,7) : d.dia.slice(0,4);
  const bucketLabel = (k) => agrupamentoEfetivo==='dia' ? fmtDia(k)
    : agrupamentoEfetivo==='semana' ? new Date(k+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
    : agrupamentoEfetivo==='mes' ? mesLabel(k) : k;
  const volBuckets = {};
  serieDias.forEach(d => { const k = bucketKey(d); volBuckets[k] = (volBuckets[k]||0) + d.total; });
  const volSerie = Object.keys(volBuckets).sort().map(k => ({ key: k, label: bucketLabel(k), total: volBuckets[k] }));
  const maxVol = Math.max(...volSerie.map(v=>v.total), 1);
  const AGRUP_LABEL = { dia:'dia', semana:'semana', mes:'mês', ano:'ano' };

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

  // Chamados entre áreas: agrupados por quem abriu e por área destino, com indicador de tempo
  const { data: chamadosTodos } = await sb.from('chamados').select('solicitante,area,status,criado_em,resolvido_em');
  const chamadosAbertos = (chamadosTodos||[]).filter(c => c.status !== 'RESOLVIDO');
  const chamadosPorSolicitante = {};
  chamadosAbertos.forEach(c => { const n = c.solicitante || '—'; chamadosPorSolicitante[n] = (chamadosPorSolicitante[n]||0) + 1; });
  const chamadosRanking = Object.entries(chamadosPorSolicitante).sort((a,b) => b[1]-a[1]);
  const maxChamados = Math.max(1, ...chamadosRanking.map(([,n]) => n));
  const chamadosPorArea = {};
  chamadosAbertos.forEach(c => { const a = c.area || '—'; chamadosPorArea[a] = (chamadosPorArea[a]||0) + 1; });
  const areaRanking = Object.entries(chamadosPorArea).sort((a,b) => b[1]-a[1]);
  const maxArea = Math.max(1, ...areaRanking.map(([,n]) => n));
  const agoraMs = Date.now();
  const horasAbertoArr = chamadosAbertos.map(c => (agoraMs - new Date(c.criado_em)) / 3600000);
  const mediaHorasAberto = horasAbertoArr.length ? Math.round(horasAbertoArr.reduce((a,b)=>a+b,0) / horasAbertoArr.length) : 0;
  const resolvidosArr = (chamadosTodos||[]).filter(c => c.status === 'RESOLVIDO' && c.resolvido_em);
  const horasResolucaoArr = resolvidosArr.map(c => (new Date(c.resolvido_em) - new Date(c.criado_em)) / 3600000);
  const mediaHorasResolucao = horasResolucaoArr.length ? Math.round(horasResolucaoArr.reduce((a,b)=>a+b,0) / horasResolucaoArr.length) : 0;

  shell(`
    ${dashSubTabs('dashboard')}
    <div class="kpis">
      <div class="kpi kpi-clicavel" data-ir="__todos__"><div class="v">${totAll}</div><div class="l">📋 Total de processos</div></div>
      <div class="kpi kpi-clicavel" data-ir="CONCLUIDO"><div class="v" style="color:var(--ok)">${concAll}</div><div class="l">✅ Concluídos</div></div>
      <div class="kpi kpi-clicavel" data-ir="__pendente__"><div class="v" style="color:var(--warn)">${totAll-concAll}</div><div class="l">⚠️ Pendentes</div></div>
      <div class="kpi"><div class="v" style="color:var(--accent)">${pctFmt(concAll, totAll)}</div><div class="l">📊 % conclusão</div></div>
    </div>
    <div class="card filters" style="align-items:end">
      <div><label>Período</label><select id="perPreset">
        ${Object.entries(PERIODO_LABELS).map(([k,l])=>`<option value="${k}" ${state.periodoPreset===k?'selected':''}>${l}</option>`).join('')}</select></div>
      ${state.periodoPreset === 'personalizado' ? `
      <div><label>Data Inicial</label><input id="perCustomDe" type="date" value="${state.periodoCustomDe || deEfetivo}"></div>
      <div><label>Data Final</label><input id="perCustomAte" type="date" value="${state.periodoCustomAte || ateEfetivo}"></div>
      <button id="perAplicar">Aplicar</button>
      <button id="perLimpar" class="ghost">Limpar</button>
      <button id="perCancelar" class="ghost">Cancelar</button>
      ` : ''}
      <div><label>Agrupamento</label><select id="perAgrupamento">
        ${[['automatico','Automático'],['dia','Dia'],['semana','Semana'],['mes','Mês'],['ano','Ano']].map(([k,l])=>
          `<option value="${k}" ${state.periodoAgrupamento===k?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="spacer"></div>
      ${state.role === 'admin' ? '<button id="btnMarcarLanc" class="ghost">🚀 Marcar dia de lançamento</button>' : ''}
    </div>
    <div class="card filters" style="align-items:center">
      <div><label>Analista (ranking)</label><select id="dashAnalista"><option value="">Todos</option>
        ${todosAnalistas.map(n=>`<option value="${esc(n)}" ${state.dashAnalista===n?'selected':''}>${esc(n)}</option>`).join('')}</select></div>
    </div>
    <div class="card">
      <h2 style="margin:0 0 10px">Volume — ${PERIODO_LABELS[state.periodoPreset]} (por ${AGRUP_LABEL[agrupamentoEfetivo]}) · ${fmtDia(deEfetivo)} a ${fmtDia(ateEfetivo)}</h2>
      ${avisoRecorte ? `<p style="color:var(--muted);font-size:12px;margin:-4px 0 8px">Sem produção registrada antes de ${fmtDia(primeiroDiaComDado)} — período anterior foi ocultado do gráfico.</p>` : ''}
      <div class="chart">${volSerie.map(v => `
        <div class="bar-wrap" title="${v.label}: ${v.total}">
          <div class="bar-val">${v.total}</div>
          <div class="bar" style="height:${Math.round(140*v.total/maxVol)}px"></div>
          <div class="bar-lbl">${v.label}</div>
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
      <h2 style="margin:0 0 6px">📈 Produção diária — ${fmtDia(deEfetivo)} a ${fmtDia(ateEfetivo)}</h2>
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
      <h2 style="margin:0">🏆 Ranking de produtividade — ${PERIODO_LABELS[state.periodoPreset]}${state.dashAnalista ? ' — ' + esc(state.dashAnalista) : ''}</h2>
      <p style="color:var(--muted);font-size:12px;margin:2px 0 8px">Segue o mesmo filtro "Período" do topo da página.</p>
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
      <div class="card kpi-clicavel" id="cardChamadosAnalista">
        <h2>📨 Chamados em aberto por quem abriu</h2>
        <div style="display:flex;gap:14px;margin-bottom:10px;font-size:12px;color:var(--muted)">
          <span>⏳ Tempo médio aberto: <b style="color:var(--text)">${mediaHorasAberto}h</b></span>
          <span>✅ Tempo médio de resolução: <b style="color:var(--text)">${mediaHorasResolucao}h</b></span>
        </div>
        <div style="max-height:340px;overflow-y:auto">
        ${chamadosRanking.length ? chamadosRanking.map(([nome,n]) => `<div class="hbar-row"><span class="hbar-lbl">${esc(nome)}</span>
          <div class="hbar"><div style="width:${Math.round(100*n/maxChamados)}%"></div></div>
          <b>${n}</b></div>`).join('') : '<p style="color:var(--muted);font-size:12.5px">Nenhum chamado em aberto no momento.</p>'}
        </div>
      </div>
      <div class="card kpi-clicavel" id="cardChamadosArea">
        <h2>🏢 Chamados em aberto por área</h2>
        <div style="max-height:420px;overflow-y:auto">
        ${areaRanking.length ? areaRanking.map(([area,n]) => `<div class="hbar-row"><span class="hbar-lbl">${esc(area)}</span>
          <div class="hbar"><div style="width:${Math.round(100*n/maxArea)}%"></div></div>
          <b>${n}</b></div>`).join('') : '<p style="color:var(--muted);font-size:12.5px">Nenhum chamado em aberto no momento.</p>'}
        </div>
      </div>
    </div>`);
  document.querySelectorAll('.kpi-clicavel[data-ir]').forEach(el => el.onclick = () => {
    state.filtros = { busca:'', analista:'', mes:'', status: el.dataset.ir === '__todos__' ? '' : el.dataset.ir };
    state.page = 0; state.view = 'pipeline'; render();
  });
  const cardChamados = document.getElementById('cardChamadosAnalista');
  if (cardChamados) cardChamados.onclick = () => { state.view = 'chamados'; render(); };
  const cardChamadosA = document.getElementById('cardChamadosArea');
  if (cardChamadosA) cardChamadosA.onclick = () => { state.view = 'chamados'; render(); };
  document.querySelectorAll('.dash-subtab').forEach(b => b.onclick = () => { state.view = b.dataset.v; render(); });
  document.getElementById('dashAnalista').onchange = (e) => { state.dashAnalista = e.target.value; renderDashboard(); };
  document.getElementById('perPreset').onchange = (e) => {
    state.periodoPresetAnterior = state.periodoPreset;
    state.periodoPreset = e.target.value;
    if (state.periodoPreset === 'personalizado' && !state.periodoCustomDe) {
      state.periodoCustomDe = deEfetivo; state.periodoCustomAte = ateEfetivo;
    }
    renderDashboard();
  };
  document.getElementById('perAgrupamento').onchange = (e) => { state.periodoAgrupamento = e.target.value; renderDashboard(); };
  const bAplicar = document.getElementById('perAplicar');
  if (bAplicar) bAplicar.onclick = () => {
    state.periodoCustomDe = document.getElementById('perCustomDe').value;
    state.periodoCustomAte = document.getElementById('perCustomAte').value;
    renderDashboard();
  };
  const bLimpar = document.getElementById('perLimpar');
  if (bLimpar) bLimpar.onclick = () => { state.periodoPreset = '12m'; state.periodoCustomDe = null; state.periodoCustomAte = null; renderDashboard(); };
  const bCancelarPer = document.getElementById('perCancelar');
  if (bCancelarPer) bCancelarPer.onclick = () => { state.periodoPreset = state.periodoPresetAnterior || '12m'; renderDashboard(); };
  const bTL = document.getElementById('btnToggleLanc');
  if (bTL) bTL.onclick = () => { state.excluirLancamentos = !state.excluirLancamentos; renderDashboard(); };
  const bML = document.getElementById('btnMarcarLanc');
  if (bML) bML.onclick = () => openMarcarLancamento(eventos || []);
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
  if (f.status === '__pendente__') q = q.neq('status', 'CONCLUIDO');
  else if (f.status) q = q.eq('status', f.status);
  if (f.analista) q = q.eq('analista_id', f.analista);
  if (f.busca) q = q.or(`proponente1_nome.ilike.%${f.busca}%,unidade.ilike.%${f.busca}%,numero_processo.ilike.%${f.busca}%`);
  if (f.mes) {
    const [y, m] = f.mes.split('-').map(Number);
    q = q.gte('recebido_em', new Date(y, m-1, 1).toISOString()).lt('recebido_em', new Date(y, m, 1).toISOString());
  }
  return q;
}
async function renderDemandas() {
  const { data: rows, count, error: erroConsulta } = await buildQuery(
    'id,numero,numero_processo,recebido_em,proponente1_nome,proponente1_cpf,proponente2_nome,proponente2_cpf,unidade,status,concluido_em,fat_mensal,valor_proposta,obs,analistas(nome),empreendedoras(nome),empreendimentos(nome),atividades(nome)', true
  ).order('recebido_em', { ascending: false }).range(state.page*PAGE, state.page*PAGE+PAGE-1);
  state.total = count || 0;
  const L = state.lookups, f = state.filtros;
  const pages = Math.max(1, Math.ceil(state.total / PAGE));
  shell(`
    ${erroConsulta ? `<div class="alert-box" style="margin-bottom:14px">⚠️ <b>Não foi possível carregar a lista.</b> ${esc(erroConsulta.message)}<br>
      <span style="font-size:12px">Se isso está acontecendo no ambiente de teste, provavelmente faltam chaves estrangeiras no schema <code>staging</code> — ver <code>migrations/corrigir_ambiente_staging.sql</code>.</span></div>` : ''}
    <div class="card filters">
      <div><label>Busca (nome / unidade / processo)</label><input id="fBusca" value="${esc(f.busca)}"></div>
      <div><label>Status</label><select id="fStatus"><option value="">Todos</option>
        <option value="__pendente__" ${f.status==='__pendente__'?'selected':''}>Pendentes (não concluídos)</option>
        ${['RECEBIDO','EM_ANALISE','CONCLUIDO','PENDENTE'].map(s=>`<option ${f.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div><label>Analista</label><select id="fAnalista"><option value="">Todos</option>
        ${L.analistas.map(a=>`<option value="${a.id}" ${f.analista===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>
      <div><label>Mês</label><input id="fMes" type="month" value="${esc(f.mes)}"></div>
      <button id="btnFiltrar">Filtrar</button>
      <button id="btnLimpar" class="ghost">Limpar</button>
      <div class="spacer"></div>
      ${state.role !== 'leitura' ? '<button id="btnImportarPlanilha" class="ghost">⬆ Importar planilha</button><button id="btnNova">+ Novo processo</button>' : ''}
    </div>
    <div class="card">
      <div class="table-scroll">
      <table><thead><tr><th>Nº</th><th>Nº Processo</th><th>Recebido</th><th>Tempo aberto</th><th>1º Proponente</th><th>CPF 1º</th><th>2º Proponente</th><th>CPF 2º</th><th>Empreendedora</th><th>Empreendimento</th><th>Unidade</th><th>Atividade</th><th>Analista</th><th>Status</th><th>Concluído em</th><th>Fat.</th><th>Valor proposta</th><th>Obs</th><th></th></tr></thead>
      <tbody>${(rows||[]).map(r => `<tr>
        <td style="white-space:nowrap">${r.numero ?? ''}</td><td style="white-space:nowrap">${esc(r.numero_processo)}</td>
        <td style="white-space:nowrap">${fmtDt(r.recebido_em)}</td>
        <td style="white-space:nowrap;${r.status!=='CONCLUIDO'?'color:var(--warn);font-weight:600':''}">${r.status!=='CONCLUIDO' ? tempoAberto(r.recebido_em) : '—'}</td>
        <td style="min-width:150px">${esc(r.proponente1_nome)}</td><td style="white-space:nowrap">${esc(r.proponente1_cpf)}</td>
        <td style="min-width:150px">${esc(r.proponente2_nome) || '<span style="color:var(--muted2)">—</span>'}</td>
        <td style="white-space:nowrap">${esc(r.proponente2_cpf) || '<span style="color:var(--muted2)">—</span>'}</td>
        <td style="min-width:120px">${esc(r.empreendedoras?.nome)}</td><td style="min-width:130px">${esc(r.empreendimentos?.nome)}</td>
        <td style="white-space:nowrap">${esc(r.unidade)}</td><td style="min-width:160px">${esc(r.atividades?.nome)}</td>
        <td style="min-width:100px">${esc(r.analistas?.nome)}</td>
        <td><span class="tag ${esc(r.status)}">${esc(r.status)}</span></td>
        <td style="white-space:nowrap">${r.concluido_em ? fmtDt(r.concluido_em) : '<span style="color:var(--muted2)">—</span>'}</td>
        <td><span class="tag ${r.fat_mensal?'CONCLUIDO':'PENDENTE'}">${r.fat_mensal?'Sim':'Não'}</span></td>
        <td style="white-space:nowrap">${r.valor_proposta ? Number(r.valor_proposta).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '<span style="color:var(--muted2)">—</span>'}</td>
        <td style="min-width:160px">${esc(r.obs) || '<span style="color:var(--muted2)">—</span>'}</td>
        <td><button class="ghost btnEdit" data-id="${r.id}">Abrir</button></td></tr>`).join('')}
      </tbody></table></div>
      <div class="pag">
        <span>${state.total} registros · pág. ${state.page+1}/${pages}</span>
        <button class="ghost" id="pgPrev" ${state.page===0?'disabled':''}>◀</button>
        <button class="ghost" id="pgNext" ${state.page>=pages-1?'disabled':''}>▶</button>
      </div>
    </div>`);
  const bN = document.getElementById('btnNova');
  if (bN) bN.onclick = () => openForm(null);
  const bImp = document.getElementById('btnImportarPlanilha');
  if (bImp) bImp.onclick = () => abrirImportarPlanilha(renderDemandas);
  btnFiltrar.onclick = () => { state.filtros = { busca:fBusca.value.trim(), status:fStatus.value, analista:fAnalista.value, mes:fMes.value }; state.page=0; renderDemandas(); };
  btnLimpar.onclick = () => { state.filtros = { status:'',analista:'',busca:'',mes:'' }; state.page=0; renderDemandas(); };
  pgPrev.onclick = () => { state.page--; renderDemandas(); };
  pgNext.onclick = () => { state.page++; renderDemandas(); };
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
}

// ---------- IMPORTAR PLANILHA (mesmo modelo do Fechamento) para Produção ----------
function abrirImportarPlanilha(aoTerminar) {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:480px">
    <h2>⬆ Importar planilha para Produção</h2>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">
      Use o mesmo modelo do Fechamento: Nome do Analista, Nº do processo, Data do execução,
      Nome/CPF 1° e 2° Proponente, Consulta Serasa, Empreendedora, Empreendimento, Unidade, Prestação de Serviço.
    </p>
    <input id="impArquivo" type="file" accept=".xlsx,.xls,.csv" style="width:100%;margin-bottom:10px">
    <label class="chk-inline" style="text-transform:none;font-weight:500;color:var(--text)">
      <input type="checkbox" id="impFatMensal" checked> Marcar todas as linhas importadas como <b>Faturado</b> (entram no Fechamento Mensal)
    </label>
    <div class="msg" id="impMsg" style="margin-top:10px"></div>
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:end">
      <button id="impCancelar" class="ghost">Fechar</button>
      <button id="impConfirmar">Importar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  div.querySelector('#impCancelar').onclick = () => div.remove();
  div.querySelector('#impConfirmar').onclick = async () => {
    const f = div.querySelector('#impArquivo').files[0];
    const msg = div.querySelector('#impMsg');
    if (!f) { msg.textContent = 'Selecione um arquivo primeiro.'; return; }
    const marcarFat = div.querySelector('#impFatMensal').checked;
    msg.textContent = 'Lendo planilha...';
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    // Chaves de cabeçalho às vezes vêm com espaços a mais/no fim (ex.: "Data do execução ") —
    // normaliza espaços em vez de exigir bater exatamente.
    const normKeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k,v]) => [k.trim().replace(/\s+/g,' '), v]));
    // A planilha modelo tem outras abas (ex.: uma aba oculta de referência antes da aba de dados),
    // então varremos todas as abas e usamos a primeira que realmente tem a coluna do 1º proponente.
    let linhas = [];
    for (const nomeAba of wb.SheetNames) {
      const tentativa = XLSX.utils.sheet_to_json(wb.Sheets[nomeAba], { defval: '' }).map(normKeys);
      if (tentativa.some(l => String(l['Nome 1° Proponente'] || l['Nome 1º Proponente'] || '').trim())) { linhas = tentativa; break; }
    }
    if (!linhas.length) { msg.textContent = 'Não encontrei nenhuma aba com a coluna "Nome 1° Proponente" preenchida nesta planilha.'; return; }

    const L = state.lookups;
    const acha = (lista, nome) => {
      const alvo = String(nome||'').trim().toLowerCase();
      if (!alvo) return null;
      return lista.find(x => x.nome.trim().toLowerCase() === alvo)?.id || null;
    };
    const paraData = (v) => {
      if (!v) return new Date().toISOString();
      if (v instanceof Date) return v.toISOString();
      const s = String(v).trim();
      const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (m) { const [,d,mo,y] = m; return new Date(+y.length===2?'20'+y:y, +mo-1, +d, 12).toISOString(); }
      const dt = new Date(s); return isNaN(dt) ? new Date().toISOString() : dt.toISOString();
    };

    let ok = 0, semProponente = 0;
    const registros = [];
    for (const l of linhas) {
      const p1 = l['Nome 1° Proponente'] || l['Nome 1º Proponente'] || '';
      if (!String(p1).trim()) { semProponente++; continue; }
      registros.push({
        proponente1_nome: String(p1).trim(),
        proponente1_cpf: String(l['CPF 1° Proponente'] || l['CPF 1º Proponente'] || '').trim() || null,
        proponente2_nome: String(l['Nome 2° Proponente'] || l['Nome 2º Proponente'] || '').trim() || null,
        proponente2_cpf: String(l['CPF 2° Proponente'] || l['CPF 2º Proponente'] || '').trim() || null,
        numero_processo: String(l['Nº do processo'] || '').trim() || null,
        unidade: String(l['Unidade'] || '').trim() || null,
        recebido_em: paraData(l['Data do execução']),
        analista_id: acha(L.analistas, l['Nome do Analista']),
        empreendedora_id: acha(L.empreendedoras, l['Empreendedora']),
        empreendimento_id: acha(L.empreendimentos, l['Empreendimento']),
        atividade_id: acha(L.atividades, l['Prestação de Serviço']),
        status: 'CONCLUIDO',
        concluido_em: new Date().toISOString(),
        fat_mensal: marcarFat,
      });
      ok++;
    }
    if (!registros.length) { msg.textContent = 'Nenhuma linha com "Nome 1° Proponente" preenchido — nada foi importado.'; return; }
    msg.textContent = `Importando ${registros.length} linha(s)...`;
    const { error } = await sb.from('demandas').insert(registros);
    if (error) { msg.textContent = 'Erro ao importar: ' + error.message; return; }
    msg.style.color = 'var(--ok)';
    msg.textContent = `✅ ${ok} processo(s) importado(s)${semProponente ? ` · ${semProponente} linha(s) ignorada(s) por falta do 1° Proponente` : ''}.`;
    setTimeout(() => { div.remove(); aoTerminar(); }, 1600);
  };
}

// ---------- VALIDADOR DE DOCUMENTOS (CPF/CNPJ por dígito verificador + duplicidade) ----------
function cpfValido(cpf) {
  const s = String(cpf||'').replace(/\D/g,'');
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  const calc = (len) => {
    let soma = 0;
    for (let i = 0; i < len; i++) soma += Number(s[i]) * (len+1-i);
    const r = (soma*10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(s[9]) && calc(10) === Number(s[10]);
}
function cnpjValido(cnpj) {
  const s = String(cnpj||'').replace(/\D/g,'');
  if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;
  const calc = (len) => {
    const pesos = len === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let soma = 0;
    for (let i = 0; i < len; i++) soma += Number(s[i]) * pesos[i];
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(s[12]) && calc(13) === Number(s[13]);
}
// Aceita CPF (11 dígitos) ou CNPJ (14 dígitos) — o cadastro do sistema não distingue os dois campos.
function documentoValido(v) {
  const s = String(v||'').replace(/\D/g,'');
  if (!s) return true; // campo vazio não é "inválido", é "não preenchido"
  if (s.length === 11) return cpfValido(s);
  if (s.length === 14) return cnpjValido(s);
  return false;
}
// Liga a um <input> de CPF/CNPJ um aviso visual ao sair do campo, e (se demandaIdAtual for passado)
// avisa se esse mesmo documento já está cadastrado em outro processo.
function ligarValidadorDocumento(inputEl, avisoEl, demandaIdAtual) {
  inputEl.addEventListener('blur', async () => {
    const v = inputEl.value.trim();
    if (!v) { avisoEl.textContent = ''; return; }
    if (!documentoValido(v)) {
      avisoEl.textContent = '⚠️ CPF/CNPJ com dígito verificador inválido — confira se foi digitado certo.';
      avisoEl.style.color = 'var(--err)';
      return;
    }
    const somenteDigitos = v.replace(/\D/g,'');
    const { data: existentes } = await sb.from('demandas')
      .select('id,numero,proponente1_nome,proponente1_cpf,proponente2_nome,proponente2_cpf')
      .or(`proponente1_cpf.eq.${v},proponente2_cpf.eq.${v}`);
    const outros = (existentes||[]).filter(d => d.id !== demandaIdAtual &&
      [d.proponente1_cpf, d.proponente2_cpf].some(c => c && c.replace(/\D/g,'') === somenteDigitos));
    if (outros.length) {
      const nums = outros.map(d => d.numero ?? '?').join(', ');
      avisoEl.textContent = `ℹ️ Esse documento já aparece no(s) processo(s) nº ${nums}.`;
      avisoEl.style.color = 'var(--warn)';
    } else {
      avisoEl.textContent = '✅ Documento válido.';
      avisoEl.style.color = 'var(--ok)';
    }
  });
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
      <div><label>CPF 1</label><input id="mC1" value="${esc(d.proponente1_cpf)}"><small id="mC1Aviso" style="display:block;font-size:11px;margin-top:3px"></small></div>
      <div><label>Proponente 2</label><input id="mP2" value="${esc(d.proponente2_nome)}"></div>
      <div><label>CPF 2</label><input id="mC2" value="${esc(d.proponente2_cpf)}"><small id="mC2Aviso" style="display:block;font-size:11px;margin-top:3px"></small></div>
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
      <div><label>Valor da proposta</label><input id="mValor" type="number" step="0.01" value="${d.valor_proposta ?? ''}"></div>
      <div style="display:flex;align-items:end;gap:8px"><label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input id="mFatMensal" type="checkbox" ${d.fat_mensal?'checked':''}> <span>💰 Faturado (entra no Fechamento Mensal)</span></label></div>
      <div style="grid-column:1/-1"><label>Obs</label><textarea id="mObs" rows="3">${esc(d.obs)}</textarea></div>
    </div>
    ${id ? `
    <h2 style="margin-top:16px">✅ Checklist de validação</h2>
    <div id="mChecks">${checks.map(c => `
      <div class="chk"><input type="checkbox" data-cid="${c.id}" ${c.ok?'checked':''}> <span>${esc(c.item)}</span>
      <button class="ghost del-chk" data-cid="${c.id}">✕</button></div>`).join('') || '<div class="msg">Nenhum item ainda.</div>'}</div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <textarea id="mNewChk" placeholder="Novo item do checklist" rows="2" style="flex:1"></textarea>
      <button id="mAddChk" class="ghost">Adicionar</button>
    </div>
    <h2 style="margin-top:16px">💬 Follow-ups</h2>
    <div id="mFups">${fups.map(f => `<div class="fup"><b>${esc(f.autor||'')}</b> <span style="color:var(--muted)">${fmtDt(f.criado_em)}</span><br>${esc(f.texto)}</div>`).join('') || '<div class="msg">Nenhum follow-up ainda.</div>'}</div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <textarea id="mNewFup" placeholder="Registrar follow-up..." rows="3" style="flex:1"></textarea>
      <button id="mAddFup" class="ghost">Registrar</button>
    </div>` : ''}
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:end;flex-wrap:wrap">
      <button id="mCancel" class="ghost">Cancelar</button>
      ${id ? '<button id="mDelete" class="ghost" style="color:var(--err)">🗑️ Excluir processo</button>' : ''}
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
  ligarValidadorDocumento($('mC1'), $('mC1Aviso'), id || null);
  ligarValidadorDocumento($('mC2'), $('mC2Aviso'), id || null);
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
      valor_proposta: $('mValor').value ? Number($('mValor').value) : null,
      fat_mensal: $('mFatMensal').checked,
      obs: $('mObs').value || null,
    };
    if (!rec.recebido_em) { $('mMsg').textContent = 'Informe a data de recebimento.'; return; }
    const docsInvalidos = [rec.proponente1_cpf, rec.proponente2_cpf].filter(v => v && !documentoValido(v));
    if (docsInvalidos.length && !confirm(`O CPF/CNPJ "${docsInvalidos[0]}" tem dígito verificador inválido — pode ter sido digitado errado. Salvar mesmo assim?`)) return;
    const r = id ? await sb.from('demandas').update(rec).eq('id', id) : await sb.from('demandas').insert(rec);
    if (r.error) { $('mMsg').textContent = r.error.message; return; }
    div.remove(); render();
  };
  const btnDel = $('mDelete');
  if (btnDel) btnDel.onclick = async () => {
    if (!confirm(`Excluir o processo nº ${d.numero ?? ''} — ${d.proponente1_nome ?? ''}?\n\nEssa ação não pode ser desfeita. Use quando o processo foi lançado por engano.`)) return;
    await sb.from('fups').delete().eq('demanda_id', id);
    await sb.from('validacao_itens').delete().eq('demanda_id', id);
    await sb.from('apontamentos_erro').delete().eq('demanda_id', id);
    const { error } = await sb.from('demandas').delete().eq('id', id);
    if (error) { $('mMsg').textContent = error.message; return; }
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
  // mostra só quem tem plantão no mês; os demais entram sob demanda (botão "+ Incluir colaborador")
  const comPlantao = new Set((esc_||[]).map(e => e.analista_id));
  if (!state.escalaExtras) state.escalaExtras = {};
  const extrasMes = state.escalaExtras[state.escalaMes] || [];
  const elegiveis = state.lookups.analistas.filter(a => !['Inativo','Desligado'].includes(a.status));
  const ans = state.lookups.analistas.filter(a => comPlantao.has(a.id) || extrasMes.includes(a.id));
  const disponiveis = elegiveis.filter(a => !comPlantao.has(a.id) && !extrasMes.includes(a.id));
  // Validação trabalhista básica: ninguém deveria ficar 7 dias seguidos sem folga
  const excessos7dias = ans.map(a => {
    let seq = 0, maxSeq = 0;
    for (let i=0;i<ndays;i++) { const dt = `${state.escalaMes}-${String(i+1).padStart(2,'0')}`; if (byKey[a.id+'|'+dt]) { seq++; maxSeq=Math.max(maxSeq,seq); } else seq=0; }
    return { nome: a.nome, maxSeq };
  }).filter(x => x.maxSeq >= 7);
  shell(`
    ${excessos7dias.length ? `<div class="alert-box" style="margin-bottom:14px">⚠️ <b>Atenção:</b> ${excessos7dias.map(x=>`${esc(x.nome)} (${x.maxSeq} dias seguidos)`).join(', ')} — verifique a escala, ninguém deveria trabalhar 7 dias seguidos sem folga.</div>` : ''}
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
        <h2 style="margin:0">📅 Escala de plantão</h2>
        <input type="month" id="escMes" value="${state.escalaMes}">
        <span style="color:var(--muted);font-size:12px">Clique numa célula para marcar/desmarcar o plantão</span>
        <div class="spacer"></div>
        ${disponiveis.length ? `<select id="escAddAnalista" style="min-width:160px"><option value="">+ Incluir colaborador…</option>
          ${disponiveis.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select>` : ''}
        ${state.role === 'admin' ? '<button id="escNovoColab" class="ghost">+ Cadastrar colaborador</button>' : ''}
      </div>
      <div style="overflow-x:auto">
      <table class="escala"><thead><tr><th>Analista</th>
        ${Array.from({length:ndays},(_,i)=>{const dw=new Date(y,m-1,i+1).getDay();return `<th class="${dw===0||dw===6?'wend':''}">${i+1}<br><span style="font-weight:400">${dows[dw]}</span></th>`}).join('')}
        <th>Total</th></tr></thead>
      <tbody>${ans.map(a => {
        let tot = 0, seq = 0, maxSeq = 0;
        const cells = Array.from({length:ndays},(_,i)=>{
          const dt = `${state.escalaMes}-${String(i+1).padStart(2,'0')}`;
          const on = byKey[a.id+'|'+dt]; if (on) { tot++; seq++; maxSeq = Math.max(maxSeq, seq); } else seq = 0;
          const dw = new Date(y,m-1,i+1).getDay();
          return `<td class="esc-cell ${on?'on':''} ${dw===0||dw===6?'wend':''}" data-a="${a.id}" data-d="${dt}">${on?'✕':''}</td>`;
        }).join('');
        return `<tr><td>${esc(a.nome)}${a.status==='Em licença' ? ' <span class="tag PENDENTE" style="font-size:10px">licença</span>' : ''}
          ${maxSeq>=7 ? ` <span class="tag PENDENTE" style="font-size:10px" title="Sem folga">⚠️ ${maxSeq}d seguidos</span>` : ''}
          ${tot===0 ? `<button class="ghost esc-remover" data-a="${a.id}" title="Tirar da escala deste mês" style="font-size:11px;padding:1px 5px;margin-left:4px">✕</button>` : ''}</td>${cells}<td><b>${tot}</b></td></tr>`;
      }).join('') || '<tr><td colspan="99" style="color:var(--muted)">Ninguém escalado neste mês. Use "+ Incluir colaborador" para montar a escala.</td></tr>'}
      <tr><td style="color:var(--muted)">Cobertura</td>${Array.from({length:ndays},(_,i)=>{
        const dt = `${state.escalaMes}-${String(i+1).padStart(2,'0')}`;
        const n = ans.filter(a=>byKey[a.id+'|'+dt]).length;
        return `<td style="color:${n===0?'var(--err)':'var(--muted)'}">${n}</td>`;
      }).join('')}<td></td></tr>
      </tbody></table></div>
    </div>`);
  escMes.onchange = (e) => { state.escalaMes = e.target.value; renderEscala(); };
  const escAdd = document.getElementById('escAddAnalista');
  if (escAdd) escAdd.onchange = (e) => {
    if (!e.target.value) return;
    state.escalaExtras[state.escalaMes] = [...(state.escalaExtras[state.escalaMes]||[]), e.target.value];
    renderEscala();
  };
  document.querySelectorAll('.esc-remover').forEach(b => b.onclick = () => {
    state.escalaExtras[state.escalaMes] = (state.escalaExtras[state.escalaMes]||[]).filter(x => x !== b.dataset.a);
    renderEscala();
  });
  const bNC = document.getElementById('escNovoColab');
  if (bNC) bNC.onclick = async () => {
    const nome = prompt('Nome do novo colaborador:');
    if (!nome || !nome.trim()) return;
    const cargo = (prompt('Cargo (analista, supervisor, coordenador):', 'analista') || 'analista').toLowerCase().trim();
    const { data, error } = await sb.from('analistas').insert({ nome: nome.trim(), cargo, status: 'Ativo' }).select('id').single();
    if (error) { alert(error.message); return; }
    await loadLookups();
    state.escalaExtras[state.escalaMes] = [...(state.escalaExtras[state.escalaMes]||[]), data.id];
    renderEscala();
  };
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
    ${dashSubTabs('insights')}
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
  document.querySelectorAll('.dash-subtab').forEach(b => b.onclick = () => { state.view = b.dataset.v; render(); });
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
    ${dashSubTabs('analytics')}
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
  document.querySelectorAll('.dash-subtab').forEach(b => b.onclick = () => { state.view = b.dataset.v; render(); });
}

// ---------- OPERAÇÕES (fila do dia) ----------
// Painel do dia: o que EU tenho para fazer agora (trabalho em aberto de verdade),
// em vez da antiga "fila de pendências" que vivia vazia porque todo processo já entra concluído.
async function renderOperacoes() {
  const hoje0 = new Date(); hoje0.setHours(0,0,0,0);
  const iniMes = new Date(hoje0.getFullYear(), hoje0.getMonth(), 1).toISOString();
  const meuEmail = state.session?.user?.email;
  const meuId = state.meuAnalistaId;
  const souGestao = state.role === 'admin';

  const [{ data: doDia }, { data: esteiraMinha }, { data: chamadosAbertos }, { data: apontAbertos }, { data: pendAntigas }] = await Promise.all([
    sb.from('demandas').select('id,numero,recebido_em,proponente1_nome,status,unidade,analista_id,analistas(nome),atividades(nome)')
      .gte('recebido_em', hoje0.toISOString()).order('recebido_em', { ascending: false }),
    sb.from('esteira_processos').select('*, etapas_esteira(nome), analistas(nome), clientes(nome)')
      .neq('status','CONCLUIDO').order('criado_em'),
    sb.from('chamados').select('*').neq('status','RESOLVIDO').order('criado_em', { ascending: false }),
    sb.from('apontamentos_erro').select('*, analistas(nome), demandas(numero)').eq('resolvido', false).order('criado_em', { ascending: false }),
    sb.from('demandas').select('id,numero,recebido_em,proponente1_nome,status,unidade,analistas(nome),atividades(nome)')
      .neq('status','CONCLUIDO').order('recebido_em').limit(50),
  ]);

  const meusDoDia = (doDia||[]).filter(d => !meuId || d.analista_id === meuId);
  const minhaEsteira = (esteiraMinha||[]).filter(p => meuId && p.analista_atual_id === meuId);
  const esteiraSemDono = (esteiraMinha||[]).filter(p => !p.analista_atual_id);
  const meusChamados = (chamadosAbertos||[]).filter(c => c.solicitante === meuEmail);
  const meusApont = (apontAbertos||[]).filter(a => meuId && a.analista_id === meuId);
  const prodMes = souGestao ? null : null;

  const tabelaEsteira = (lista, vazio) => lista.length ? `
    <div class="table-scroll"><table><thead><tr><th>Processo</th><th>Etapa atual</th><th>Esteira</th><th>Cliente</th><th>Prioridade</th><th></th></tr></thead>
    <tbody>${lista.map(p => `<tr>
      <td style="min-width:170px"><b>${esc(p.titulo)}</b>${p.unidade?`<br><span style="color:var(--muted);font-size:11px">${esc(p.unidade)}</span>`:''}</td>
      <td style="min-width:150px">${esc(p.etapas_esteira?.nome || '—')}</td>
      <td style="white-space:nowrap">${p.esteira_tipo==='analise_credito'?'Crédito':'Contrato'}</td>
      <td style="min-width:120px">${esc(p.clientes?.nome || '—')}</td>
      <td><span class="tag ${p.prioridade==='URGENTE'?'ERRO':p.prioridade==='ALTA'?'PENDENTE':'RECEBIDO'}">${esc(p.prioridade||'NORMAL')}</span></td>
      <td><button class="ghost btnEsteiraOp" data-id="${p.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`
    : `<div class="ok-box">${vazio}</div>`;

  shell(`
    <div class="kpis">
      <div class="kpi"><div class="v">${meusDoDia.length}</div><div class="l">📥 ${meuId ? 'Meus processos hoje' : 'Processos hoje'}</div></div>
      <div class="kpi"><div class="v" style="color:${minhaEsteira.length?'var(--warn)':'var(--ok)'}">${minhaEsteira.length}</div><div class="l">⛓️ Comigo na esteira</div></div>
      <div class="kpi"><div class="v" style="color:${esteiraSemDono.length?'var(--accent)':'var(--muted)'}">${esteiraSemDono.length}</div><div class="l">🙋 Na fila, sem responsável</div></div>
      <div class="kpi"><div class="v" style="color:${meusApont.length?'var(--err)':'var(--ok)'}">${meusApont.length}</div><div class="l">🔁 Retrabalho em aberto</div></div>
    </div>

    <div class="card">
      <h2>⛓️ Comigo na esteira — precisa da minha ação</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Processos parados esperando você concluir a etapa.</p>
      ${tabelaEsteira(minhaEsteira, meuId ? '✅ Nada parado com você. Tudo em dia!' : 'Seu usuário ainda não está vinculado a um colaborador — peça ao administrador em Administração → Usuários.')}
    </div>

    <div class="card">
      <h2>🙋 Fila da equipe — disponível para pegar</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Processos na esteira sem responsável definido.</p>
      ${tabelaEsteira(esteiraSemDono, 'Nenhum processo esperando na fila.')}
    </div>

    <div class="grid-cad">
      <div class="card">
        <h2>🔁 Retrabalho em aberto ${meuId ? '(meu)' : ''}</h2>
        ${meusApont.length ? meusApont.map(a => `
          <div class="cad-item"><span style="flex:1">
            <b>${esc(a.categoria)}</b>${a.subcategoria?` · ${esc(a.subcategoria)}`:''}
            ${a.demandas?.numero?`<span style="color:var(--muted);font-size:11px"> · proc. ${a.demandas.numero}</span>`:''}
            <br><span style="color:var(--muted);font-size:11.5px">${esc(a.descricao||'')}</span>
          </span></div>`).join('')
          : '<div class="ok-box">Nenhum apontamento em aberto. 🎉</div>'}
      </div>
      <div class="card">
        <h2>📨 Meus chamados em aberto</h2>
        ${meusChamados.length ? meusChamados.map(c => `
          <div class="cad-item"><span style="flex:1">
            <b>${esc(c.titulo)}</b> <span class="tag ${c.prioridade==='CRITICA'||c.prioridade==='ALTA'?'PENDENTE':'RECEBIDO'}">${esc(c.prioridade)}</span>
            <br><span style="color:var(--muted);font-size:11.5px">${esc(c.area)} · aberto ${fmtDt(c.criado_em)}</span>
          </span></div>`).join('')
          : '<div class="ok-box">Nenhum chamado seu em aberto.</div>'}
      </div>
    </div>

    ${(pendAntigas||[]).length ? `
    <div class="card">
      <h2>⚠️ Processos de produção ainda não concluídos</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Lançamentos que ficaram com status diferente de CONCLUÍDO.</p>
      <div class="table-scroll"><table><thead><tr><th>Nº</th><th>Recebido</th><th>Proponente</th><th>Unidade</th><th>Atividade</th><th>Analista</th><th>Status</th><th></th></tr></thead>
      <tbody>${pendAntigas.map(r => `<tr>
        <td style="white-space:nowrap">${r.numero ?? ''}</td><td style="white-space:nowrap">${fmtDt(r.recebido_em)}</td>
        <td style="min-width:150px">${esc(r.proponente1_nome)}</td><td style="white-space:nowrap">${esc(r.unidade)}</td>
        <td style="min-width:150px">${esc(r.atividades?.nome)}</td><td>${esc(r.analistas?.nome)}</td>
        <td><span class="tag ${esc(r.status)}">${esc(r.status)}</span></td>
        <td><button class="ghost btnEdit" data-id="${r.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>
    </div>` : ''}

    <div class="card">
      <h2>📥 ${meuId ? 'Meus lançamentos de hoje' : 'Lançamentos de hoje'} <span class="count-badge">${meusDoDia.length}</span></h2>
      ${meusDoDia.length ? `<div class="table-scroll"><table><thead><tr><th>Nº</th><th>Recebido</th><th>Proponente</th><th>Unidade</th><th>Atividade</th><th></th></tr></thead>
      <tbody>${meusDoDia.map(r => `<tr>
        <td style="white-space:nowrap">${r.numero ?? ''}</td><td style="white-space:nowrap">${fmtDt(r.recebido_em)}</td>
        <td style="min-width:150px">${esc(r.proponente1_nome)}</td><td style="white-space:nowrap">${esc(r.unidade)}</td>
        <td style="min-width:150px">${esc(r.atividades?.nome)}</td>
        <td><button class="ghost btnEdit" data-id="${r.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="msg">Nenhum lançamento hoje ainda. Registre em Produção → + Novo processo.</div>'}
    </div>`);
  document.querySelectorAll('.btnEdit').forEach(b => b.onclick = () => openForm(b.dataset.id));
  document.querySelectorAll('.btnEsteiraOp').forEach(b => b.onclick = async () => {
    const { data: etapas } = await sb.from('etapas_esteira').select('*').eq('ativa', true).order('ordem');
    openProcessoEsteira(b.dataset.id, etapas || []);
  });
}

// ---------- VALIDAÇÃO ----------
// ---------- FLUXOGRAMA DOS EMPREENDIMENTOS ----------
// page-id = id real de cada página do arquivo .drawio (índice numérico não funciona no viewer)
const FLUXOGRAMA_PAGINAS = [
  ['g7tDrnx4qy07mxVKubq6', 'Fluxograma Operacional'],
  ['8eP3mABcVWNyPqFSNTsO', 'ZS Urbanismo'],
  ['zadq-Cn9RUnA1Xxl6Kih', 'SDI'],
  ['xTK7jt2RhNq9oRxF_W2t', 'Global'],
  ['UrAwj3Xs5aZo8rY-Hq9-', 'Fazenda Lucrian / Pq. Cidade Nova'],
  ['wvZxZD5YK-0-P05viB4z', 'Guestier I/II/III / Mercadão'],
  ['BE7dgR82LCwuAWHNfJnf', 'Vilas'],
  ['u4Q8Gf_TTUcMiMgPlR2E', 'Vega'],
  ['4L8mdPEIc8UMsoZ0SPP1', 'Solicitação Interna'],
  ['BXweHFaPIJeWwWuiQwjT', '3z / ApMais / Saint Anne / Sequoia'],
  ['bt3pIUo-X3kEs7gZoVr0', 'Financiamento Bancário'],
  ['NHuvtxXpHFfzDSOA2OXL', 'Fluxograma Gerencial'],
];
async function renderFluxogramas() {
  const { data: enviados } = await sb.storage.from('fluxogramas-uploads').list('', { sortBy: { column: 'created_at', order: 'desc' } });
  const arquivos = (enviados||[]).filter(a => a.name !== '.emptyFolderPlaceholder');
  if (!state.fluxoPagina) state.fluxoPagina = FLUXOGRAMA_PAGINAS[0][0];
  const ehEnviado = arquivos.some(a => 'up:' + a.name === state.fluxoPagina);
  if (!ehEnviado && !/^\d+$/.test(state.fluxoPagina) && !FLUXOGRAMA_PAGINAS.some(([id])=>id===state.fluxoPagina)) state.fluxoPagina = FLUXOGRAMA_PAGINAS[0][0];
  let conteudo;
  if (ehEnviado) {
    const nome = state.fluxoPagina.slice(3);
    const { data: pub } = sb.storage.from('fluxogramas-uploads').getPublicUrl(nome);
    const ext = nome.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','webp','gif'].includes(ext)) {
      conteudo = `<img src="${esc(pub.publicUrl)}" style="width:100%;display:block">`;
    } else if (ext === 'pdf') {
      conteudo = `<embed src="${esc(pub.publicUrl)}" type="application/pdf" style="width:100%;height:78vh;border:0">`;
    } else if (ext === 'drawio') {
      const src2 = `https://viewer.diagrams.net/?highlight=0000ff&edit=_blank&layers=1&nav=1#U${encodeURIComponent(pub.publicUrl)}`;
      conteudo = `<iframe src="${src2}" style="width:100%;height:78vh;border:0;display:block"></iframe>`;
    } else {
      conteudo = `<div class="msg" style="margin:16px">Não é possível pré-visualizar este tipo de arquivo. <a href="${esc(pub.publicUrl)}" target="_blank">Baixar arquivo</a></div>`;
    }
  } else {
    const url = `${location.origin}/fluxogramas/sec-e-vendas3.drawio`;
    const src = `https://viewer.diagrams.net/?highlight=0000ff&edit=_blank&layers=1&nav=1&page-id=${encodeURIComponent(state.fluxoPagina)}#U${encodeURIComponent(url)}`;
    conteudo = `<iframe id="fluxoFrame" src="${src}" style="width:100%;height:78vh;border:0;display:block"></iframe>`;
  }
  shell(`
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">🗺️ Fluxograma dos Empreendimentos</h2>
        <span style="color:var(--muted);font-size:12.5px">Um fluxo por empreendedora/grupo, conforme desenhado.</span>
        <div class="spacer"></div>
        <select id="fluxoSelect">
          <optgroup label="Fluxogramas do sistema">
            ${FLUXOGRAMA_PAGINAS.map(([id,nome]) => `<option value="${id}" ${state.fluxoPagina===id?'selected':''}>${esc(nome)}</option>`).join('')}
          </optgroup>
          ${arquivos.length ? `<optgroup label="Enviados">
            ${arquivos.map(a => `<option value="up:${esc(a.name)}" ${state.fluxoPagina==='up:'+a.name?'selected':''}>${esc(a.name)}</option>`).join('')}
          </optgroup>` : ''}
        </select>
        ${state.role === 'admin' ? `
          <input type="file" id="fluxoUpload" accept=".drawio,.pdf,.png,.jpg,.jpeg,.webp" style="max-width:220px">
          ${ehEnviado ? '<button id="btnExcluirFluxo" class="ghost" style="color:var(--err)">🗑 Excluir este</button>' : ''}
        ` : ''}
      </div>
      <div class="msg" id="fluxoMsg" style="margin-top:6px"></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">${conteudo}</div>`);
  document.getElementById('fluxoSelect').onchange = (e) => { state.fluxoPagina = e.target.value; renderFluxogramas(); };
  const upInp = document.getElementById('fluxoUpload');
  if (upInp) upInp.onchange = async () => {
    const f = upInp.files[0]; if (!f) return;
    const msg = document.getElementById('fluxoMsg');
    msg.textContent = 'Enviando...';
    const { error } = await sb.storage.from('fluxogramas-uploads').upload(f.name, f, { upsert: true });
    if (error) { msg.textContent = error.message; return; }
    state.fluxoPagina = 'up:' + f.name;
    renderFluxogramas();
  };
  const bExFluxo = document.getElementById('btnExcluirFluxo');
  if (bExFluxo) bExFluxo.onclick = async () => {
    const nome = state.fluxoPagina.slice(3);
    if (!confirm(`Excluir "${nome}"? Essa ação não pode ser desfeita.`)) return;
    await sb.storage.from('fluxogramas-uploads').remove([nome]);
    state.fluxoPagina = FLUXOGRAMA_PAGINAS[0][0];
    renderFluxogramas();
  };
}

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
  if (state.clienteBusca === undefined) state.clienteBusca = '';
  const termoCli = state.clienteBusca.trim();
  let clientesEncontrados = [];
  if (termoCli.length >= 2) {
    const { data } = await sb.from('clientes').select('id,nome,unidade,status,empreendimentos(nome)').ilike('nome', `%${termoCli}%`).limit(15);
    clientesEncontrados = data || [];
  }
  const { data: fupsAll } = await sb.from('fups')
    .select('id,criado_em,autor,texto,demanda_id,demandas(numero,proponente1_nome,status)')
    .order('criado_em', { ascending: false }).limit(300);
  // Mensagens do incorporador (Portal do Cliente) ainda não lidas, no(s) processo(s) do analista logado
  const { data: msgsCliAll } = await sb.from('processo_mensagens')
    .select('id,processo_id,mensagem,criado_em,esteira_processos(id,titulo,esteira_tipo,analista_atual_id,analistas(nome))')
    .eq('autor_tipo', 'cliente').eq('lida', false).order('criado_em', { ascending: false });
  const msgsCliente = (msgsCliAll||[]).filter(m => m.esteira_processos &&
    (state.role === 'admin' || m.esteira_processos.analista_atual_id === state.meuAnalistaId));
  const termo = state.followupBusca.trim().toLowerCase();
  const fups = !termo ? (fupsAll||[]).slice(0,60) : (fupsAll||[]).filter(f =>
    (f.texto||'').toLowerCase().includes(termo) ||
    (f.autor||'').toLowerCase().includes(termo) ||
    (f.demandas?.proponente1_nome||'').toLowerCase().includes(termo) ||
    String(f.demandas?.numero||'').includes(termo));
  shell(`
    ${msgsCliente.length ? `
    <div class="card" style="border-color:var(--accent)">
      <h2>💬 Mensagens do incorporador sem resposta (${msgsCliente.length})</h2>
      ${msgsCliente.map(m => `
        <div class="fup">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
            <b>${esc(m.esteira_processos.titulo)}</b>
            <span style="color:var(--muted);font-size:12px">${esc(m.esteira_processos.analistas?.nome || 'sem analista')}</span>
            <span style="margin-left:auto;color:var(--muted);font-size:12px">${fmtDt(m.criado_em)}</span>
            <button class="ghost btnAbrirMsgCliente" data-id="${m.esteira_processos.id}" data-tipo="${esc(m.esteira_processos.esteira_tipo)}" style="padding:2px 8px">Abrir</button>
          </div>
          ${esc(m.mensagem)}
        </div>`).join('')}
    </div>` : ''}
    <div class="card filters" style="align-items:end">
      <div style="flex:1"><label>🔎 Perfil do cliente (nome completo, unidade, esteira e linha do tempo)</label>
        <input id="cliBusca" value="${esc(state.clienteBusca)}" placeholder="Digite o nome do cliente..."></div>
      ${state.clienteBusca ? '<button id="btnCliLimpar" class="ghost">Limpar</button>' : ''}
    </div>
    ${termoCli.length >= 2 ? `
    <div class="card">
      ${clientesEncontrados.length ? clientesEncontrados.map(c => `
        <div class="cad-item" style="cursor:pointer" data-cliente-id="${c.id}">
          <b>${esc(c.nome)}</b> — ${esc(c.empreendimentos?.nome || 'sem empreendimento')} ${c.unidade ? '· '+esc(c.unidade) : ''}
          <span class="tag ${c.status==='CONCLUIDO'?'CONCLUIDO':'RECEBIDO'}" style="margin-left:8px">${esc(c.status||'—')}</span>
        </div>`).join('') : '<p style="color:var(--muted);font-size:13px">Nenhum cliente encontrado com esse nome.</p>'}
    </div>` : ''}
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
  document.querySelectorAll('.btnAbrirMsgCliente').forEach(b => b.onclick = async () => {
    const { data: etapas } = await sb.from('etapas_esteira').select('*').eq('esteira_tipo', b.dataset.tipo).eq('ativa', true).order('ordem');
    openProcessoEsteira(b.dataset.id, etapas || []);
  });
  btnFupBuscar.onclick = () => { state.followupBusca = fupBusca.value; renderFollowup(); };
  fupBusca.addEventListener('keydown', e => { if (e.key === 'Enter') btnFupBuscar.click(); });
  const bL = document.getElementById('btnFupLimpar');
  if (bL) bL.onclick = () => { state.followupBusca = ''; renderFollowup(); };
  const cliBusca = document.getElementById('cliBusca');
  let cliTimer;
  cliBusca.addEventListener('input', () => { clearTimeout(cliTimer); cliTimer = setTimeout(() => { state.clienteBusca = cliBusca.value; renderFollowup(); }, 400); });
  const bCL = document.getElementById('btnCliLimpar');
  if (bCL) bCL.onclick = () => { state.clienteBusca = ''; renderFollowup(); };
  document.querySelectorAll('[data-cliente-id]').forEach(el => el.onclick = () => openPerfilCliente(el.dataset.clienteId));
}

async function openPerfilCliente(clienteId) {
  const [{ data: c }, { data: procs }, { data: eventos }] = await Promise.all([
    sb.from('clientes').select('*, empreendimentos(nome), analistas(nome)').eq('id', clienteId).single(),
    sb.from('esteira_processos').select('*, etapas_esteira(nome), analistas(nome)').eq('cliente_id', clienteId).order('criado_em', { ascending: false }),
    sb.from('eventos_repasse').select('*').eq('cliente_id', clienteId).order('criado_em', { ascending: false }),
  ]);
  // follow-ups não têm vínculo direto com cliente (fups referenciam demanda) — casamento por nome, melhor esforço
  const { data: fupsPossiveis } = await sb.from('fups')
    .select('id,criado_em,autor,texto,demandas(numero,proponente1_nome)')
    .order('criado_em', { ascending: false }).limit(500);
  const fupsDoCliente = (fupsPossiveis||[]).filter(f => (f.demandas?.proponente1_nome||'').toLowerCase().trim() === (c?.nome||'').toLowerCase().trim());

  const linha = [
    ...procs.map(p => ({ data: p.criado_em, tipo: 'Esteira', texto: `${p.titulo} — etapa atual: ${p.etapas_esteira?.nome || '—'} (${p.status})` })),
    ...(eventos||[]).map(e => ({ data: e.criado_em, tipo: 'Repasse', texto: e.evento || e.descricao || '—' })),
    ...fupsDoCliente.map(f => ({ data: f.criado_em, tipo: 'Follow-up', texto: `${esc(f.autor||'')}: ${f.texto}` })),
  ].sort((a,b) => new Date(b.data) - new Date(a.data));

  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:720px">
    <h2>👤 ${esc(c?.nome)}</h2>
    <div class="grid2" style="margin-bottom:14px">
      <div><label>CPF</label><input value="${esc(c?.cpf)}" disabled></div>
      <div><label>RG</label><input value="${esc(c?.rg)}" disabled></div>
      <div><label>Estado civil</label><input value="${esc(c?.estado_civil)}" disabled></div>
      <div><label>Renda</label><input value="${c?.renda ?? '—'}" disabled></div>
      <div><label>Telefone(s)</label><input value="${esc([c?.telefone1,c?.telefone2].filter(Boolean).join(' / '))}" disabled></div>
      <div><label>E-mail</label><input value="${esc(c?.email)}" disabled></div>
      <div style="grid-column:1/-1"><label>Endereço</label><input value="${esc(c?.endereco)}" disabled></div>
      <div><label>Empreendimento</label><input value="${esc(c?.empreendimentos?.nome)}" disabled></div>
      <div><label>Unidade</label><input value="${esc(c?.unidade)}" disabled></div>
      <div><label>Imobiliária</label><input value="${esc(c?.imobiliaria)}" disabled></div>
      <div><label>Corretor</label><input value="${esc(c?.corretor)}" disabled></div>
      <div><label>Banco / Correspondente</label><input value="${esc([c?.banco,c?.correspondente].filter(Boolean).join(' / '))}" disabled></div>
      <div><label>Responsável</label><input value="${esc(c?.analistas?.nome)}" disabled></div>
      <div><label>Status</label><input value="${esc(c?.status)}" disabled></div>
      ${c?.obs ? `<div style="grid-column:1/-1"><label>Observações</label><input value="${esc(c.obs)}" disabled></div>` : ''}
    </div>
    <h2 style="margin-top:6px">🕓 Linha do tempo — tudo que já foi feito com este cliente</h2>
    <div class="timeline" style="max-height:340px;overflow-y:auto">
      ${linha.length ? linha.map(l => `<div class="tl-item"><div class="tl-dot"></div>
        <div><b>${fmtDt(l.data)}</b> <span class="tag ${l.tipo==='Esteira'?'RECEBIDO':l.tipo==='Repasse'?'CONCLUIDO':'PENDENTE'}">${l.tipo}</span><br>${esc(l.texto)}</div></div>`).join('')
        : '<p style="color:var(--muted);font-size:12.5px">Nenhum evento registrado ainda para este cliente.</p>'}
    </div>
    <div style="display:flex;justify-content:end;margin-top:14px"><button id="pcFechar" class="ghost">Fechar</button></div>
  </div>`;
  document.body.appendChild(div);
  div.querySelector('#pcFechar').onclick = () => div.remove();
}

// ---------- CHAMADOS ENTRE ÁREAS (com disparo de e-mail) ----------
async function renderChamados() {
  const [{ data: rowsAll }, { data: areas }, { data: cfg }] = await Promise.all([
    sb.from('chamados').select('*').order('criado_em', { ascending: false }).limit(100),
    sb.from('areas_contato').select('*').eq('ativo', true).order('area'),
    sb.from('config_sistema').select('*').eq('id', 'email_remetente_padrao').maybeSingle(),
  ]);
  const remetentePadrao = cfg?.valor || 'secvendas@neoservice.com.br';
  // todos veem os chamados da equipe (transparência); mas cada um só abre/edita os seus
  const meuEmail = state.session?.user?.email;
  const rows = rowsAll || [];
  shell(`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <h2 style="margin:0">📨 Chamados entre Áreas</h2>
        <span style="color:var(--muted);font-size:12.5px">Chamados de toda a equipe — solicitação de boleto, documento, correção. Você edita apenas os seus.</span>
        <div class="spacer"></div>
        <button id="btnNovoCh">+ Novo chamado</button>
        ${state.role === 'admin' ? '<button id="btnAreasContato" class="ghost">⚙️ Áreas e e-mails</button>' : ''}
      </div>
      ${(rows||[]).length ? `<div style="overflow-x:auto"><table style="min-width:900px"><thead><tr>
        <th>Aberto em</th><th>Título</th><th>Processo</th><th>Área destino</th><th>E-mail</th><th>Solicitante</th><th>Prioridade</th><th>Status</th><th></th></tr></thead>
      <tbody>${(rows||[]).map(c => `<tr>
        <td>${fmtDt(c.criado_em)}</td><td><b>${esc(c.titulo)}</b></td>
        <td>${esc(c.processo_ref || '—')}</td><td>${esc(c.area)}</td>
        <td style="font-size:11.5px">${c.enviado_em ? `✉️ ${esc(c.email_destino||'')}<br><span style="color:var(--muted)">enviado ${fmtDt(c.enviado_em)}</span>` : `<span style="color:var(--muted)">não enviado</span>`}</td>
        <td style="font-size:11.5px">${esc(c.solicitante)}</td>
        <td><span class="tag ${c.prioridade==='CRITICA'||c.prioridade==='ALTA'?'PENDENTE':'RECEBIDO'}">${esc(c.prioridade)}</span></td>
        <td><span class="tag ${c.status==='RESOLVIDO'?'CONCLUIDO':c.status==='ABERTO'?'PENDENTE':'RECEBIDO'}">${esc(c.status)}</span></td>
        <td style="white-space:nowrap">
          <button class="ghost btnVerCh" data-id="${c.id}">Abrir</button>
          ${c.email_destino ? `<button class="ghost btnEmailCh" data-id="${c.id}">✉️</button>` : ''}
          ${c.status!=='RESOLVIDO' ? `<button class="ghost btnResolver" data-id="${c.id}">Resolver</button>` : ''}
        </td></tr>`).join('')}</tbody></table></div>`
      : '<div class="ok-box">Nenhum chamado aberto.</div>'}
    </div>`);
  document.getElementById('btnNovoCh').onclick = () => openChamado(null, areas||[], remetentePadrao);
  document.querySelectorAll('.btnVerCh').forEach(b => b.onclick = () => {
    const c = (rows||[]).find(x => x.id === b.dataset.id);
    openChamado(c, areas||[], remetentePadrao);
  });
  document.querySelectorAll('.btnEmailCh').forEach(b => b.onclick = () => {
    const c = (rows||[]).find(x => x.id === b.dataset.id);
    abrirEnvioEmail({ titulo: c.titulo, descricao: c.descricao, processo_ref: c.processo_ref,
      prioridade: c.prioridade, email_destino: c.email_destino, email_copia: c.email_copia }, c.id);
  });
  const bA = document.getElementById('btnAreasContato');
  if (bA) bA.onclick = () => openAreasContato(areas||[], remetentePadrao);
  document.querySelectorAll('.btnResolver').forEach(b => b.onclick = async () => {
    await sb.from('chamados').update({ status: 'RESOLVIDO', resolvido_em: new Date().toISOString() }).eq('id', b.dataset.id);
    renderChamados();
  });
}

async function openChamado(c, areas, remetentePadrao) {
  const novo = !c;
  // só quem abriu (ou admin) pode editar/enviar; os demais visualizam
  const souDono = novo || c.solicitante === state.session?.user?.email || state.role === 'admin';
  const ro = !souDono ? 'disabled' : '';
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:640px">
    <h2>${novo ? '📨 Novo chamado entre áreas' : '📨 ' + esc(c.titulo)}</h2>
    ${!souDono ? `<div class="msg" style="margin-bottom:10px">👀 Somente leitura — chamado aberto por <b>${esc(c.solicitante)}</b>.</div>` : ''}
    <div class="grid2">
      <div style="grid-column:1/-1"><label>Assunto / título</label>
        <input id="chTitulo" value="${esc(c?.titulo)}" placeholder="Ex.: Solicitação de boleto do ato — Unid. 1002" ${ro}></div>
      <div><label>Área de destino</label><select id="chArea" ${ro}>
        <option value="">— escolher —</option>
        ${areas.map(a=>`<option value="${esc(a.area)}" data-email="${esc(a.email)}" ${c?.area===a.area?'selected':''}>${esc(a.area)}</option>`).join('')}
        <option value="__outra__" ${c && !areas.some(a=>a.area===c.area) ? 'selected':''}>Outra área…</option>
      </select></div>
      <div><label>Prioridade</label><select id="chPrioridade" ${ro}>
        ${['BAIXA','NORMAL','ALTA','CRITICA'].map(p=>`<option ${(c?.prioridade||'NORMAL')===p?'selected':''}>${p}</option>`).join('')}</select></div>
      <div id="chAreaOutraWrap" style="grid-column:1/-1;display:none"><label>Nome da área</label>
        <input id="chAreaOutra" value="${c && !areas.some(a=>a.area===c.area) ? esc(c.area) : ''}" placeholder="Ex.: Gestão Bancária" ${ro}></div>
      <div><label>De (remetente)</label><input id="chDe" value="${esc(c?.email_remetente || remetentePadrao)}" ${ro}></div>
      <div><label>Para (e-mail destino)</label><input id="chPara" value="${esc(c?.email_destino)}" placeholder="area@neoservice.com.br" ${ro}></div>
      <div><label>Cópia (opcional)</label><input id="chCopia" value="${esc(c?.email_copia)}" placeholder="separar por vírgula" ${ro}></div>
      <div><label>Processo / unidade (opcional)</label><input id="chProc" value="${esc(c?.processo_ref)}" placeholder="Ex.: 9954 — Unid.1002" ${ro}></div>
      <div style="grid-column:1/-1"><label>Mensagem</label>
        <textarea id="chDesc" rows="6" placeholder="Descreva o que precisa: valores, prazos, anexos..." ${ro}>${esc(c?.descricao)}</textarea></div>
    </div>
    ${!novo ? `
    <h2 style="margin-top:16px;font-size:15px">📎 Anexos</h2>
    <div id="chAnexos" class="anexo-list"><p style="color:var(--muted);font-size:12.5px">Carregando...</p></div>
    ${souDono ? `<div style="display:flex;gap:8px;align-items:center;margin-top:8px">
      <input id="chArquivo" type="file" style="flex:1">
      <button id="btnChUpload" class="ghost">⬆ Anexar</button>
    </div>` : ''}` : ''}
    ${c?.enviado_em ? `<div class="ok-box" style="margin-top:10px">✉️ E-mail enviado em ${fmtDt(c.enviado_em)} por ${esc(c.enviado_por||'')}</div>` : ''}
    <div class="msg" id="chMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px;flex-wrap:wrap">
      <button id="chCancel" class="ghost">Fechar</button>
      ${!novo && state.role==='admin' ? '<button id="chExcluir" class="ghost" style="color:var(--err)">🗑️ Excluir</button>' : ''}
      ${souDono ? `<button id="chSalvar" class="ghost">${novo ? 'Só registrar' : 'Salvar'}</button>
      <button id="chEnviar">✉️ ${c?.enviado_em ? 'Reenviar' : 'Registrar e enviar e-mail'}</button>` : ''}
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  const syncArea = () => {
    const sel = $('chArea');
    const opt = sel.options[sel.selectedIndex];
    const outra = sel.value === '__outra__';
    $('chAreaOutraWrap').style.display = outra ? '' : 'none';
    if (!outra && opt?.dataset.email && !$('chPara').value) $('chPara').value = opt.dataset.email;
    if (!outra && opt?.dataset.email) $('chPara').value = opt.dataset.email;
  };
  if (souDono) $('chArea').onchange = syncArea;
  if (c && !areas.some(a=>a.area===c.area)) $('chAreaOutraWrap').style.display = '';
  $('chCancel').onclick = () => div.remove();

  const carregarAnexos = async () => {
    if (novo) return;
    const { data: anexos } = await sb.from('chamados_anexos').select('*').eq('chamado_id', c.id).order('criado_em', { ascending: false });
    const wrap = $('chAnexos');
    wrap.innerHTML = (anexos||[]).map(a => `
      <div class="anexo-item">${iconeArquivo(a.nome)}
        <span style="flex:1">${esc(a.nome)}</span>
        <span style="color:var(--muted2);font-size:11px">${esc(a.criado_por||'')}</span>
        <button class="ghost anexo-baixar" data-path="${esc(a.storage_path)}" data-nome="${esc(a.nome)}">⬇</button>
        ${souDono ? `<button class="ghost anexo-excluir" data-id="${a.id}" data-path="${esc(a.storage_path)}">✕</button>` : ''}
      </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nenhum anexo ainda.</p>';
    wrap.querySelectorAll('.anexo-baixar').forEach(b => b.onclick = async () => {
      const { data } = await sb.storage.from('chamados-anexos').createSignedUrl(b.dataset.path, 60);
      if (data) window.open(data.signedUrl, '_blank');
    });
    wrap.querySelectorAll('.anexo-excluir').forEach(b => b.onclick = async () => {
      await sb.storage.from('chamados-anexos').remove([b.dataset.path]);
      await sb.from('chamados_anexos').delete().eq('id', b.dataset.id);
      carregarAnexos();
    });
  };
  carregarAnexos();
  const bUp = $('btnChUpload');
  if (bUp) bUp.onclick = async () => {
    const f = $('chArquivo').files[0];
    if (!f) { $('chMsg').textContent = 'Selecione um arquivo primeiro.'; return; }
    bUp.disabled = true;
    const path = `${c.id}/${Date.now()}-${f.name}`;
    const { error } = await sb.storage.from('chamados-anexos').upload(path, f);
    if (error) { $('chMsg').textContent = error.message; bUp.disabled = false; return; }
    await sb.from('chamados_anexos').insert({ chamado_id: c.id, nome: f.name, storage_path: path, criado_por: state.session?.user?.email });
    $('chArquivo').value = '';
    bUp.disabled = false;
    carregarAnexos();
  };

  const coletar = () => {
    const areaSel = $('chArea').value;
    return {
      titulo: $('chTitulo').value.trim(),
      area: areaSel === '__outra__' ? $('chAreaOutra').value.trim() : areaSel,
      prioridade: $('chPrioridade').value,
      email_remetente: $('chDe').value.trim() || null,
      email_destino: $('chPara').value.trim() || null,
      email_copia: $('chCopia').value.trim() || null,
      processo_ref: $('chProc').value.trim() || null,
      descricao: $('chDesc').value.trim() || null,
      solicitante: c?.solicitante || state.session?.user?.email,
    };
  };
  const salvar = async (extra = {}) => {
    const rec = { ...coletar(), ...extra };
    if (!rec.titulo) { $('chMsg').textContent = 'Informe o assunto do chamado.'; return null; }
    if (!rec.area) { $('chMsg').textContent = 'Escolha a área de destino.'; return null; }
    const r = c ? await sb.from('chamados').update(rec).eq('id', c.id).select().single()
                : await sb.from('chamados').insert(rec).select().single();
    if (r.error) { $('chMsg').textContent = r.error.message; return null; }
    return r.data;
  };
  if ($('chSalvar')) $('chSalvar').onclick = async () => { if (await salvar()) { div.remove(); renderChamados(); } };
  if ($('chEnviar')) $('chEnviar').onclick = async () => {
    const rec = coletar();
    if (!rec.email_destino) { $('chMsg').textContent = 'Informe o e-mail de destino.'; return; }
    const salvo = await salvar({ enviado_em: new Date().toISOString(), enviado_por: state.session?.user?.email });
    if (!salvo) return;
    div.remove();
    abrirEnvioEmail(rec, salvo.id);
  };
  const bEx = $('chExcluir');
  if (bEx) bEx.onclick = async () => {
    if (!confirm(`Excluir o chamado "${c.titulo}"?`)) return;
    await sb.from('chamados').delete().eq('id', c.id);
    div.remove(); renderChamados();
  };
}

// Monta o e-mail pronto e oferece várias formas de enviar (mailto depende de cliente configurado,
// então também damos Outlook Web, Gmail e "copiar tudo" — sempre funciona em alguma das opções).
// Anexo de verdade não dá pra mandar via link de e-mail (bloqueio do navegador), então os arquivos
// anexados ao chamado entram como link de download direto no corpo da mensagem.
// Monta o e-mail de "primeiro acesso" já pronto, com a senha temporária e o passo a passo,
// e oferece os mesmos jeitos de enviar do Chamados (Outlook Web, Gmail, app local, copiar tudo).
function abrirEnvioAcessoEmail(email, senha, nivel) {
  const NIVEL_LABEL = { admin: 'Admin', analista: 'Analista', leitura: 'Leitura', cliente: 'Cliente (portal externo)' };
  const url = 'https://secretaria-vendas-gestao.netlify.app';
  const corpo = [
    'Olá!',
    '',
    'Seu acesso ao sistema de gestão da Secretaria de Vendas foi criado.',
    '',
    `Link de acesso: ${url}`,
    `E-mail de login: ${email}`,
    `Senha provisória: ${senha}`,
    `Nível de acesso: ${NIVEL_LABEL[nivel] || nivel}`,
    '',
    'Passo a passo do primeiro acesso:',
    '1. Acesse o link acima.',
    '2. Entre com o e-mail e a senha provisória informados.',
    '3. No menu, use a opção "Trocar minha senha" para criar sua própria senha.',
    '',
    'Qualquer dúvida, fale com o administrador do sistema.',
    '',
    '— Sistema de Gestão da Secretaria de Vendas',
  ].join('\n');
  const assunto = 'Seu acesso ao sistema da Secretaria de Vendas';
  const enc = (s) => encodeURIComponent(s);
  const mailtoUrl = `mailto:${email}?subject=${enc(assunto)}&body=${enc(corpo)}`;
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${enc(email)}&subject=${enc(assunto)}&body=${enc(corpo)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(email)}&su=${enc(assunto)}&body=${enc(corpo)}`;
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:620px">
    <h2>✉️ Enviar instruções de primeiro acesso</h2>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:12px">O acesso já foi criado. Escolha como enviar o e-mail com a senha provisória:</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button id="acOutlook">📧 Abrir no Outlook Web</button>
      <button id="acMailto" class="ghost">💻 Abrir no app de e-mail</button>
      <button id="acGmail" class="ghost">Abrir no Gmail</button>
      <button id="acCopiar" class="ghost">📋 Copiar tudo</button>
    </div>
    <div class="grid2">
      <div style="grid-column:1/-1"><label>Para</label><input value="${esc(email)}" readonly></div>
      <div style="grid-column:1/-1"><label>Assunto</label><input value="${esc(assunto)}" readonly></div>
      <div style="grid-column:1/-1"><label>Mensagem</label><textarea id="acCorpo" rows="12" readonly>${esc(corpo)}</textarea></div>
    </div>
    <div class="msg" id="acMsg"></div>
    <div style="display:flex;justify-content:end;margin-top:14px"><button id="acFechar" class="ghost">Fechar</button></div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('acFechar').onclick = () => div.remove();
  $('acOutlook').onclick = () => window.open(outlookUrl, '_blank', 'noopener');
  $('acGmail').onclick = () => window.open(gmailUrl, '_blank', 'noopener');
  $('acMailto').onclick = () => { window.location.href = mailtoUrl; };
  $('acCopiar').onclick = async () => {
    const txt = `Para: ${email}\nAssunto: ${assunto}\n\n${corpo}`;
    try { await navigator.clipboard.writeText(txt); $('acMsg').textContent = '✅ Copiado! Cole no seu e-mail.'; }
    catch { $('acCorpo').select(); $('acMsg').textContent = 'Selecione o texto e copie com Ctrl+C.'; }
  };
}

async function abrirEnvioEmail(rec, chamadoId) {
  const { data: anexos } = await sb.from('chamados_anexos').select('*').eq('chamado_id', chamadoId);
  const links = [];
  for (const a of (anexos||[])) {
    const { data: assinado } = await sb.storage.from('chamados-anexos').createSignedUrl(a.storage_path, 60*60*24*7);
    if (assinado) links.push(`${a.nome}: ${assinado.signedUrl}`);
  }
  const corpo = [
    rec.descricao || '',
    '',
    rec.processo_ref ? `Processo/Unidade: ${rec.processo_ref}` : '',
    `Prioridade: ${rec.prioridade}`,
    links.length ? '\nAnexos (link válido por 7 dias):\n' + links.join('\n') : '',
    '',
    `— Enviado pelo Sistema de Gestão da Secretaria de Vendas (chamado ${String(chamadoId).slice(0,8)})`,
  ].filter(Boolean).join('\n');
  const enc = (s) => encodeURIComponent(s).replace(/%20/g, '%20');
  const mailtoUrl = `mailto:${rec.email_destino}?subject=${enc(rec.titulo)}&body=${enc(corpo)}${rec.email_copia ? '&cc='+enc(rec.email_copia) : ''}`;
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${enc(rec.email_destino)}&subject=${enc(rec.titulo)}&body=${enc(corpo)}${rec.email_copia ? '&cc='+enc(rec.email_copia) : ''}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(rec.email_destino)}&su=${enc(rec.titulo)}&body=${enc(corpo)}${rec.email_copia ? '&cc='+enc(rec.email_copia) : ''}`;

  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:620px">
    <h2>✉️ Enviar chamado por e-mail</h2>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:12px">O chamado já foi registrado no sistema. Escolha como enviar o e-mail:</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button id="evOutlook">📧 Abrir no Outlook Web</button>
      <button id="evMailto" class="ghost">💻 Abrir no app de e-mail</button>
      <button id="evGmail" class="ghost">Abrir no Gmail</button>
      <button id="evCopiar" class="ghost">📋 Copiar tudo</button>
    </div>
    <div class="grid2">
      <div><label>Para</label><input id="evPara" value="${esc(rec.email_destino)}" readonly></div>
      <div><label>Cópia</label><input id="evCc" value="${esc(rec.email_copia)}" readonly></div>
      <div style="grid-column:1/-1"><label>Assunto</label><input id="evAssunto" value="${esc(rec.titulo)}" readonly></div>
      <div style="grid-column:1/-1"><label>Mensagem</label><textarea id="evCorpo" rows="9" readonly>${esc(corpo)}</textarea></div>
    </div>
    <div class="msg" id="evMsg"></div>
    <div style="display:flex;justify-content:end;margin-top:14px"><button id="evFechar" class="ghost">Fechar</button></div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('evFechar').onclick = () => { div.remove(); renderChamados(); };
  $('evOutlook').onclick = () => window.open(outlookUrl, '_blank', 'noopener');
  $('evGmail').onclick = () => window.open(gmailUrl, '_blank', 'noopener');
  $('evMailto').onclick = () => { window.location.href = mailtoUrl; };
  $('evCopiar').onclick = async () => {
    const txt = `Para: ${rec.email_destino}\n${rec.email_copia ? 'Cc: '+rec.email_copia+'\n' : ''}Assunto: ${rec.titulo}\n\n${corpo}`;
    try { await navigator.clipboard.writeText(txt); $('evMsg').textContent = '✅ Copiado! Cole no seu e-mail.'; }
    catch { $('evCorpo').select(); $('evMsg').textContent = 'Selecione o texto e copie com Ctrl+C.'; }
  };
}

async function openAreasContato(areas, remetentePadrao) {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:560px">
    <h2>⚙️ Áreas e e-mails</h2>
    <div style="margin-bottom:14px">
      <label>E-mail remetente padrão (aparece como "De" nos chamados)</label>
      <div style="display:flex;gap:8px">
        <input id="acRemetente" value="${esc(remetentePadrao)}" style="flex:1">
        <button id="acSalvarRemetente" class="ghost">Salvar</button>
      </div>
    </div>
    <h2 style="font-size:14px">Áreas de destino</h2>
    <div id="acLista">${areas.map(a => `
      <div class="cad-item" style="display:flex;gap:8px;align-items:center">
        <span style="flex:1"><b>${esc(a.area)}</b><br><span style="color:var(--muted);font-size:12px">${esc(a.email)}</span></span>
        <button class="ghost ac-del" data-id="${a.id}">✕</button>
      </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nenhuma área cadastrada.</p>'}</div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <input id="acNovaArea" placeholder="Nome da área" style="flex:1;min-width:130px">
      <input id="acNovoEmail" placeholder="email@neoservice.com.br" style="flex:2;min-width:180px">
      <button id="acAdd" class="ghost">+ Adicionar</button>
    </div>
    <div class="msg" id="acMsg"></div>
    <div style="display:flex;justify-content:end;margin-top:14px"><button id="acFechar" class="ghost">Fechar</button></div>
  </div>`;
  document.body.appendChild(div);
  div.querySelector('#acFechar').onclick = () => { div.remove(); renderChamados(); };
  div.querySelector('#acSalvarRemetente').onclick = async () => {
    const v = div.querySelector('#acRemetente').value.trim();
    const { error } = await sb.from('config_sistema').upsert({ id: 'email_remetente_padrao', valor: v, atualizado_em: new Date().toISOString() });
    div.querySelector('#acMsg').textContent = error ? error.message : '✅ Remetente padrão salvo.';
  };
  div.querySelector('#acAdd').onclick = async () => {
    const area = div.querySelector('#acNovaArea').value.trim();
    const email = div.querySelector('#acNovoEmail').value.trim();
    if (!area || !email) { div.querySelector('#acMsg').textContent = 'Informe nome da área e e-mail.'; return; }
    const { error } = await sb.from('areas_contato').insert({ area, email });
    if (error) { div.querySelector('#acMsg').textContent = error.message; return; }
    div.remove(); renderChamados();
  };
  div.querySelectorAll('.ac-del').forEach(b => b.onclick = async () => {
    await sb.from('areas_contato').delete().eq('id', b.dataset.id);
    div.remove(); renderChamados();
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
    <table><thead><tr><th>Pendência</th><th>Área</th><th>Status</th></tr></thead>
    <tbody>${pendencias.map(p=>`<tr>
      <td>${esc(p.pendencia)}</td><td>${esc(p.area||'—')}</td>
      <td>${ro ? `<span class="tag ${p.status_validacao==='Recebido'?'CONCLUIDO':p.status_validacao==='Em validação'?'RECEBIDO':'PENDENTE'}">${esc(p.status_validacao||'Pendente')}</span>`
        : `<select class="pd-status" data-id="${p.id}">
          ${['Pendente','Em validação','Recebido'].map(s=>`<option ${(p.status_validacao||'Pendente')===s?'selected':''}>${s}</option>`).join('')}
        </select>`}</td>
    </tr>`).join('') || '<tr><td colspan="3" style="color:var(--muted)">Sem pendências registradas.</td></tr>'}</tbody></table>
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
  div.querySelectorAll('.pd-status').forEach(s => s.onchange = async () => {
    await sb.from('implantacao_pendencias').update({ status_validacao: s.value, resolvida: s.value === 'Recebido' }).eq('id', s.dataset.id);
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
  'Dados cadastrais': ['Nome/grafia', 'CPF/RG', 'E-mail faltante', 'E-mails trocados', 'Telefone', 'Endereço', 'Estado civil', 'Profissão/renda'],
  'Documental': ['Documento faltante', 'Documento ilegível', 'Documento vencido', 'Assinatura ausente', 'Documento incorreto', 'Falta de documento na análise do processo'],
  'Contratual': ['Envio para assinatura errado', 'Cláusula incorreta', 'Quadro resumo divergente', 'Minuta desatualizada', 'Testemunha/assinante errado', 'Validação de contrato incorreta'],
  'Cálculo / Valores': ['Valor da unidade', 'Fluxo de pagamento', 'Comissionamento', 'Correção/juros', 'Desconto indevido'],
  'Análise de Crédito': ['Informação faltante', 'Validação de renda divergente', 'Verificação de proposta com informação divergente'],
  'Sistema / Cadastro': ['Cadastro no ERP', 'Cadastro no CRM', 'Unidade errada', 'Status incorreto'],
  'Prazo / SLA': ['Fora do prazo de emissão', 'Atraso no SLA', 'Resposta errada', 'Follow-up não realizado'],
  'Outro': ['Digitar manualmente…'],
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
  const meuId = state.meuAnalistaId || (state.lookups.analistas.find(a => a.nome === state.perfilNome) || {}).id;
  const visiveis = souGestao ? lista : lista.filter(a => a.analista_id === meuId);
  const { data: solicitacoesPendentes } = souGestao
    ? await sb.from('apontamento_exclusao_solicitacoes').select('*, apontamentos_erro(categoria, subcategoria, descricao, analistas(nome))').eq('status', 'pendente').order('criado_em', { ascending: false })
    : { data: null };
  const meusIdsApontamentos = visiveis.map(a => a.id);
  const { data: minhasSolicitacoes } = meusIdsApontamentos.length
    ? await sb.from('apontamento_exclusao_solicitacoes').select('apontamento_id, status').in('apontamento_id', meusIdsApontamentos)
    : { data: [] };
  const statusSolicitacaoPorApontamento = {};
  (minhasSolicitacoes || []).forEach(s => { if (s.status === 'pendente') statusSolicitacaoPorApontamento[s.apontamento_id] = 'pendente'; });
  const porCat = {}; visiveis.forEach(a => porCat[a.categoria] = (porCat[a.categoria]||0)+1);
  const porAnalista = {};
  visiveis.forEach(a => {
    const n = a.analistas?.nome || '—';
    const reg = porAnalista[n] = porAnalista[n] || { total: 0, cats: {} };
    reg.total++;
    reg.cats[a.categoria] = (reg.cats[a.categoria]||0) + 1;
  });
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
      ${souGestao ? `<div class="kpi"><div class="v" style="color:${(solicitacoesPendentes||[]).length?'var(--err)':'var(--ok)'}">${(solicitacoesPendentes||[]).length}</div><div class="l">🗑️ Exclusões aguardando aprovação</div></div>` : ''}
    </div>
    ${souGestao && (solicitacoesPendentes||[]).length ? `<div class="card" style="margin-bottom:14px;border:1px solid var(--err)">
      <h2>🗑️ Solicitações de exclusão pendentes</h2>
      ${solicitacoesPendentes.map(s => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:13px"><b>${esc(s.apontamentos_erro?.analistas?.nome || '—')}</b> pediu exclusão de: ${esc(s.apontamentos_erro?.categoria||'—')} ${s.apontamentos_erro?.subcategoria?'· '+esc(s.apontamentos_erro.subcategoria):''}</div>
          <div style="color:var(--muted);font-size:12px;margin:4px 0">${esc(s.apontamentos_erro?.descricao||'—')}</div>
          <div style="color:var(--text);font-size:12.5px;background:var(--panel2);padding:8px 10px;border-radius:6px;margin-bottom:8px"><b>Motivo alegado:</b> ${esc(s.motivo)}</div>
          <div style="display:flex;gap:8px">
            <button class="btn-aprovar-excl" data-id="${s.id}" data-apt="${s.apontamento_id}">✔ Aprovar exclusão</button>
            <button class="ghost btn-rejeitar-excl" data-id="${s.id}">✕ Rejeitar</button>
          </div>
        </div>`).join('')}
    </div>` : ''}
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
        ${Object.entries(porAnalista).sort((a,b)=>b[1].total-a[1].total).map(([n,reg],i)=>`
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
              <b>${esc(nomeExib(n,i+1))}</b><span style="color:var(--muted)">${reg.total} apontamento${reg.total>1?'s':''}</span>
            </div>
            ${Object.entries(reg.cats).sort((a,b)=>b[1]-a[1]).map(([cat,q])=>`
              <div class="hbar-row" style="padding-left:10px">
                <span class="hbar-lbl" style="font-size:11.5px;color:var(--muted)">${esc(cat)}</span>
                <div class="hbar"><div style="width:${Math.round(100*q/reg.total)}%"></div></div><b style="font-size:12px">${q}</b>
              </div>`).join('')}
          </div>`).join('')
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
        <td>
          ${state.role!=='leitura' && !a.resolvido ? `<button class="ghost btn-resolver" data-id="${a.id}">Resolver</button>` : ''}
          ${state.role!=='leitura' ? (statusSolicitacaoPorApontamento[a.id] === 'pendente'
            ? `<span class="tag PENDENTE" title="Aguardando aprovação do administrador">Exclusão pendente</span>`
            : `<button class="ghost btn-excluir-apont" data-id="${a.id}" title="Solicitar exclusão (apontamento indevido)">✕</button>`) : ''}
        </td>
      </tr>`).join('') || '<tr><td colspan="9">Nenhum apontamento registrado neste mês.</td></tr>'}</tbody></table>
    </div>`);
  document.getElementById('qualMes').onchange = (e) => { state.qualMes = e.target.value; renderQualidade(); };
  const bN = document.getElementById('btnNovoApont');
  if (bN) bN.onclick = () => openApontamento();
  document.querySelectorAll('.btn-resolver').forEach(b => b.onclick = async () => {
    await sb.from('apontamentos_erro').update({ resolvido: true }).eq('id', b.dataset.id);
    renderQualidade();
  });
  document.querySelectorAll('.btn-excluir-apont').forEach(b => b.onclick = () => openSolicitarExclusaoApontamento(b.dataset.id));
  document.querySelectorAll('.btn-aprovar-excl').forEach(b => b.onclick = async () => {
    if (!confirm('Aprovar a exclusão? O apontamento será removido definitivamente.')) return;
    await sb.from('apontamento_exclusao_solicitacoes').update({ status: 'aprovado', decidido_por_email: state.session?.user?.email, decidido_em: new Date().toISOString() }).eq('id', b.dataset.id);
    await sb.from('apontamentos_erro').delete().eq('id', b.dataset.apt);
    renderQualidade();
  });
  document.querySelectorAll('.btn-rejeitar-excl').forEach(b => b.onclick = async () => {
    await sb.from('apontamento_exclusao_solicitacoes').update({ status: 'rejeitado', decidido_por_email: state.session?.user?.email, decidido_em: new Date().toISOString() }).eq('id', b.dataset.id);
    renderQualidade();
  });
}

function openSolicitarExclusaoApontamento(apontamentoId) {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:460px">
    <h2>🗑️ Solicitar exclusão do apontamento</h2>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Use quando o apontamento foi registrado por engano, de forma indevida, ou o processo não deveria ter sido devolvido. Um administrador vai analisar e aprovar (ou não) essa exclusão.</p>
    <div><label>Por que esse apontamento deve ser excluído?</label><textarea id="seMotivo" rows="4" placeholder="Explique o motivo..."></textarea></div>
    <div class="msg" id="seMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="seCancel" class="ghost">Cancelar</button><button id="seEnviar">Enviar para aprovação</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('seCancel').onclick = () => div.remove();
  $('seEnviar').onclick = async () => {
    const motivo = $('seMotivo').value.trim();
    if (!motivo) { $('seMsg').textContent = 'Explique o motivo antes de enviar.'; return; }
    $('seEnviar').disabled = true; $('seMsg').textContent = 'Enviando...';
    const { error } = await sb.from('apontamento_exclusao_solicitacoes').insert({
      apontamento_id: apontamentoId, solicitado_por_email: state.session?.user?.email, motivo,
    });
    if (error) { $('seMsg').textContent = error.message; $('seEnviar').disabled = false; return; }
    div.remove();
    renderQualidade();
  };
}

async function openApontamento() {
  const L = state.lookups;
  const equipe = L.analistas.filter(a => !['Inativo','Desligado'].includes(a.status));
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
        ${Object.keys(CATEGORIAS_ERRO).map(c=>`<option>${c}</option>`).join('')}
        <option value="__custom__">✏️ Digitar categoria manualmente…</option></select></div>
      <div><label>Detalhe</label><select id="apSub"></select></div>
      <div id="apCatCustomWrap" style="display:none;grid-column:1/-1"><label>Categoria (digitada)</label><input id="apCatCustom" placeholder="Ex.: Falha de comunicação com imobiliária"></div>
      <div id="apSubCustomWrap" style="display:none;grid-column:1/-1"><label>Detalhe (digitado)</label><input id="apSubCustom" placeholder="Descreva o detalhe específico"></div>
      <div style="grid-column:1/-1"><label>Nº do processo (opcional)</label><input id="apProc" placeholder="Busque pelo número do processo"></div>
      <div style="grid-column:1/-1"><label>Descrição do que ocorreu</label><textarea id="apDesc" rows="4" placeholder="Ex.: e-mail do comprador digitado errado, contrato voltou para correção"></textarea></div>
    </div>
    <div class="msg" id="apMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="apCancel" class="ghost">Cancelar</button><button id="apSalvar">Registrar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const subs = () => {
    const c = div.querySelector('#apCat').value;
    const custom = c === '__custom__';
    div.querySelector('#apCatCustomWrap').style.display = custom ? '' : 'none';
    div.querySelector('#apSub').style.display = custom ? 'none' : '';
    div.querySelector('#apSub').innerHTML = custom ? '' : (CATEGORIAS_ERRO[c]||[]).map(s=>`<option>${s}</option>`).join('') + '<option value="__custom__">✏️ Digitar detalhe manualmente…</option>';
    subSub();
  };
  const subSub = () => {
    const s = div.querySelector('#apSub').value;
    div.querySelector('#apSubCustomWrap').style.display = (s === '__custom__' && div.querySelector('#apCat').value !== '__custom__') ? '' : 'none';
  };
  subs();
  div.querySelector('#apCat').onchange = subs;
  div.querySelector('#apSub').onchange = subSub;
  div.querySelector('#apCancel').onclick = () => div.remove();
  div.querySelector('#apSalvar').onclick = async () => {
    const num = div.querySelector('#apProc').value.trim();
    let demandaId = null;
    if (num) {
      const { data } = await sb.from('demandas').select('id').eq('numero', num).maybeSingle();
      demandaId = data?.id || null;
      if (!demandaId) { div.querySelector('#apMsg').textContent = `Processo nº ${num} não encontrado. Deixe em branco ou corrija.`; return; }
    }
    const catRaw = div.querySelector('#apCat').value;
    const subRaw = div.querySelector('#apSub').value;
    let categoria, subcategoria;
    if (catRaw === '__custom__') {
      categoria = div.querySelector('#apCatCustom').value.trim();
      if (!categoria) { div.querySelector('#apMsg').textContent = 'Digite a categoria.'; return; }
      subcategoria = null;
    } else {
      categoria = catRaw;
      subcategoria = subRaw === '__custom__' ? (div.querySelector('#apSubCustom').value.trim() || null) : subRaw;
    }
    const { error } = await sb.from('apontamentos_erro').insert({
      demanda_id: demandaId,
      categoria, subcategoria,
      analista_id: div.querySelector('#apAnalista').value || null,
      origem: div.querySelector('#apOrigem').value,
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
    sb.from('meta_colaborador_resultado').select('*'),
  ]);
  const porInd = {};
  (mensal || []).forEach(r => { (porInd[r.indicador_id] = porInd[r.indicador_id] || {})[r.mes.slice(0,7)] = r; });
  const meses = Array.from({length:12}, (_,i) => `${state.metaAno}-${String(i+1).padStart(2,'0')}`);
  const TRIM = [['1º Trim', 0, 3], ['2º Trim', 3, 6], ['3º Trim', 6, 9], ['4º Trim', 9, 12]];
  // Replica a fórmula exata da planilha de referência: Esperado = Processos × Meta;
  // Ating.% = (Processos - Erros) / Esperado — por isso pode passar de 100% quando o time
  // erra menos do que o esperado pra aquele volume (não é "1 - taxa de erro simples").
  const esperado = (r, meta) => r ? r.quantidade_processos * meta : null;
  const atingimento = (r, meta) => (!r || !r.quantidade_processos) ? null
    : (r.quantidade_processos - r.quantidade_erros) / esperado(r, meta);
  const pctTxt = (v) => v === null ? '—' : (v*100).toFixed(0) + '%';
  const cor = (v) => v === null ? 'var(--muted)' : v >= 1 ? 'var(--ok)' : v >= 0.95 ? 'var(--warn)' : 'var(--err)';
  // agregado do trimestre: soma processos e erros do período (não média de percentuais)
  const trimestre = (indId, ini, fim, meta) => {
    const rs = meses.slice(ini, fim).map(m => (porInd[indId]||{})[m]).filter(Boolean);
    if (!rs.length) return null;
    const p = rs.reduce((s,r)=>s+r.quantidade_processos,0);
    const e = rs.reduce((s,r)=>s+r.quantidade_erros,0);
    const esp = p * meta;
    return esp ? (p - e) / esp : null;
  };
  const anos = [...new Set([anoAtual, anoAtual-1, ...(mensal||[]).map(r=>+r.mes.slice(0,4))])].sort((a,b)=>b-a);

  // ===== Resultado individual PONDERADO (replica as abas "Resultado <nome>" da planilha) =====
  // Cada colaborador tem indicadores e PESOS próprios, que mudam por trimestre.
  const linhasAno = (porAnalistaRaw||[]).filter(r => r.mes.slice(0,4) === String(state.metaAno));
  const porAnalista = {};
  linhasAno.forEach(r => {
    const a = porAnalista[r.analista] = porAnalista[r.analista] || { nome: r.analista, status: r.status_analista, linhas: [] };
    a.linhas.push(r);
  });
  // colaboradores ativos/em licença aparecem mesmo sem lançamento (ex.: Yara em licença conta zerada)
  (state.lookups.analistas||[]).filter(a => a.cargo === 'analista' && ['Ativo','Em licença'].includes(a.status))
    .forEach(a => { if (!porAnalista[a.nome]) porAnalista[a.nome] = { nome: a.nome, status: a.status, linhas: [] }; });

  // nota ponderada de um mês = Σ (atingimento_final do indicador × peso)
  const notaMes = (linhas, mes) => {
    const doMes = linhas.filter(l => l.mes.slice(0,7) === mes && l.atingimento_final !== null && l.peso);
    if (!doMes.length) return null;
    const somaPesos = doMes.reduce((s,l)=>s+Number(l.peso),0);
    if (!somaPesos) return null;
    return doMes.reduce((s,l)=>s+Number(l.atingimento_final)*Number(l.peso),0) / somaPesos;
  };
  const ranking = Object.values(porAnalista).map(a => {
    const notas = meses.map(m => notaMes(a.linhas, m));
    const comNota = notas.filter(v => v !== null);
    const media = comNota.length ? comNota.reduce((s,v)=>s+v,0)/comNota.length : null;
    const idxUlt = notas.map((v,i)=>v!==null?i:-1).filter(i=>i>=0);
    const ultimoPct = idxUlt.length ? notas[idxUlt[idxUlt.length-1]] : null;
    const penult = idxUlt.length > 1 ? notas[idxUlt[idxUlt.length-2]] : null;
    const proc = a.linhas.reduce((s,l)=>s+l.quantidade_processos,0);
    const err = a.linhas.reduce((s,l)=>s+l.quantidade_erros,0);
    return { ...a, notas, media, ultimoPct, tend: (ultimoPct!==null&&penult!==null)?ultimoPct-penult:null, proc, err };
  }).sort((a,b) => (b.media??-1) - (a.media??-1));
  const statusTag = (a) => a.status === 'Desligado' ? '⚫ Desligado' : a.status === 'Em licença' ? '🔵 Em licença'
    : a.media === null ? '—' : a.media >= 1.02 ? '🟢 Excelente' : a.media >= 0.95 ? '🟢 Ótimo' : a.media >= 0.90 ? '🟡 Atenção' : '🔴 Abaixo da meta';
  const naMeta = ranking.filter(a => a.status === 'Ativo' && a.media !== null && a.media >= 0.95).length;
  const ativosComDado = ranking.filter(a => a.status === 'Ativo' && a.media !== null).length;
  if (!state.metaColaborador && ranking.length) state.metaColaborador = ranking[0].nome;
  const dashInd = ranking.find(a => a.nome === state.metaColaborador) || ranking[0];
  // indicadores do colaborador selecionado (com peso do trimestre) para a tabela detalhada
  const indsDoColab = dashInd ? [...new Set(dashInd.linhas.map(l => l.indicador))] : [];

  // ===== META DA EQUIPE (replica a aba DASHBOARD da planilha) =====
  // atingimento da equipe no mês = média das notas ponderadas de quem tem lançamento
  const notaEquipeMes = (mi) => {
    const ns = ranking.map(a => a.notas[mi]).filter(v => v !== null && v !== undefined);
    return ns.length ? ns.reduce((s,v)=>s+v,0)/ns.length : null;
  };
  const notasEquipe = meses.map((_, i) => notaEquipeMes(i));
  const mesesLancados = notasEquipe.filter(v => v !== null).length;
  const comNotaEq = notasEquipe.filter(v => v !== null);
  const atingEquipe = comNotaEq.length ? comNotaEq.reduce((s,v)=>s+v,0)/comNotaEq.length : null;
  const mesesNaMeta = notasEquipe.filter(v => v !== null && v >= 1).length;
  const processosTotais = linhasAno.reduce((s,l)=>s+l.quantidade_processos,0);
  const errosTotais = linhasAno.reduce((s,l)=>s+l.quantidade_erros,0);
  const taxaErroGlobal = processosTotais ? errosTotais/processosTotais : null;
  const errosPorMes = mesesLancados ? Math.round(errosTotais/mesesLancados) : 0;
  const ultimaNotaEq = [...notasEquipe].reverse().find(v => v !== null) ?? null;
  // acompanhamento mensal da meta da equipe: processos, erros e atingimento mês a mês
  const acompMensal = meses.map((m, i) => {
    const doMes = linhasAno.filter(l => l.mes.slice(0,7) === m);
    const proc = doMes.reduce((s,l)=>s+l.quantidade_processos,0);
    const err = doMes.reduce((s,l)=>s+l.quantidade_erros,0);
    return { mes: m, proc, err, taxaErro: proc ? err/proc : null, ating: notasEquipe[i] };
  });

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
      <h2 style="margin:0 0 10px">🎯 Meta da equipe — ${state.metaAno}</h2>
      <div class="kpis">
        <div class="kpi"><div class="v" style="color:${atingEquipe===null?'var(--muted)':atingEquipe>=1?'var(--ok)':atingEquipe>=0.95?'var(--warn)':'var(--err)'}">${pctTxt(atingEquipe)}</div><div class="l">📊 Atingimento médio da equipe</div></div>
        <div class="kpi"><div class="v">${processosTotais.toLocaleString('pt-BR')}</div><div class="l">📋 Processos totais · ${mesesLancados} ${mesesLancados===1?'mês':'meses'}</div></div>
        <div class="kpi"><div class="v" style="color:${errosTotais>0?'var(--warn)':'var(--ok)'}">${errosTotais}</div><div class="l">⚠️ Erros internos · ${errosPorMes}/mês em média</div></div>
        <div class="kpi"><div class="v" style="color:${taxaErroGlobal===null?'var(--muted)':taxaErroGlobal<=0.02?'var(--ok)':'var(--warn)'}">${taxaErroGlobal===null?'—':(taxaErroGlobal*100).toFixed(2)+'%'}</div><div class="l">📉 Taxa de erro global</div></div>
        <div class="kpi"><div class="v" style="color:${naMeta===ativosComDado&&ativosComDado>0?'var(--ok)':'var(--warn)'}">${naMeta} / ${ativosComDado}</div><div class="l">👥 Colaboradores na meta (≥95%)</div></div>
      </div>
      <div class="grid-cad" style="margin-top:4px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
            <b>Progresso da meta da equipe</b>
            <span style="color:var(--muted)">${atingEquipe===null ? '—' : atingEquipe>=1 ? '✅ meta atingida' : `faltam ${((1-atingEquipe)*100).toFixed(1)}% para 100%`}</span>
          </div>
          <div class="hbar" style="height:14px"><div style="width:${atingEquipe===null?0:Math.min(100,Math.round(atingEquipe*100))}%;background:${atingEquipe>=1?'var(--ok)':'var(--accent)'}"></div></div>
          <p style="color:var(--muted);font-size:12px;margin-top:6px">
            <b>${mesesNaMeta}</b> de <b>${mesesLancados}</b> ${mesesLancados===1?'mês lançado atingiu':'meses lançados atingiram'} a meta ·
            <b>${mesesLancados}</b> de 12 meses lançados (faltam ${12-mesesLancados})
          </p>
        </div>
        <div>
          <div style="font-size:12.5px;margin-bottom:4px"><b>Evolução do desempenho da equipe</b>
            ${ultimaNotaEq!==null ? `<span style="color:var(--muted)"> · último mês ${(ultimaNotaEq*100).toFixed(1)}%</span>` : ''}</div>
          <svg viewBox="0 0 700 80" style="width:100%;height:80px">
            ${svgLine(notasEquipe.map(v => v === null ? 0 : v*100), 700, 80, '#2dd4bf', false)}
          </svg>
          <div style="font-size:11px;color:var(--muted)">${meses.map(m=>mesLabel(m).slice(0,3)).join(' · ')}</div>
        </div>
      </div>
      <h2 style="margin:18px 0 8px;font-size:14px">📅 Acompanhamento mensal da meta da equipe — ${state.metaAno}</h2>
      <table><thead><tr><th>Mês</th><th>Processos</th><th>Erros</th><th>Taxa de erro</th><th>Atingimento</th></tr></thead>
      <tbody>${acompMensal.map(r => `<tr>
        <td>${mesLabel(r.mes)}</td>
        <td>${r.proc.toLocaleString('pt-BR')}</td>
        <td>${r.err}</td>
        <td>${r.taxaErro===null?'—':(r.taxaErro*100).toFixed(2)+'%'}</td>
        <td style="font-weight:600;color:${r.ating===null?'var(--muted)':r.ating>=1?'var(--ok)':r.ating>=0.95?'var(--warn)':'var(--err)'}">${pctTxt(r.ating)}</td>
      </tr>`).join('')}</tbody></table>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h2 style="margin:0 0 4px">🏆 Ranking individual — nota ponderada (todos os indicadores × peso)</h2>
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
    ${dashInd ? `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <h2 style="margin:0">📊 Dash individual</h2>
        <select id="metaColaborador">${ranking.map(a=>`<option value="${esc(a.nome)}" ${state.metaColaborador===a.nome?'selected':''}>${esc(a.nome)}</option>`).join('')}</select>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="v">${pctTxt(dashInd.media)}</div><div class="l">Atingimento médio</div></div>
        <div class="kpi"><div class="v">${pctTxt(dashInd.ultimoPct)}</div><div class="l">Último mês</div></div>
        <div class="kpi"><div class="v">${dashInd.proc}</div><div class="l">Processos</div></div>
        <div class="kpi"><div class="v" style="color:${dashInd.err>0?'var(--warn)':'var(--ok)'}">${dashInd.err}</div><div class="l">Erros</div></div>
        <div class="kpi"><div class="v" style="font-size:13px">${statusTag(dashInd)}</div><div class="l">Status</div></div>
      </div>
      <svg viewBox="0 0 700 90" style="width:100%;height:90px;margin-top:10px">
        ${svgLine(dashInd.notas.map(v => v === null ? 0 : v*100), 700, 90, '#2dd4bf', false)}
      </svg>
      <div style="font-size:11px;color:var(--muted);margin-bottom:12px">— nota ponderada (%) mês a mês em ${state.metaAno}</div>
      <h2 style="font-size:14px;margin:14px 0 6px">Indicadores de ${esc(dashInd.nome)} — com peso do trimestre</h2>
      <div style="overflow-x:auto"><table style="min-width:820px">
        <thead><tr><th style="text-align:left">Indicador</th><th>Alvo</th><th>Peso</th>
          ${meses.map(m=>`<th>${mesLabel(m).slice(0,3)}</th>`).join('')}</tr></thead>
        <tbody>
        ${indsDoColab.map(ind => {
          const porMes = {}; dashInd.linhas.filter(l=>l.indicador===ind).forEach(l => porMes[l.mes.slice(0,7)] = l);
          const qualquer = Object.values(porMes)[0] || {};
          return `<tr>
            <td style="font-size:12px">${esc(ind)}</td>
            <td>${qualquer.alvo ? (qualquer.alvo*100).toFixed(0)+'%' : '—'}</td>
            <td>${qualquer.peso ? (qualquer.peso*100).toFixed(0)+'%' : '—'}</td>
            ${meses.map(m=>{ const l = porMes[m];
              if (!l || l.atingimento_final === null) return '<td style="color:var(--muted)">—</td>';
              const v = Number(l.atingimento_final);
              return `<td style="color:${v>=1?'var(--ok)':v>=0.95?'var(--warn)':'var(--err)'};font-weight:600"
                title="${l.quantidade_processos} processos · ${l.quantidade_erros} erros">${(v*100).toFixed(0)}%</td>`;
            }).join('')}
          </tr>`;
        }).join('') || `<tr><td colspan="${3+meses.length}" style="color:var(--muted)">Nenhum indicador configurado para este colaborador em ${state.metaAno}.</td></tr>`}
        <tr style="border-top:2px solid var(--border)">
          <td><b>Nota ponderada do mês</b></td><td></td><td></td>
          ${dashInd.notas.map(v => `<td style="font-weight:700;color:${v===null?'var(--muted)':v>=1?'var(--ok)':v>=0.95?'var(--warn)':'var(--err)'}">${v===null?'—':(v*100).toFixed(0)+'%'}</td>`).join('')}
        </tr>
        </tbody></table></div>
      <div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-top:12px">
        ${TRIM.map(([lbl,i,f])=>{
          const ns = dashInd.notas.slice(i,f).filter(v=>v!==null);
          const v = ns.length ? ns.reduce((s,x)=>s+x,0)/ns.length : null;
          return `<div class="kpi"><div class="v" style="font-size:20px;color:${v===null?'var(--muted)':v>=1?'var(--ok)':v>=0.95?'var(--warn)':'var(--err)'}">${v===null?'—':(v*100).toFixed(1)+'%'}</div><div class="l">${lbl}</div></div>`;
        }).join('')}
      </div>
      <p style="color:var(--muted);font-size:12.5px;margin-top:10px"><b>Pontos de atenção:</b> ${
        dashInd.status==='Desligado' ? 'Colaborador desligado — histórico mantido para referência.'
        : dashInd.status==='Em licença' ? 'Colaborador em licença — indicadores zerados no período, sem cobrança de meta.'
        : dashInd.media===null ? 'Sem dados suficientes ainda.'
        : dashInd.media>=1.02 ? 'Desempenho excelente — acima da meta. Reforçar e reconhecer.'
        : dashInd.media>=0.95 ? 'Dentro da meta, desempenho ótimo. Manter o padrão.'
        : dashInd.media>=0.90 ? 'Atenção: perto do limite da meta. Acompanhar de perto.'
        : 'Abaixo da meta — priorizar plano de ação/treinamento com este colaborador.'
      }</p>
      ${state.role === 'admin' ? '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button id="btnPesos" class="ghost">⚖️ Configurar indicadores e pesos</button><button id="btnLancarInd" class="ghost">✏️ Lançar resultado individual</button></div>' : ''}
    </div>` : ''}
    ${(kpis||[]).map(k => {
      const meta = Number(k.meta_percentual);
      const serie = meses.map(m => atingimento((porInd[k.id]||{})[m], meta));
      const comDado = serie.filter(v => v !== null);
      const mediaAno = comDado.length ? comDado.reduce((s,v)=>s+v,0)/comDado.length : null;
      return `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <h2 style="margin:0;font-size:15px">${esc(k.nome)}</h2>
          <span class="tag ${mediaAno===null?'':mediaAno>=1?'CONCLUIDO':'ERRO'}">Meta ${(meta*100).toFixed(0)}%</span>
          <div class="spacer"></div>
          <span style="font-size:12.5px;color:var(--muted)">Média do ano:</span>
          <b style="color:${cor(mediaAno)}">${pctTxt(mediaAno)}</b>
        </div>
        <div style="overflow-x:auto">
          <table style="min-width:840px">
            <thead><tr><th style="text-align:left">Mês</th>
              ${meses.map(m=>`<th>${mesLabel(m).slice(0,3)}</th>`).join('')}</tr></thead>
            <tbody>
              <tr><td style="color:var(--muted)">Meta</td>
                ${meses.map(()=>`<td style="color:var(--muted)">${(meta*100).toFixed(0)}%</td>`).join('')}</tr>
              <tr><td><b>Ating.</b></td>
                ${serie.map(v=>`<td style="color:${cor(v)};font-weight:600">${pctTxt(v)}</td>`).join('')}</tr>
              <tr><td style="color:var(--muted)">Quantidade de processo</td>
                ${meses.map(m=>`<td style="color:var(--muted)">${(porInd[k.id]||{})[m]?.quantidade_processos ?? '—'}</td>`).join('')}</tr>
              <tr><td style="color:var(--muted)">Quantidade Erros</td>
                ${meses.map(m=>{const r=(porInd[k.id]||{})[m];return `<td style="color:${r&&r.quantidade_erros>0?'var(--err)':'var(--muted)'}">${r?r.quantidade_erros:'—'}</td>`;}).join('')}</tr>
              <tr><td style="color:var(--muted)">Esperado</td>
                ${meses.map(m=>{const r=(porInd[k.id]||{})[m];const e=esperado(r,meta);return `<td style="color:var(--muted)">${e===null?'—':e.toFixed(1)}</td>`;}).join('')}</tr>
              <tr><td style="color:var(--muted)">Ating.</td>
                ${meses.map(m=>{const r=(porInd[k.id]||{})[m];return `<td style="color:var(--muted)">${r?(r.quantidade_processos-r.quantidade_erros):'—'}</td>`;}).join('')}</tr>
            </tbody>
          </table>
        </div>
        <div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-top:10px">
          ${TRIM.map(([lbl,i,f])=>{const v=trimestre(k.id,i,f,meta);
            return `<div class="kpi"><div class="v" style="font-size:20px;color:${cor(v)}">${pctTxt(v)}</div><div class="l">${lbl}</div></div>`;}).join('')}
        </div>
      </div>`;
    }).join('')}`);
  document.getElementById('metaAno').onchange = (e) => { state.metaAno = Number(e.target.value); renderMetas(); };
  const mc = document.getElementById('metaColaborador');
  if (mc) mc.onchange = (e) => { state.metaColaborador = e.target.value; renderMetas(); };
  const bP = document.getElementById('btnPesos');
  if (bP) bP.onclick = () => openPesosColaborador(kpis, dashInd);
  const bLI = document.getElementById('btnLancarInd');
  if (bLI) bLI.onclick = () => openLancarIndividual(kpis, dashInd);
  const bE = document.getElementById('btnEditarMetas');
  if (bE) bE.onclick = () => openLancarIndicadores(kpis, porInd);
}

async function openPesosColaborador(kpis, colab) {
  const analista = (state.lookups.analistas||[]).find(a => a.nome === colab.nome);
  if (!analista) { alert('Colaborador não encontrado no cadastro.'); return; }
  const trimAtual = Math.ceil((new Date().getMonth()+1)/3);
  const div = document.createElement('div');
  div.className = 'modal-bg';
  const render = async (trim) => {
    const { data: cfgs } = await sb.from('meta_colaborador_indicador').select('*')
      .eq('analista_id', analista.id).eq('ano', state.metaAno).eq('trimestre', trim);
    const porInd = {}; (cfgs||[]).forEach(c => porInd[c.indicador_id] = c);
    div.innerHTML = `<div class="modal" style="width:620px">
      <h2>⚖️ Indicadores e pesos — ${esc(colab.nome)}</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:12px">Os pesos mudam a cada trimestre. Marque só os indicadores que valem para este colaborador; a soma dos pesos deve dar 100%.</p>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        ${[1,2,3,4].map(t=>`<button class="ghost pc-trim ${t===trim?'active':''}" data-t="${t}">${t}º Trim ${state.metaAno}</button>`).join('')}
      </div>
      <div>${kpis.map(k => {
        const c = porInd[k.id];
        return `<div style="display:flex;gap:8px;align-items:center;border-top:1px solid var(--border);padding:8px 0">
          <input type="checkbox" class="pc-on" data-id="${k.id}" ${c?'checked':''}>
          <span style="flex:1;font-size:12.5px">${esc(k.nome)}</span>
          <span style="font-size:11px;color:var(--muted)">alvo</span>
          <input class="pc-alvo" data-id="${k.id}" type="number" step="0.01" min="0" max="1" value="${c?.alvo ?? k.meta_percentual}" style="width:70px">
          <span style="font-size:11px;color:var(--muted)">peso %</span>
          <input class="pc-peso" data-id="${k.id}" type="number" step="1" min="0" max="100" value="${c ? Math.round(c.peso*100) : ''}" style="width:70px">
        </div>`;
      }).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <b id="pcSoma" style="font-size:13px"></b>
        <div class="msg" id="pcMsg" style="margin:0"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
        <button id="pcFechar" class="ghost">Fechar</button><button id="pcSalvar">Salvar ${trim}º trimestre</button>
      </div>
    </div>`;
    const soma = () => {
      let s = 0;
      div.querySelectorAll('.pc-on').forEach(c => { if (c.checked) {
        const p = div.querySelector(`.pc-peso[data-id="${c.dataset.id}"]`).value;
        s += Number(p||0);
      }});
      div.querySelector('#pcSoma').textContent = `Soma dos pesos: ${s}%`;
      div.querySelector('#pcSoma').style.color = s === 100 ? 'var(--ok)' : 'var(--warn)';
    };
    soma();
    div.querySelectorAll('.pc-on, .pc-peso').forEach(el => el.oninput = soma);
    div.querySelectorAll('.pc-trim').forEach(b => b.onclick = () => render(Number(b.dataset.t)));
    div.querySelector('#pcFechar').onclick = () => { div.remove(); renderMetas(); };
    div.querySelector('#pcSalvar').onclick = async () => {
      await sb.from('meta_colaborador_indicador').delete()
        .eq('analista_id', analista.id).eq('ano', state.metaAno).eq('trimestre', trim);
      const linhas = [];
      div.querySelectorAll('.pc-on').forEach(c => {
        if (!c.checked) return;
        const alvo = Number(div.querySelector(`.pc-alvo[data-id="${c.dataset.id}"]`).value || 0);
        const peso = Number(div.querySelector(`.pc-peso[data-id="${c.dataset.id}"]`).value || 0) / 100;
        if (peso > 0) linhas.push({ analista_id: analista.id, indicador_id: c.dataset.id, ano: state.metaAno, trimestre: trim, alvo, peso });
      });
      if (linhas.length) {
        const { error } = await sb.from('meta_colaborador_indicador').insert(linhas);
        if (error) { div.querySelector('#pcMsg').textContent = error.message; return; }
      }
      div.remove(); renderMetas();
    };
  };
  document.body.appendChild(div);
  render(trimAtual);
}

async function openLancarIndividual(kpis, colab) {
  const analista = (state.lookups.analistas||[]).find(a => a.nome === colab.nome);
  if (!analista) { alert('Colaborador não encontrado no cadastro.'); return; }
  const mesPadrao = new Date().toISOString().slice(0,7);
  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:620px">
    <h2>✏️ Lançar resultado — ${esc(colab.nome)}</h2>
    <div style="margin-bottom:12px"><label>Mês de referência</label><input id="liMes" type="month" value="${mesPadrao}"></div>
    <div id="liCampos"></div>
    <div class="msg" id="liMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="liCancel" class="ghost">Cancelar</button><button id="liSalvar">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const campos = async () => {
    const m = div.querySelector('#liMes').value;
    const trim = Math.ceil(Number(m.slice(5,7))/3);
    const [{ data: cfgs }, { data: atuais }] = await Promise.all([
      sb.from('meta_colaborador_indicador').select('*').eq('analista_id', analista.id).eq('ano', Number(m.slice(0,4))).eq('trimestre', trim),
      sb.from('meta_colaborador_mensal').select('*').eq('analista_id', analista.id).eq('mes', m + '-01'),
    ]);
    const porInd = {}; (atuais||[]).forEach(r => porInd[r.indicador_id] = r);
    const ativos = (cfgs||[]).map(c => ({ ...c, nome: (kpis.find(k=>k.id===c.indicador_id)||{}).nome }));
    div.querySelector('#liCampos').innerHTML = ativos.length ? ativos.map(c => {
      const r = porInd[c.indicador_id] || {};
      return `<div style="border-top:1px solid var(--border);padding:10px 0">
        <div style="font-size:12.5px;margin-bottom:6px"><b>${esc(c.nome)}</b> <span style="color:var(--muted)">· alvo ${(c.alvo*100).toFixed(0)}% · peso ${(c.peso*100).toFixed(0)}%</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:110px"><label>Processos</label><input class="li-qtd" data-id="${c.indicador_id}" type="number" min="0" value="${r.quantidade_processos ?? ''}"></div>
          <div style="flex:1;min-width:110px"><label>Erros</label><input class="li-err" data-id="${c.indicador_id}" type="number" min="0" value="${r.quantidade_erros ?? ''}"></div>
        </div>
        <div style="margin-top:6px"><label>Descrição / observação</label><textarea class="li-desc" data-id="${c.indicador_id}" rows="2">${esc(r.descricao)}</textarea></div>
      </div>`;
    }).join('') : '<p style="color:var(--warn);font-size:12.5px">Nenhum indicador configurado para este colaborador neste trimestre. Use "⚖️ Configurar indicadores e pesos" primeiro.</p>';
  };
  await campos();
  div.querySelector('#liMes').onchange = campos;
  div.querySelector('#liCancel').onclick = () => div.remove();
  div.querySelector('#liSalvar').onclick = async () => {
    const mes = div.querySelector('#liMes').value + '-01';
    const linhas = [];
    div.querySelectorAll('.li-qtd').forEach(inp => {
      const id = inp.dataset.id;
      const err = div.querySelector(`.li-err[data-id="${id}"]`);
      const desc = div.querySelector(`.li-desc[data-id="${id}"]`);
      if (inp.value === '' && err.value === '') return;
      linhas.push({ analista_id: analista.id, indicador_id: id, mes,
        quantidade_processos: Number(inp.value||0), quantidade_erros: Number(err.value||0),
        descricao: desc.value || null, atualizado_em: new Date().toISOString() });
    });
    if (!linhas.length) { div.querySelector('#liMsg').textContent = 'Preencha ao menos um indicador.'; return; }
    const { error } = await sb.from('meta_colaborador_mensal').upsert(linhas, { onConflict: 'analista_id,indicador_id,mes' });
    if (error) { div.querySelector('#liMsg').textContent = error.message; return; }
    div.remove(); renderMetas();
  };
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
    .select('numero,recebido_em,numero_processo,proponente1_nome,proponente1_cpf,proponente2_nome,proponente2_cpf,unidade,status,analistas(nome),empreendedoras(nome),empreendimentos(nome),atividades(nome)')
    .eq('fat_mensal', true)
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
        <button id="btnCsv" class="ghost">⬇ Exportar planilha de fechamento</button>
        ${state.role !== 'leitura' ? '<button id="btnImportarFech" class="ghost">⬆ Importar planilha</button>' : ''}
        <span style="color:var(--muted);font-size:13px">${(rows||[]).length} processos faturados no mês</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        ${Object.entries(grp).sort((a,b)=>b[1].length-a[1].length).map(([an, rs]) =>
          `<a href="#fech-${encodeURIComponent(an)}" class="tag RECEBIDO" style="text-decoration:none">${esc(an)}: <b>${rs.length}</b></a>`).join('')}
      </div>
      ${Object.entries(grp).sort((a,b)=>b[1].length-a[1].length).map(([an, rs]) => `
        <h2 id="fech-${encodeURIComponent(an)}" style="margin-top:14px">${esc(an)} — ${rs.length} processos</h2>
        <div class="table-scroll">
        <table><thead><tr><th>Nº</th><th>Data</th><th>Canal</th><th>1º Proponente</th><th>CPF 1º</th><th>2º Proponente</th><th>CPF 2º</th><th>Empreendedora</th><th>Empreendimento</th><th>Unidade</th><th>Atividade</th></tr></thead>
        <tbody>${rs.map(r => `<tr>
          <td style="white-space:nowrap">${r.numero ?? ''}</td><td style="white-space:nowrap">${fmtDt(r.recebido_em)}</td><td style="white-space:nowrap">${esc(r.numero_processo)}</td>
          <td style="min-width:150px">${esc(r.proponente1_nome)}</td><td style="white-space:nowrap">${esc(r.proponente1_cpf)}</td>
          <td style="min-width:150px">${esc(r.proponente2_nome) || '<span style="color:var(--muted2)">—</span>'}</td>
          <td style="white-space:nowrap">${esc(r.proponente2_cpf) || '<span style="color:var(--muted2)">—</span>'}</td>
          <td style="min-width:120px">${esc(r.empreendedoras?.nome)}</td><td style="min-width:130px">${esc(r.empreendimentos?.nome)}</td>
          <td style="white-space:nowrap">${esc(r.unidade)}</td><td style="min-width:160px">${esc(r.atividades?.nome)}</td>
          </tr>`).join('')}</tbody></table></div>`).join('') || '<div class="msg">Nenhum processo faturado no mês selecionado.</div>'}
    </div>`);
  fechMes.onchange = (e) => { state.fechMes = e.target.value; renderFechamento(); };
  const bImpF = document.getElementById('btnImportarFech');
  if (bImpF) bImpF.onclick = () => abrirImportarPlanilha(renderFechamento);
  // Exporta no MESMO layout da planilha de fechamento usada pela equipe
  btnCsv.onclick = async () => {
    btnCsv.disabled = true; const rotulo = btnCsv.textContent; btnCsv.textContent = 'Gerando...';
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    btnCsv.disabled = false; btnCsv.textContent = rotulo;
    const dataCurta = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '';
    const linhas = (rows||[]).map(r => ({
      'Nome do Analista': r.analistas?.nome || '',
      'Nº do processo': r.numero_processo || '',
      'Data do execução': dataCurta(r.recebido_em),
      'Nome 1° Proponente': r.proponente1_nome || '',
      'CPF 1° Proponente': r.proponente1_cpf || '',
      'Nome 2° Proponente': r.proponente2_nome || '',
      'CPF 2° Proponente': r.proponente2_cpf || '',
      'Consulta Serasa': /serasa/i.test(r.atividades?.nome || '') ? 'SIM' : 'NÃO',
      'Empreendedora': r.empreendedoras?.nome || '',
      'Empreendimento': r.empreendimentos?.nome || '',
      'Unidade': r.unidade || '',
      'Prestação de Serviço': r.atividades?.nome || '',
    }));
    if (!linhas.length) { alert('Nenhum processo faturado neste mês para exportar.'); return; }
    const ws = XLSX.utils.json_to_sheet(linhas);
    // CPF como texto, para o Excel não comer o zero à esquerda nem virar número
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 1; R <= range.e.r; R++) {
      [4, 6].forEach(C => { const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]; if (cell) { cell.t = 's'; cell.z = '@'; } });
    }
    ws['!cols'] = [{wch:26},{wch:16},{wch:14},{wch:32},{wch:19},{wch:32},{wch:19},{wch:15},{wch:24},{wch:26},{wch:12},{wch:34}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Fechamento ${mesLabel(state.fechMes)}`);
    XLSX.writeFile(wb, `Fechamento ${mesLabel(state.fechMes)}.xlsx`);
  };
}

const CAD_LABEL = { analistas:'colaborador', empreendedoras:'empreendedora', empreendimentos:'empreendimento', atividades:'atividade' };
async function openEditarCadastro(tipo, id, nomeAtual, L) {
  const div = document.createElement('div');
  div.className = 'modal-bg';
  let extraHtml = '';
  if (tipo === 'empreendimentos') {
    const { data: e } = await sb.from('empreendimentos').select('empreendedora_id').eq('id', id).single();
    extraHtml = `<div><label>Empreendedora</label><select id="edEmpd">
      ${L.empreendedoras.map(x=>`<option value="${x.id}" ${e?.empreendedora_id===x.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div>`;
  }
  if (tipo === 'atividades') {
    const { data: a } = await sb.from('atividades').select('ativa').eq('id', id).single();
    extraHtml = `<div><label>Situação</label><select id="edAtiva">
      <option value="true" ${a?.ativa!==false?'selected':''}>Ativa</option>
      <option value="false" ${a?.ativa===false?'selected':''}>Inativa (some das listas novas)</option></select></div>`;
  }
  div.innerHTML = `<div class="modal" style="width:460px">
    <h2>✎ Editar ${CAD_LABEL[tipo]}</h2>
    <div><label>Nome</label><input id="edNome" value="${esc(nomeAtual)}"></div>
    ${extraHtml}
    <div class="msg" id="edMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="edCancel" class="ghost">Cancelar</button><button id="edSalvar">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('edNome').focus();
  $('edCancel').onclick = () => div.remove();
  $('edSalvar').onclick = async () => {
    const nome = $('edNome').value.trim();
    if (!nome) { $('edMsg').textContent = 'Informe o nome.'; return; }
    const rec = { nome };
    if (tipo === 'empreendimentos' && $('edEmpd')) rec.empreendedora_id = $('edEmpd').value;
    if (tipo === 'atividades' && $('edAtiva')) rec.ativa = $('edAtiva').value === 'true';
    const { error } = await sb.from(tipo).update(rec).eq('id', id);
    if (error) { $('edMsg').textContent = error.message.includes('duplicate') ? 'Já existe outro registro com esse nome.' : error.message; return; }
    div.remove(); await loadLookups(); renderCadastroOperacional();
  };
}

async function openIdentidadeEmpreendedora(id, nome) {
  const { data: e } = await sb.from('empreendedoras').select('logo_path,capa_path,cor_secundaria').eq('id', id).single();
  const div = document.createElement('div');
  div.className = 'modal-bg';
  const urlDe = (path) => path ? sb.storage.from('empreendimentos-identidade').getPublicUrl(path).data.publicUrl : '';
  div.innerHTML = `<div class="modal" style="width:480px">
    <h2>🎨 Identidade visual — ${esc(nome)}</h2>
    <p style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Essa marca aparece no Portal do Cliente para todos os empreendimentos de <b>${esc(nome)}</b>.</p>
    <div><label>Logo (PNG/SVG, fundo transparente)</label>
      ${e?.logo_path ? `<div style="margin:6px 0"><img src="${urlDe(e.logo_path)}" style="max-height:60px;max-width:100%;background:#f2f2f2;border-radius:6px;padding:6px"></div>` : ''}
      <input type="file" id="idLogo" accept="image/png,image/svg+xml">
    </div>
    <div style="margin-top:10px"><label>Imagem de capa (banner)</label>
      ${e?.capa_path ? `<div style="margin:6px 0"><img src="${urlDe(e.capa_path)}" style="max-height:80px;max-width:100%;object-fit:cover;border-radius:6px"></div>` : ''}
      <input type="file" id="idCapa" accept="image/png,image/jpeg,image/webp">
    </div>
    <div style="margin-top:10px"><label>Cor secundária (opcional)</label>
      <input type="color" id="idCor" value="${e?.cor_secundaria || '#0D3D3D'}" style="width:60px;height:34px;padding:2px">
    </div>
    <div class="msg" id="idMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
      <button id="idCancel" class="ghost">Cancelar</button><button id="idSalvar">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('idCancel').onclick = () => div.remove();
  $('idSalvar').onclick = async () => {
    $('idSalvar').disabled = true; $('idMsg').textContent = 'Salvando...';
    const rec = { cor_secundaria: $('idCor').value };
    try {
      const logoFile = $('idLogo').files[0];
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${id}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('empreendimentos-identidade').upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        rec.logo_path = path;
      }
      const capaFile = $('idCapa').files[0];
      if (capaFile) {
        const ext = capaFile.name.split('.').pop();
        const path = `${id}/capa-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('empreendimentos-identidade').upload(path, capaFile, { upsert: true });
        if (upErr) throw upErr;
        rec.capa_path = path;
      }
      const { error } = await sb.from('empreendedoras').update(rec).eq('id', id);
      if (error) throw error;
      div.remove();
    } catch (err) {
      $('idMsg').textContent = err.message || 'Erro ao salvar.';
      $('idSalvar').disabled = false;
    }
  };
}

async function openExcluirCadastro(tipo, id, nome) {
  // conta o que está vinculado, para não apagar algo que quebraria processos existentes
  const contar = async (tabela, coluna) => {
    const { count } = await sb.from(tabela).select('id', { count: 'exact', head: true }).eq(coluna, id);
    return count || 0;
  };
  let vinculos = [];
  if (tipo === 'analistas') {
    const [d, e] = await Promise.all([contar('demandas','analista_id'), contar('escala_plantao','analista_id')]);
    if (d) vinculos.push(`${d} processo(s) de produção`);
    if (e) vinculos.push(`${e} plantão(ões) na escala`);
  } else if (tipo === 'empreendedoras') {
    const [d, e] = await Promise.all([contar('demandas','empreendedora_id'), contar('empreendimentos','empreendedora_id')]);
    if (d) vinculos.push(`${d} processo(s)`);
    if (e) vinculos.push(`${e} empreendimento(s)`);
  } else if (tipo === 'empreendimentos') {
    const d = await contar('demandas','empreendimento_id');
    if (d) vinculos.push(`${d} processo(s)`);
  } else if (tipo === 'atividades') {
    const d = await contar('demandas','atividade_id');
    if (d) vinculos.push(`${d} processo(s)`);
  }
  const temVinculo = vinculos.length > 0;
  const podeInativar = tipo === 'analistas' || tipo === 'atividades';

  const div = document.createElement('div');
  div.className = 'modal-bg';
  div.innerHTML = `<div class="modal" style="width:480px">
    <h2>🗑️ Excluir ${CAD_LABEL[tipo]}</h2>
    <p style="font-size:13.5px;margin-bottom:10px">Excluir <b>${esc(nome)}</b>?</p>
    ${temVinculo ? `<div class="msg" style="background:var(--warn-soft);border-color:var(--warn)">
      ⚠️ Este registro está vinculado a ${vinculos.join(' e ')}. Excluir apagaria esse vínculo e o histórico ficaria incompleto.
      ${podeInativar ? '<br><br>💡 O recomendado é <b>inativar</b>: some das listas novas, mas o histórico continua correto.' : ''}
    </div>` : '<p style="color:var(--muted);font-size:12.5px">Nenhum processo vinculado — exclusão segura.</p>'}
    <div class="msg" id="exMsg"></div>
    <div style="display:flex;gap:8px;justify-content:end;margin-top:14px;flex-wrap:wrap">
      <button id="exCancel" class="ghost">Cancelar</button>
      ${temVinculo && podeInativar ? '<button id="exInativar">Inativar (recomendado)</button>' : ''}
      <button id="exExcluir" class="ghost" style="color:var(--err)">Excluir definitivamente</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('exCancel').onclick = () => div.remove();
  const bIna = $('exInativar');
  if (bIna) bIna.onclick = async () => {
    const rec = tipo === 'analistas' ? { status: 'Inativo' } : { ativa: false };
    const { error } = await sb.from(tipo).update(rec).eq('id', id);
    if (error) { $('exMsg').textContent = error.message; return; }
    div.remove(); await loadLookups(); renderCadastroOperacional();
  };
  $('exExcluir').onclick = async () => {
    if (temVinculo && !confirm(`Confirma excluir "${nome}" mesmo com ${vinculos.join(' e ')} vinculado(s)?`)) return;
    const { error } = await sb.from(tipo).delete().eq('id', id);
    if (error) {
      $('exMsg').textContent = error.message.includes('foreign key') || error.code === '23503'
        ? 'Não foi possível excluir: existem registros vinculados. Use "Inativar".'
        : error.message;
      return;
    }
    div.remove(); await loadLookups(); renderCadastroOperacional();
  };
}

// ---------- ADMINISTRAÇÃO (Usuários + Cadastros) ----------
const ROLE_INFO = {
  admin: { cor: 'CONCLUIDO', label: 'Admin' },
  analista: { cor: 'RECEBIDO', label: 'Analista' },
  leitura: { cor: 'PENDENTE', label: 'Leitura' },
  cliente: { cor: 'PENDENTE', label: 'Cliente (portal)' },
};
async function renderUsuariosEquipe() {
  const L = state.lookups;
  const { data: todosUsuarios } = await sb.from('perfis').select('*').order('criado_em');
  const usuarios = (todosUsuarios || []).filter(u => u.role !== 'cliente');
  shell(`
      <div class="card">
        <div class="admin-head">
          <div>
            <h2 style="margin-bottom:2px">Usuários da equipe e níveis de acesso</h2>
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
          <button id="btnCriarUser">Criar acesso</button>
          <span id="nuMsg" class="msg" style="margin:0;flex-basis:100%"></span>
        </div>` : ''}
        <p style="color:var(--muted);font-size:12px;margin:10px 0 6px">💡 O <b>colaborador vinculado</b> define de quem são os apontamentos que a pessoa enxerga em Qualidade/Retrabalho. Sem vínculo, um analista não vê nenhum. Usuários do Portal do Cliente ficam em Portal do Cliente → Usuários.</p>
        <div class="table-scroll"><table class="users-table"><thead><tr><th>Usuário</th><th>Nível de acesso</th><th>Colaborador vinculado</th><th>Desde</th><th>Ações</th></tr></thead>
        <tbody>${(usuarios||[]).map(u => {
          const isSelf = u.user_id === state.session.user.id;
          const info = ROLE_INFO[u.role] || ROLE_INFO.analista;
          return `<tr style="${u.ativo===false?'opacity:.5':''}">
          <td><div class="user-cell"><div class="user-avatar">${esc((u.nome_completo||u.email)[0]?.toUpperCase() || '?')}</div>
            <div><b>${esc(u.nome_completo || u.email)}</b>${isSelf ? ' <span class="tag RECEBIDO">você</span>' : ''}${u.ativo===false ? ' <span class="tag PENDENTE">inativo</span>' : ''}
            ${u.nome_completo ? `<br><span style="color:var(--muted);font-size:11.5px">${esc(u.email)}</span>` : ''}
            ${u.funcao ? `<br><span style="color:var(--muted2);font-size:11px">${esc(u.funcao)}</span>` : ''}
            ${!u.cadastro_completo ? '<br><span class="tag PENDENTE" style="font-size:10px">cadastro pendente</span>' : ''}</div></div></td>
          <td>${state.role === 'admin' && !isSelf
            ? `<select class="selRole" data-uid="${u.user_id}">
                ${Object.keys(ROLE_INFO).map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${ROLE_INFO[r].label}</option>`).join('')}</select>`
            : `<span class="tag ${info.cor}">${info.label}</span>`}</td>
          <td>${u.role === 'cliente'
            ? (state.role === 'admin'
                ? `<select class="selEmpdoraVinc" data-uid="${u.user_id}"><option value="">— escolher empreendedora —</option>
                    ${L.empreendedoras.map(e=>`<option value="${e.id}" ${u.empreendedora_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select>`
                : `<span style="color:var(--muted)">${esc((L.empreendedoras.find(e=>e.id===u.empreendedora_id)||{}).nome || '—')}</span>`)
            : (state.role === 'admin'
                ? `<select class="selAnalistaVinc" data-uid="${u.user_id}"><option value="">— sem vínculo —</option>
                    ${L.analistas.map(a=>`<option value="${a.id}" ${u.analista_id===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select>`
                : `<span style="color:var(--muted)">${esc((L.analistas.find(a=>a.id===u.analista_id)||{}).nome || '—')}</span>`)}</td>
          <td style="color:var(--muted);white-space:nowrap">${fmtDt(u.criado_em)}</td>
          <td style="min-width:230px">${state.role === 'admin' && !isSelf ? `
            <div class="row-actions">
              <button class="ghost btn-resetar-senha" data-uid="${u.user_id}" data-email="${esc(u.email)}" data-role="${esc(u.role)}">🔑 Resetar senha</button>
              <button class="ghost btn-toggle-ativo" data-uid="${u.user_id}" data-ativo="${u.ativo!==false}">${u.ativo===false ? '✅ Reativar' : '⏸ Inativar'}</button>
              <button class="ghost btn-excluir-user danger" data-uid="${u.user_id}" data-email="${esc(u.email)}">🗑 Excluir</button>
            </div>` : ''}</td></tr>`;
        }).join('')}</tbody></table></div>
      </div>`);
    const btnAbrir = document.getElementById('btnAbrirConvite');
    if (btnAbrir) btnAbrir.onclick = () => conviteBox.classList.toggle('hidden');
    document.querySelectorAll('.selRole').forEach(s => s.onchange = async () => {
      const { error } = await sb.from('perfis').update({ role: s.value }).eq('user_id', s.dataset.uid);
      if (error) alert(error.message);
      else renderUsuariosEquipe();
    });
    document.querySelectorAll('.selAnalistaVinc').forEach(s => s.onchange = async () => {
      const { error } = await sb.from('perfis').update({ analista_id: s.value || null }).eq('user_id', s.dataset.uid);
      if (error) alert(error.message);
    });
    document.querySelectorAll('.btn-toggle-ativo').forEach(b => b.onclick = async () => {
      const ativoAtual = b.dataset.ativo === 'true';
      const { error } = await sb.from('perfis').update({ ativo: !ativoAtual }).eq('user_id', b.dataset.uid);
      if (error) { alert(error.message); return; }
      renderUsuariosEquipe();
    });
    document.querySelectorAll('.btn-resetar-senha').forEach(b => b.onclick = async () => {
      if (!confirm(`Gerar uma nova senha temporária para ${b.dataset.email}? A senha atual dessa pessoa deixará de funcionar.`)) return;
      b.disabled = true; const txtOriginal = b.textContent; b.textContent = 'Gerando...';
      const { data, error } = await sb.functions.invoke('resetar-senha', { body: { userId: b.dataset.uid } });
      b.disabled = false; b.textContent = txtOriginal;
      if (error || data?.error) { alert(data?.error || error.message); return; }
      abrirEnvioAcessoEmail(b.dataset.email, data.senha, b.dataset.role);
    });
    document.querySelectorAll('.btn-excluir-user').forEach(b => b.onclick = async () => {
      if (!confirm(`Excluir permanentemente a conta de ${b.dataset.email}? Essa ação não pode ser desfeita.`)) return;
      const { data, error } = await sb.functions.invoke('excluir-usuario', { body: { user_id: b.dataset.uid } });
      if (error || data?.error) { alert(data?.error || error.message); return; }
      renderUsuariosEquipe();
    });
    const btnCU = document.getElementById('btnCriarUser');
    if (btnCU) btnCU.onclick = async () => {
      const email = nuEmail.value.trim(), nivel = nuNivel.value;
      const msg = document.getElementById('nuMsg');
      if (!email) { msg.textContent = 'Informe o e-mail.'; return; }
      if (!email.toLowerCase().endsWith(DOMINIO_CORPORATIVO)) {
        msg.textContent = `Use o e-mail corporativo (${DOMINIO_CORPORATIVO}). E-mails pessoais não têm acesso ao sistema.`;
        return;
      }
      btnCU.disabled = true; msg.textContent = 'Criando acesso...';
      const { data, error } = await sb.functions.invoke('convidar-usuario', {
        body: { email, nivel, empreendedoraId: null },
      });
      btnCU.disabled = false;
      if (error || data?.error) { msg.textContent = data?.error || error.message; return; }
      msg.textContent = `Acesso criado para ${email}.`;
      nuEmail.value = '';
      renderUsuariosEquipe();
      abrirEnvioAcessoEmail(email, data.senha, nivel);
    };
}

async function renderPortalUsuarios() {
  const L = state.lookups;
  const { data: todosUsuarios } = await sb.from('perfis').select('*').order('criado_em');
  const usuarios = (todosUsuarios || []).filter(u => u.role === 'cliente');
  shell(`
      <div class="card">
        <div class="admin-head">
          <div>
            <h2 style="margin-bottom:2px">Usuários do Portal do Cliente</h2>
            <p style="color:var(--muted);font-size:12.5px">Cada acesso é vinculado a uma empreendedora (incorporadora/loteadora) e só enxerga os empreendimentos e processos dela.</p>
          </div>
          ${state.role === 'admin' ? '<button id="btnAbrirConvitePortal">✉️ Cadastrar usuário do portal</button>' : ''}
        </div>
        ${state.role === 'admin' ? `
        <div id="convitePortalBox" class="invite-box hidden">
          <div><label>E-mail do usuário (empreendimento/incorporadora)</label><input id="npEmail" type="email" placeholder="contato@incorporadora.com.br"></div>
          <div><label>Empreendedora (incorporadora/loteadora)</label>
            <select id="npEmpdora"><option value="">— escolher —</option>
              ${L.empreendedoras.map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select></div>
          <button id="btnCriarUserPortal">Criar acesso</button>
          <span id="npMsg" class="msg" style="margin:0;flex-basis:100%"></span>
        </div>` : ''}
        <div class="table-scroll"><table class="users-table"><thead><tr><th>Usuário</th><th>Empreendedora vinculada</th><th>Desde</th><th>Ações</th></tr></thead>
        <tbody>${(usuarios||[]).map(u => `<tr style="${u.ativo===false?'opacity:.5':''}">
          <td><div class="user-cell"><div class="user-avatar">${esc((u.nome_completo||u.email)[0]?.toUpperCase() || '?')}</div>
            <div><b>${esc(u.nome_completo || u.email)}</b>${u.ativo===false ? ' <span class="tag PENDENTE">inativo</span>' : ''}
            ${u.nome_completo ? `<br><span style="color:var(--muted);font-size:11.5px">${esc(u.email)}</span>` : ''}
            ${!u.cadastro_completo ? '<br><span class="tag PENDENTE" style="font-size:10px">cadastro pendente</span>' : ''}</div></div></td>
          <td>${state.role === 'admin'
            ? `<select class="selEmpdoraVincPortal" data-uid="${u.user_id}"><option value="">— escolher empreendedora —</option>
                ${L.empreendedoras.map(e=>`<option value="${e.id}" ${u.empreendedora_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select>`
            : `<span style="color:var(--muted)">${esc((L.empreendedoras.find(e=>e.id===u.empreendedora_id)||{}).nome || '—')}</span>`}</td>
          <td style="color:var(--muted);white-space:nowrap">${fmtDt(u.criado_em)}</td>
          <td style="min-width:230px">${state.role === 'admin' ? `
            <div class="row-actions">
              <button class="ghost btn-resetar-senha" data-uid="${u.user_id}" data-email="${esc(u.email)}" data-role="cliente">🔑 Resetar senha</button>
              <button class="ghost btn-toggle-ativo-portal" data-uid="${u.user_id}" data-ativo="${u.ativo!==false}">${u.ativo===false ? '✅ Reativar' : '⏸ Inativar'}</button>
              <button class="ghost btn-excluir-user-portal danger" data-uid="${u.user_id}" data-email="${esc(u.email)}">🗑 Excluir</button>
            </div>` : ''}</td></tr>`).join('') || '<tr><td colspan="4">Nenhum usuário do portal cadastrado ainda.</td></tr>'}</tbody></table></div>
      </div>`);
  const btnAbrir = document.getElementById('btnAbrirConvitePortal');
  if (btnAbrir) btnAbrir.onclick = () => convitePortalBox.classList.toggle('hidden');
  document.querySelectorAll('.selEmpdoraVincPortal').forEach(s => s.onchange = async () => {
    const { error } = await sb.from('perfis').update({ empreendedora_id: s.value || null }).eq('user_id', s.dataset.uid);
    if (error) alert(error.message);
  });
  document.querySelectorAll('.btn-toggle-ativo-portal').forEach(b => b.onclick = async () => {
    const ativoAtual = b.dataset.ativo === 'true';
    const { error } = await sb.from('perfis').update({ ativo: !ativoAtual }).eq('user_id', b.dataset.uid);
    if (error) { alert(error.message); return; }
    renderPortalUsuarios();
  });
  document.querySelectorAll('.btn-resetar-senha').forEach(b => b.onclick = async () => {
    if (!confirm(`Gerar uma nova senha temporária para ${b.dataset.email}? A senha atual dessa pessoa deixará de funcionar.`)) return;
    b.disabled = true; const txtOriginal = b.textContent; b.textContent = 'Gerando...';
    const { data, error } = await sb.functions.invoke('resetar-senha', { body: { userId: b.dataset.uid } });
    b.disabled = false; b.textContent = txtOriginal;
    if (error || data?.error) { alert(data?.error || error.message); return; }
    abrirEnvioAcessoEmail(b.dataset.email, data.senha, b.dataset.role);
  });
  document.querySelectorAll('.btn-excluir-user-portal').forEach(b => b.onclick = async () => {
    if (!confirm(`Excluir permanentemente a conta de ${b.dataset.email}? Essa ação não pode ser desfeita.`)) return;
    const { data, error } = await sb.functions.invoke('excluir-usuario', { body: { user_id: b.dataset.uid } });
    if (error || data?.error) { alert(data?.error || error.message); return; }
    renderPortalUsuarios();
  });
  const btnCUP = document.getElementById('btnCriarUserPortal');
  if (btnCUP) btnCUP.onclick = async () => {
    const email = npEmail.value.trim();
    const empreendedoraId = npEmpdora.value;
    const msg = document.getElementById('npMsg');
    if (!email) { msg.textContent = 'Informe o e-mail.'; return; }
    if (!empreendedoraId) { msg.textContent = 'Escolha a empreendedora vinculada a esse acesso.'; return; }
    btnCUP.disabled = true; msg.textContent = 'Criando acesso...';
    const { data, error } = await sb.functions.invoke('convidar-usuario', {
      body: { email, nivel: 'cliente', empreendedoraId },
    });
    btnCUP.disabled = false;
    if (error || data?.error) { msg.textContent = data?.error || error.message; return; }
    msg.textContent = `Acesso criado para ${email}.`;
    npEmail.value = '';
    renderPortalUsuarios();
    abrirEnvioAcessoEmail(email, data.senha, 'cliente');
  };
}

async function renderPortalEmpreendimentos() {
  const L = state.lookups;
  const { data: emprsAcesso } = await sb.from('empreendimentos').select('*, empreendedora:empreendedoras(*), portal_ativo').order('nome');
  const filtra = (busca) => !busca ? emprsAcesso : emprsAcesso?.filter(e =>
    (e.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (e.empreendedora?.nome||'').toLowerCase().includes(busca.toLowerCase())
  );
  if (!state.portalEmpBusca) state.portalEmpBusca = '';
  const empsFiltrados = filtra(state.portalEmpBusca);
  shell(`
    <div class="card">
      <div class="admin-head">
        <div>
          <h2 style="margin-bottom:2px">Empreendimentos com Acesso ao Portal</h2>
          <p style="color:var(--muted);font-size:12.5px">Controle quais empreendimentos aparecem no Portal do Cliente para usuários com acesso.</p>
        </div>
      </div>
      <input class="portal-emp-busca" placeholder="🔎 Buscar empreendimento ou empreendedora..." value="${esc(state.portalEmpBusca)}" style="width:100%;margin:10px 0">
      <div class="table-scroll"><table class="users-table"><thead><tr><th>Empreendimento</th><th>Empreendedora</th><th>Portal</th><th>Ações</th></tr></thead>
      <tbody>${(empsFiltrados||[]).map(e => `<tr>
        <td><b>${esc(e.nome)}</b></td>
        <td><span style="color:var(--muted)">${esc(e.empreendedora?.nome || '—')}</span></td>
        <td><div class="toggle-status" data-id="${e.id}" data-status="${e.portal_ativo===true?'ativo':'inativo'}" style="cursor:pointer;padding:4px 8px;border-radius:4px;background:${e.portal_ativo===true?'var(--ok)':'var(--muted)'}22;color:${e.portal_ativo===true?'var(--ok)':'var(--muted)'}"><strong>${e.portal_ativo===true?'🟢 Ativo':'⚫ Inativo'}</strong></div></td>
        <td style="min-width:200px"><div class="row-actions">
          <button class="ghost btn-config-portal" data-id="${e.id}" data-n="${esc(e.nome)}" title="Configurar acesso">⚙️ Configurar</button>
        </div></td></tr>`).join('') || '<tr><td colspan="4"><p style="color:var(--muted);padding:10px 0">Nenhum empreendimento encontrado.</p></td></tr>'}</tbody></table></div>
    </div>`);

  document.querySelector('.portal-emp-busca').oninput = (e) => {
    state.portalEmpBusca = e.target.value;
    renderPortalEmpreendimentos();
  };

  document.querySelectorAll('.toggle-status').forEach(div => div.onclick = async () => {
    const novoStatus = div.dataset.status === 'inativo';
    const { error } = await sb.from('empreendimentos').update({ portal_ativo: novoStatus }).eq('id', div.dataset.id);
    if (error) { alert('Erro ao atualizar: ' + error.message); return; }
    renderPortalEmpreendimentos();
  });

  document.querySelectorAll('.btn-config-portal').forEach(b => b.onclick = () => {
    alert(`Configuração de acesso para "${b.dataset.n}" — em breve você poderá definir quais usuários do portal têm acesso a este empreendimento.`);
  });
}

async function renderCadastroOperacional() {
  const L = state.lookups;
  {
    if (!state.cadBusca) state.cadBusca = {};
    const filtra = (items, tipo) => {
      const q = (state.cadBusca[tipo] || '').toLowerCase().trim();
      return q ? items.filter(i => (i.nome||'').toLowerCase().includes(q)) : items;
    };
    const bloco = (titulo, items, tipo, extra) => {
      const vis = filtra(items, tipo);
      return `
      <div class="card">
        <h2>${titulo} <span class="count-badge">${items.length}</span></h2>
        <input class="cad-busca" data-t="${tipo}" value="${esc(state.cadBusca[tipo]||'')}" placeholder="🔎 Buscar..." style="width:100%;margin:6px 0">
        <div class="cad-list">${vis.map(i => `
          <div class="cad-item">
            <span style="flex:1">${esc(i.nome)}${extra ? extra(i) : ''}</span>
            ${tipo==='empreendedoras' ? `<button class="ghost cad-identidade" data-id="${i.id}" data-n="${esc(i.nome_puro ?? i.nome)}" title="Identidade visual (Portal do Cliente)">🎨</button>` : ''}
            <button class="ghost cad-edit" data-t="${tipo}" data-id="${i.id}" data-n="${esc(i.nome_puro ?? i.nome)}" title="Editar">✎</button>
            <button class="ghost cad-del" data-t="${tipo}" data-id="${i.id}" data-n="${esc(i.nome_puro ?? i.nome)}" title="Excluir" style="color:var(--err);margin-left:0">✕</button>
          </div>`).join('') || `<p style="color:var(--muted);font-size:12.5px;padding:8px 0">${state.cadBusca[tipo] ? 'Nada encontrado nessa busca.' : 'Nenhum registro.'}</p>`}</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <input id="new_${tipo}" placeholder="Novo nome..." style="flex:1;min-width:140px">
          ${tipo === 'empreendimentos' ? `<select id="new_emp_ed" style="min-width:140px">${L.empreendedoras.map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select>` : ''}
          <button class="cad-add" data-t="${tipo}">+ Adicionar</button>
        </div>
        <div class="msg cad-msg" data-t="${tipo}" style="margin-top:6px"></div>
      </div>`;
    };
    const analistasVis = filtra(L.analistas, 'analistas');
    shell(`
      <div class="grid-cad">
        <div class="card">
          <h2>👥 Colaboradores <span class="count-badge">${L.analistas.length}</span></h2>
          <input class="cad-busca" data-t="analistas" value="${esc(state.cadBusca['analistas']||'')}" placeholder="🔎 Buscar colaborador..." style="width:100%;margin:6px 0">
          <div class="cad-list">${analistasVis.map(i => `
            <div class="cad-item" style="flex-wrap:wrap">
              <span style="flex:1;min-width:110px">${esc(i.nome)}</span>
              <select class="col-cargo" data-id="${i.id}" style="min-width:104px;font-size:12px;margin-left:0">
                ${['analista','supervisor','coordenador'].map(c=>`<option value="${c}" ${i.cargo===c?'selected':''}>${c}</option>`).join('')}
              </select>
              <select class="col-status" data-id="${i.id}" style="min-width:104px;font-size:12px;margin-left:0">
                ${['Ativo','Em licença','Desligado','Inativo'].map(s=>`<option value="${s}" ${i.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
              <button class="ghost cad-edit" data-t="analistas" data-id="${i.id}" data-n="${esc(i.nome)}" title="Renomear">✎</button>
              <button class="ghost cad-del" data-t="analistas" data-id="${i.id}" data-n="${esc(i.nome)}" title="Excluir" style="color:var(--err);margin-left:0">✕</button>
            </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhum colaborador.</p>'}</div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <input id="new_analistas" placeholder="Nome do colaborador..." style="flex:1;min-width:140px">
            <select id="new_analista_cargo" style="min-width:110px">
              ${['analista','supervisor','coordenador'].map(c=>`<option value="${c}">${c}</option>`).join('')}
            </select>
            <button class="cad-add" data-t="analistas">+ Cadastrar</button>
          </div>
          <div class="msg cad-msg" data-t="analistas" style="margin-top:6px"></div>
          <p style="color:var(--muted2);font-size:11.5px;margin-top:6px">Só cargo <b>analista</b> com status <b>Ativo</b>/<b>Em licença</b> entra em ranking, escala e metas.</p>
        </div>
        ${bloco('🏢 Empreendedoras', L.empreendedoras, 'empreendedoras')}
        ${bloco('🏗️ Empreendimentos', L.empreendimentos.map(e => ({...e, nome_puro: e.nome, nome: e.nome + (L.empreendedoras.find(x=>x.id===e.empreendedora_id) ? ' · ' + L.empreendedoras.find(x=>x.id===e.empreendedora_id).nome : '')})), 'empreendimentos')}
        ${bloco('📝 Atividades', L.atividades, 'atividades', i => i.ativa === false ? ' <span class="tag PENDENTE">inativa</span>' : '')}
      </div>`);

    const msgDe = (t, texto, erro) => {
      const el = document.querySelector(`.cad-msg[data-t="${t}"]`);
      if (el) { el.textContent = texto; el.style.color = erro ? 'var(--err)' : 'var(--ok)'; }
    };
    document.querySelectorAll('.cad-busca').forEach(inp => {
      let tm; inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => {
        state.cadBusca[inp.dataset.t] = inp.value; renderCadastroOperacional();
      }, 350); };
    });
    document.querySelectorAll('.cad-add').forEach(b => b.onclick = async () => {
      const t = b.dataset.t;
      const inp = document.getElementById('new_' + t);
      if (!inp.value.trim()) { msgDe(t, 'Digite o nome antes de adicionar.', true); return; }
      const rec = { nome: inp.value.trim() };
      if (t === 'empreendimentos') rec.empreendedora_id = document.getElementById('new_emp_ed').value || null;
      if (t === 'analistas') { rec.cargo = document.getElementById('new_analista_cargo').value; rec.status = 'Ativo'; }
      b.disabled = true; msgDe(t, 'Salvando...');
      const { error } = await sb.from(t).insert(rec);
      b.disabled = false;
      if (error) { msgDe(t, error.message.includes('duplicate') ? 'Já existe um registro com esse nome.' : error.message, true); return; }
      state.cadBusca[t] = '';
      await loadLookups(); renderCadastroOperacional();
    });
    document.querySelectorAll('.col-cargo').forEach(s => s.onchange = async () => {
      const { error } = await sb.from('analistas').update({ cargo: s.value }).eq('id', s.dataset.id);
      if (error) { msgDe('analistas', error.message, true); return; }
      await loadLookups(); renderCadastroOperacional();
    });
    document.querySelectorAll('.col-status').forEach(s => s.onchange = async () => {
      const { error } = await sb.from('analistas').update({ status: s.value }).eq('id', s.dataset.id);
      if (error) { msgDe('analistas', error.message, true); return; }
      await loadLookups(); renderCadastroOperacional();
    });
    document.querySelectorAll('.cad-edit').forEach(b => b.onclick = () => openEditarCadastro(b.dataset.t, b.dataset.id, b.dataset.n, L));
    document.querySelectorAll('.cad-del').forEach(b => b.onclick = () => openExcluirCadastro(b.dataset.t, b.dataset.id, b.dataset.n));
    document.querySelectorAll('.cad-identidade').forEach(b => b.onclick = () => openIdentidadeEmpreendedora(b.dataset.id, b.dataset.n));
  }
}

// ---------- ARQUIVOS (Excel de Fechamento arquivado + Apresentações PPT) — só admin ----------
function bytesFmt(n) {
  if (!n) return '—';
  if (n < 1024*1024) return (n/1024).toFixed(0) + ' KB';
  return (n/1024/1024).toFixed(1) + ' MB';
}
async function renderArquivos(tabsHtml) {
  const blocoArquivos = async (bucket, titulo, accept) => {
    const { data: arquivos } = await sb.storage.from(bucket).list('', { sortBy: { column: 'created_at', order: 'desc' } });
    return `
    <div class="card">
      <h2>${titulo} <span class="count-badge">${(arquivos||[]).length}</span></h2>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input type="file" class="arq-upload" data-bucket="${bucket}" accept="${accept}" style="flex:1;min-width:200px">
      </div>
      <div class="msg arq-msg" data-bucket="${bucket}" style="margin-bottom:8px"></div>
      <div class="cad-list">${(arquivos||[]).filter(a=>a.name!=='.emptyFolderPlaceholder').map(a => `
        <div class="cad-item">
          <span style="flex:1">${esc(a.name)} <span style="color:var(--muted2);font-size:11px">· ${bytesFmt(a.metadata?.size)} · ${fmtDt(a.created_at)}</span></span>
          <button class="ghost arq-baixar" data-bucket="${bucket}" data-nome="${esc(a.name)}" title="Baixar">⬇</button>
          <button class="ghost arq-substituir" data-bucket="${bucket}" data-nome="${esc(a.name)}" data-accept="${accept}" title="Substituir">🔁</button>
          <button class="ghost arq-excluir" data-bucket="${bucket}" data-nome="${esc(a.name)}" title="Excluir" style="color:var(--err);margin-left:0">✕</button>
        </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhum arquivo.</p>'}</div>
    </div>`;
  };
  shell(`
    ${tabsHtml}
    <div class="grid-cad">
      ${await blocoArquivos('fechamentos-arquivo', '📊 Fechamentos em Excel', '.xlsx,.xls,.csv')}
      ${await blocoArquivos('apresentacoes-ppt', '📽️ Apresentações em PPT', '.ppt,.pptx')}
    </div>`);
  const msgDe = (bucket, texto, erro) => {
    const el = document.querySelector(`.arq-msg[data-bucket="${bucket}"]`);
    if (el) { el.textContent = texto; el.style.color = erro ? 'var(--err)' : 'var(--ok)'; }
  };
  document.querySelectorAll('.arq-upload').forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    const bucket = inp.dataset.bucket;
    msgDe(bucket, 'Enviando...');
    const { error } = await sb.storage.from(bucket).upload(f.name, f, { upsert: false });
    if (error) { msgDe(bucket, error.message.includes('exists') ? 'Já existe um arquivo com esse nome. Use "Substituir" na lista.' : error.message, true); return; }
    renderArquivos(tabsHtml);
  });
  document.querySelectorAll('.arq-baixar').forEach(b => b.onclick = async () => {
    const { data, error } = await sb.storage.from(b.dataset.bucket).createSignedUrl(b.dataset.nome, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, '_blank');
  });
  document.querySelectorAll('.arq-substituir').forEach(b => b.onclick = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = b.dataset.accept;
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      const { error } = await sb.storage.from(b.dataset.bucket).upload(b.dataset.nome, f, { upsert: true });
      if (error) { alert(error.message); return; }
      renderArquivos(tabsHtml);
    };
    inp.click();
  });
  document.querySelectorAll('.arq-excluir').forEach(b => b.onclick = async () => {
    if (!confirm(`Excluir "${b.dataset.nome}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await sb.storage.from(b.dataset.bucket).remove([b.dataset.nome]);
    if (error) { alert(error.message); return; }
    renderArquivos(tabsHtml);
  });
}

// ---------- FLUXOS DA ESTEIRA (criar/editar/excluir etapas e transições) — só admin ----------
async function renderFluxosAdmin(tabsHtml) {
  if (!state.fluxoAdminTipo) state.fluxoAdminTipo = 'analise_credito';
  const TIPOS_ESTEIRA = [['analise_credito','Análise de Crédito'], ['emissao_contrato','Emissão de Contrato']];
  const { data: etapas } = await sb.from('etapas_esteira').select('*').eq('esteira_tipo', state.fluxoAdminTipo).order('ordem');
  const { data: transicoes } = await sb.from('esteira_transicoes').select('*').in('etapa_origem_id', (etapas||[]).map(e=>e.id));
  const nomeEtapa = (id) => (etapas||[]).find(e=>e.id===id)?.nome || '(processo concluído)';
  shell(`
    ${tabsHtml}
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <h2 style="margin:0">⛓️ Fluxos da Esteira</h2>
        <select id="fluxoAdminSel">${TIPOS_ESTEIRA.map(([k,l])=>`<option value="${k}" ${state.fluxoAdminTipo===k?'selected':''}>${l}</option>`).join('')}</select>
      </div>
      <p style="color:var(--muted);font-size:12px;margin-top:6px">Aqui você cria, renomeia, reordena e exclui etapas, e configura os botões de transição entre elas.</p>
    </div>
    <div class="grid-cad">
      <div class="card">
        <h2>📍 Etapas <span class="count-badge">${(etapas||[]).length}</span></h2>
        <div class="cad-list">${(etapas||[]).map((e,i) => `
          <div class="cad-item">
            <span style="flex:1">${i+1}. ${esc(e.nome)}${e.ativa===false?' <span class="tag PENDENTE">inativa</span>':''}</span>
            <button class="ghost et-subir" data-id="${e.id}" ${i===0?'disabled':''} title="Mover para cima">↑</button>
            <button class="ghost et-descer" data-id="${e.id}" ${i===(etapas.length-1)?'disabled':''} title="Mover para baixo">↓</button>
            <button class="ghost et-renomear" data-id="${e.id}" data-nome="${esc(e.nome)}" title="Renomear">✎</button>
            <button class="ghost et-excluir" data-id="${e.id}" data-nome="${esc(e.nome)}" title="Excluir" style="color:var(--err);margin-left:0">✕</button>
          </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhuma etapa.</p>'}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <input id="novaEtapaNome" placeholder="Nome da nova etapa..." style="flex:1">
          <button id="btnAddEtapa">+ Adicionar</button>
        </div>
        <div class="msg" id="fluxoMsg" style="margin-top:6px"></div>
      </div>
      <div class="card">
        <h2>➡️ Transições (botões de avançar/devolver)</h2>
        <div class="cad-list">${(transicoes||[]).map(t => `
          <div class="cad-item">
            <span style="flex:1">${esc(nomeEtapa(t.etapa_origem_id))} → <b>${esc(t.rotulo)}</b> → ${esc(nomeEtapa(t.etapa_destino_id))}</span>
            <button class="ghost tr-excluir" data-id="${t.id}" title="Excluir" style="color:var(--err);margin-left:0">✕</button>
          </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhuma transição configurada.</p>'}</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <select id="novaTrOrigem" style="min-width:150px">${(etapas||[]).map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select>
          <input id="novaTrRotulo" placeholder="Texto do botão (ex.: Aprovar)" style="flex:1;min-width:140px">
          <select id="novaTrDestino" style="min-width:150px"><option value="">— Conclui o processo —</option>${(etapas||[]).map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select>
          <button id="btnAddTr">+ Adicionar</button>
        </div>
      </div>
    </div>`);
  const msg = (t, erro) => { const el = document.getElementById('fluxoMsg'); if (el) { el.textContent = t; el.style.color = erro?'var(--err)':'var(--ok)'; } };
  document.getElementById('fluxoAdminSel').onchange = (e) => { state.fluxoAdminTipo = e.target.value; renderFluxosAdmin(tabsHtml); };
  document.getElementById('btnAddEtapa').onclick = async () => {
    const nome = document.getElementById('novaEtapaNome').value.trim();
    if (!nome) { msg('Digite o nome da etapa.', true); return; }
    const maxOrdem = Math.max(0, ...(etapas||[]).map(e=>e.ordem));
    const { error } = await sb.from('etapas_esteira').insert({ nome, ordem: maxOrdem+1, ativa: true, esteira_tipo: state.fluxoAdminTipo });
    if (error) { msg(error.message, true); return; }
    renderFluxosAdmin(tabsHtml);
  };
  document.querySelectorAll('.et-renomear').forEach(b => b.onclick = async () => {
    const novo = prompt('Novo nome da etapa:', b.dataset.nome);
    if (!novo || novo === b.dataset.nome) return;
    const { error } = await sb.from('etapas_esteira').update({ nome: novo }).eq('id', b.dataset.id);
    if (error) { alert(error.message); return; }
    renderFluxosAdmin(tabsHtml);
  });
  document.querySelectorAll('.et-excluir').forEach(b => b.onclick = async () => {
    if (!confirm(`Excluir a etapa "${b.dataset.nome}"? Só é possível se não houver processo nela e nenhuma transição apontando pra ela.`)) return;
    const { error } = await sb.from('etapas_esteira').delete().eq('id', b.dataset.id);
    if (error) { alert(error.message.includes('foreign key') || error.code === '23503' ? 'Não é possível excluir: existem processos ou transições usando essa etapa.' : error.message); return; }
    renderFluxosAdmin(tabsHtml);
  });
  const mover = async (id, delta) => {
    const idx = etapas.findIndex(e=>e.id===id);
    const alvo = etapas[idx+delta];
    if (!alvo) return;
    await sb.from('etapas_esteira').update({ ordem: alvo.ordem }).eq('id', id);
    await sb.from('etapas_esteira').update({ ordem: etapas[idx].ordem }).eq('id', alvo.id);
    renderFluxosAdmin(tabsHtml);
  };
  document.querySelectorAll('.et-subir').forEach(b => b.onclick = () => mover(b.dataset.id, -1));
  document.querySelectorAll('.et-descer').forEach(b => b.onclick = () => mover(b.dataset.id, 1));
  document.getElementById('btnAddTr').onclick = async () => {
    const rotulo = document.getElementById('novaTrRotulo').value.trim();
    if (!rotulo) { msg('Digite o texto do botão.', true); return; }
    const origem = document.getElementById('novaTrOrigem').value;
    const destino = document.getElementById('novaTrDestino').value || null;
    const maxOrdem = Math.max(0, ...(transicoes||[]).filter(t=>t.etapa_origem_id===origem).map(t=>t.ordem_botao));
    const { error } = await sb.from('esteira_transicoes').insert({ etapa_origem_id: origem, etapa_destino_id: destino, rotulo, ordem_botao: maxOrdem+1 });
    if (error) { msg(error.message, true); return; }
    renderFluxosAdmin(tabsHtml);
  };
  document.querySelectorAll('.tr-excluir').forEach(b => b.onclick = async () => {
    if (!confirm('Excluir essa transição?')) return;
    await sb.from('esteira_transicoes').delete().eq('id', b.dataset.id);
    renderFluxosAdmin(tabsHtml);
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
// ---------- ESTEIRA (fila de produção por etapa) ----------
const PRIORIDADES = ['NORMAL', 'ALTA', 'URGENTE'];
// Categorias de motivo quando um processo REGRIDE de etapa na esteira.
// "pedido_vendedor" é a única que NÃO gera erro automático (mudança de escopo, não falha de análise).
const MOTIVOS_REGRESSAO = [
  ['pedido_vendedor', 'Pedido do vendedor (inclusão/alteração — não é erro)'],
  ['erro_analise', 'Erro de análise'],
  ['erro_documental', 'Documentação incompleta ou incorreta'],
  ['erro_proposta', 'Erro na proposta/contrato'],
  ['outro', 'Outro motivo'],
];
const ESTEIRA_TIPOS = [
  ['analise_credito', 'Análise de Crédito'],
  ['emissao_contrato', 'Emissão de Contrato'],
  ['repasse', 'Repasse Imobiliário'],
];
const BLOCOS_ESTEIRA = {
  analise_credito: [['analise', '📄 Análise'], ['reanalise', '🔁 Reanálise']],
  emissao_contrato: [['geracao', '📄 Contrato novo'], ['reemissao', '🔁 Reemissão de contrato']],
};
async function renderEsteira() {
  if (!state.esteiraTipo) state.esteiraTipo = 'emissao_contrato';
  if (!state.esteiraBloco) state.esteiraBloco = '';
  const [{ data: etapas }, { data: processos }, { data: naoLidas }] = await Promise.all([
    sb.from('etapas_esteira').select('*').eq('ativa', true).eq('esteira_tipo', state.esteiraTipo).order('ordem'),
    sb.from('esteira_processos').select('*').eq('esteira_tipo', state.esteiraTipo).neq('status', 'CONCLUIDO').order('criado_em'),
    sb.from('processo_mensagens').select('processo_id').eq('autor_tipo', 'cliente').eq('lida', false),
  ]);
  // nome do analista/cliente vem das listas já carregadas (não via join, que não funciona no ambiente de teste)
  const nomeAnalista = {}; (state.lookups?.analistas || []).forEach(a => nomeAnalista[a.id] = a.nome);
  const nomeCliente = {}; (state.clientesLookup || []).forEach(c => nomeCliente[c.id] = c.nome);
  (processos || []).forEach(p => {
    p.analistas = p.analista_atual_id ? { nome: nomeAnalista[p.analista_atual_id] || '—' } : null;
    p.clientes = p.cliente_id ? { nome: nomeCliente[p.cliente_id] || '' } : null;
  });
  const processosComAviso = new Set((naoLidas||[]).map(m => m.processo_id));
  if (!state.esteiraFiltro) state.esteiraFiltro = { busca:'', analista:'', prioridade:'' };
  const ef = state.esteiraFiltro;
  const blocosDisponiveis = BLOCOS_ESTEIRA[state.esteiraTipo] || null;
  const processosFiltrados = (processos || []).filter(p => {
    if (ef.analista === '__semdono__' ? p.analista_atual_id : (ef.analista && p.analista_atual_id !== ef.analista)) return false;
    if (ef.prioridade && (p.prioridade || 'NORMAL') !== ef.prioridade) return false;
    if (state.esteiraBloco && p.bloco !== state.esteiraBloco) return false;
    if (ef.busca) {
      const alvo = [p.titulo, p.unidade, p.clientes?.nome, p.observacoes, p.obs].filter(Boolean).join(' ').toLowerCase();
      if (!alvo.includes(ef.busca.toLowerCase())) return false;
    }
    return true;
  });
  const porEtapa = {};
  (etapas || []).forEach(e => porEtapa[e.id] = []);
  processosFiltrados.forEach(p => { (porEtapa[p.etapa_atual_id] = porEtapa[p.etapa_atual_id] || []).push(p); });
  const meuNome = state.perfilNome || '';
  const analistasNaEsteira = [...new Map((processos||[]).filter(p=>p.analista_atual_id)
    .map(p => [p.analista_atual_id, p.analistas?.nome])).entries()];

  // quantos processos cada analista tem em aberto nesta esteira
  const porAnalistaCount = {};
  (processos || []).forEach(p => { const n = p.analistas?.nome || 'Sem responsável'; porAnalistaCount[n] = (porAnalistaCount[n]||0)+1; });

  shell(`
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">⛓️ Esteira de Produção</h2>
        <span style="color:var(--muted);font-size:12.5px">Conclua sua etapa e transfira o processo para o próximo colega, anexando os documentos.</span>
        <div class="spacer"></div>
        ${(state.role === 'admin' || (state.role !== 'leitura' && !['analise_credito','emissao_contrato'].includes(state.esteiraTipo))) ? '<button id="btnNovoEsteira">+ Novo processo</button>' : ''}
        ${state.role === 'admin' ? '<button id="btnEtapas" class="ghost">⚙️ Etapas</button>' : ''}
      </div>
      ${['analise_credito','emissao_contrato'].includes(state.esteiraTipo) ? `<p style="color:var(--muted);font-size:11.5px;margin-top:8px">💡 Os cards desta esteira são criados automaticamente a partir da Produção (ou da aprovação do crédito). Criação manual é restrita a administradores.</p>` : ''}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        ${ESTEIRA_TIPOS.map(([k,l]) => `<button class="ghost esteira-tab ${state.esteiraTipo===k?'active':''}" data-tipo="${k}">${l}</button>`).join('')}
        <div class="spacer"></div>
        <button id="btnHistEsteira" class="ghost">🗄️ Histórico de concluídos</button>
      </div>
      ${blocosDisponiveis ? `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="ghost esteira-bloco-tab ${!state.esteiraBloco?'active':''}" data-bloco="">Todos</button>
        ${blocosDisponiveis.map(([k,l]) => `<button class="ghost esteira-bloco-tab ${state.esteiraBloco===k?'active':''}" data-bloco="${k}">${l}</button>`).join('')}
      </div>` : ''}
      <div style="display:flex;gap:14px;margin-top:10px;flex-wrap:wrap;font-size:12px;color:var(--muted)">
        ${Object.entries(porAnalistaCount).sort((a,b)=>b[1]-a[1]).map(([n,q]) => `<span>👤 ${esc(n)}: <b style="color:var(--text)">${q}</b></span>`).join('') || '<span>Nenhum processo em aberto nesta esteira.</span>'}
      </div>
      <div class="filters" style="align-items:end;margin-top:12px">
        <div style="flex:2;min-width:170px"><label>Buscar</label>
          <input id="efBusca" value="${esc(ef.busca)}" placeholder="processo, cliente, unidade, observação..."></div>
        <div><label>Responsável</label><select id="efAnalista">
          <option value="">Todos</option>
          <option value="__semdono__" ${ef.analista==='__semdono__'?'selected':''}>Sem responsável (fila)</option>
          ${analistasNaEsteira.map(([id,nome])=>`<option value="${id}" ${ef.analista===id?'selected':''}>${esc(nome)}</option>`).join('')}
        </select></div>
        <div><label>Prioridade</label><select id="efPrioridade">
          <option value="">Todas</option>
          ${['NORMAL','ALTA','URGENTE'].map(p=>`<option value="${p}" ${ef.prioridade===p?'selected':''}>${p}</option>`).join('')}
        </select></div>
        ${(ef.busca||ef.analista||ef.prioridade) ? `<button id="efLimpar" class="ghost">Limpar</button>
          <span style="color:var(--muted);font-size:12px;align-self:center">${processosFiltrados.length} de ${(processos||[]).length}</span>` : ''}
      </div>
    </div>
    <div class="esteira-board">
      ${(etapas || []).map(et => `
        <div class="esteira-col">
          <div class="esteira-col-head"><b>${esc(et.nome)}</b><span class="count-badge">${(porEtapa[et.id]||[]).length}</span></div>
          <div class="esteira-cards">
            ${(porEtapa[et.id] || []).map(p => `
              <div class="esteira-card ${p.prioridade==='URGENTE'?'urgente':p.prioridade==='ALTA'?'alta':''}" data-id="${p.id}">
                <div class="ec-title">${processosComAviso.has(p.id) ? '<span class="tag ERRO" title="Cliente aguardando retorno">💬 cliente</span> ' : ''}${p.bloco==='reanalise' || p.bloco==='reemissao' ? '<span class="tag PENDENTE" title="Reanálise/Reemissão">🔁</span> ' : ''}${esc(p.titulo)}</div>
                ${p.clientes?.nome ? `<div class="ec-sub">👤 ${esc(p.clientes.nome)}</div>` : ''}
                ${p.unidade ? `<div class="ec-sub">🏠 ${esc(p.unidade)}</div>` : ''}
                <div class="ec-foot">
                  ${p.analista_atual_id
                    ? `<span class="tag ${p.analistas?.nome===meuNome?'CONCLUIDO':'RECEBIDO'}">${esc(p.analistas.nome)}</span>`
                    : `<span class="tag PENDENTE">Sem responsável</span>`}
                  ${p.sera_faturado ? `<span class="tag CONCLUIDO" title="Processo será faturado">💰</span>` : ''}
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
  document.querySelectorAll('.esteira-tab').forEach(b => b.onclick = () => { state.esteiraTipo = b.dataset.tipo; state.esteiraBloco = ''; renderEsteira(); });
  document.querySelectorAll('.esteira-bloco-tab').forEach(b => b.onclick = () => { state.esteiraBloco = b.dataset.bloco; renderEsteira(); });
  document.getElementById('btnHistEsteira').onclick = () => openHistoricoEsteira();
  let efTm;
  document.getElementById('efBusca').oninput = (e) => {
    clearTimeout(efTm); efTm = setTimeout(() => {
      state.esteiraFiltro.busca = e.target.value;
      renderEsteira().then(() => { const el = document.getElementById('efBusca'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } });
    }, 350);
  };
  document.getElementById('efAnalista').onchange = (e) => { state.esteiraFiltro.analista = e.target.value; renderEsteira(); };
  document.getElementById('efPrioridade').onchange = (e) => { state.esteiraFiltro.prioridade = e.target.value; renderEsteira(); };
  const efL = document.getElementById('efLimpar');
  if (efL) efL.onclick = () => { state.esteiraFiltro = { busca:'', analista:'', prioridade:'' }; renderEsteira(); };
}

async function openHistoricoEsteira() {
  const [{ data: concluidos }, { data: analistasEsteira }] = await Promise.all([
    sb.from('esteira_processos').select('*, etapas_esteira(nome), analistas(nome), clientes(nome)')
      .eq('status', 'CONCLUIDO').order('concluido_em', { ascending: false }).limit(500),
    sb.from('analistas').select('id,nome').order('nome'),
  ]);
  const todos = concluidos || [];
  const f = { busca:'', esteira:'', desfecho:'', analista:'', de:'', ate:'' };
  const div = document.createElement('div');
  div.className = 'modal-bg';
  document.body.appendChild(div);

  const desfechoDe = (p) => p.devolvido_para ? 'devolvido' : 'concluido';
  const aplicar = () => todos.filter(p => {
    if (f.esteira && p.esteira_tipo !== f.esteira) return false;
    if (f.desfecho && desfechoDe(p) !== f.desfecho) return false;
    if (f.analista && p.analista_atual_id !== f.analista) return false;
    if (f.de && p.concluido_em && p.concluido_em.slice(0,10) < f.de) return false;
    if (f.ate && p.concluido_em && p.concluido_em.slice(0,10) > f.ate) return false;
    if (f.busca) {
      const q = f.busca.toLowerCase();
      const alvo = [p.titulo, p.unidade, p.clientes?.nome, p.observacoes, p.motivo_devolucao, p.etapas_esteira?.nome]
        .filter(Boolean).join(' ').toLowerCase();
      if (!alvo.includes(q)) return false;
    }
    return true;
  });

  const render = () => {
    const lista = aplicar();
    div.innerHTML = `<div class="modal" style="width:980px">
      <h2>🗄️ Histórico de processos concluídos</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Nada é apagado — todo processo encerrado fica aqui com o histórico completo de etapas.</p>
      <div class="filters" style="align-items:end;margin-bottom:10px">
        <div style="flex:2;min-width:170px"><label>Buscar</label>
          <input id="hfBusca" value="${esc(f.busca)}" placeholder="processo, cliente, unidade, motivo..."></div>
        <div><label>Esteira</label><select id="hfEsteira">
          <option value="">Todas</option>
          <option value="analise_credito" ${f.esteira==='analise_credito'?'selected':''}>Análise de Crédito</option>
          <option value="emissao_contrato" ${f.esteira==='emissao_contrato'?'selected':''}>Emissão de Contrato</option>
        </select></div>
        <div><label>Desfecho</label><select id="hfDesfecho">
          <option value="">Todos</option>
          <option value="concluido" ${f.desfecho==='concluido'?'selected':''}>Concluído</option>
          <option value="devolvido" ${f.desfecho==='devolvido'?'selected':''}>Devolvido</option>
        </select></div>
        <div><label>Responsável</label><select id="hfAnalista">
          <option value="">Todos</option>
          ${(analistasEsteira||[]).map(a=>`<option value="${a.id}" ${f.analista===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}
        </select></div>
        <div><label>De</label><input id="hfDe" type="date" value="${f.de}"></div>
        <div><label>Até</label><input id="hfAte" type="date" value="${f.ate}"></div>
        <button id="hfLimpar" class="ghost">Limpar</button>
      </div>
      <p style="color:var(--muted);font-size:12px;margin-bottom:8px"><b>${lista.length}</b> de ${todos.length} processo(s)</p>
      <div style="max-height:52vh;overflow-y:auto">
      <table><thead><tr><th>Concluído em</th><th>Esteira</th><th>Processo</th><th>Última etapa</th><th>Responsável</th><th>Desfecho</th><th></th></tr></thead>
      <tbody>${lista.map(p => `<tr>
        <td style="white-space:nowrap">${fmtDt(p.concluido_em)}</td>
        <td style="white-space:nowrap">${p.esteira_tipo === 'analise_credito' ? 'Crédito' : 'Contrato'}</td>
        <td style="min-width:190px"><b>${esc(p.titulo)}</b>${p.unidade ? `<br><span style="color:var(--muted);font-size:11px">${esc(p.unidade)}</span>` : ''}</td>
        <td style="min-width:130px">${esc(p.etapas_esteira?.nome || '—')}</td>
        <td style="min-width:100px">${esc(p.analistas?.nome || '—')}</td>
        <td style="min-width:130px">${p.devolvido_para ? `<span class="tag ERRO">Devolvido: ${esc(p.devolvido_para)}</span>${p.motivo_devolucao ? `<br><span style="font-size:11px;color:var(--muted)">${esc(p.motivo_devolucao)}</span>` : ''}` : '<span class="tag CONCLUIDO">Concluído</span>'}</td>
        <td><button class="ghost hist-abrir" data-id="${p.id}">Ver histórico</button></td>
      </tr>`).join('') || `<tr><td colspan="7" style="color:var(--muted)">${todos.length ? 'Nenhum processo com esses filtros.' : 'Nenhum processo concluído ainda.'}</td></tr>`}</tbody></table>
      </div>
      <div style="display:flex;justify-content:end;gap:8px;margin-top:14px">
        <button id="hfExportar" class="ghost">⬇ Exportar</button>
        <button id="heFechar" class="ghost">Fechar</button>
      </div>
    </div>`;
    const $ = (i) => div.querySelector('#' + i);
    $('heFechar').onclick = () => div.remove();
    let tm;
    $('hfBusca').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { f.busca = e.target.value; render(); const el = div.querySelector('#hfBusca'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, 350); };
    $('hfEsteira').onchange = (e) => { f.esteira = e.target.value; render(); };
    $('hfDesfecho').onchange = (e) => { f.desfecho = e.target.value; render(); };
    $('hfAnalista').onchange = (e) => { f.analista = e.target.value; render(); };
    $('hfDe').onchange = (e) => { f.de = e.target.value; render(); };
    $('hfAte').onchange = (e) => { f.ate = e.target.value; render(); };
    $('hfLimpar').onclick = () => { Object.keys(f).forEach(k => f[k] = ''); render(); };
    $('hfExportar').onclick = () => {
      const head = ['Concluído em','Esteira','Processo','Unidade','Última etapa','Responsável','Desfecho','Motivo','Observações'];
      const csv = [head.join(';')].concat(lista.map(p => [
        fmtDt(p.concluido_em), p.esteira_tipo==='analise_credito'?'Análise de Crédito':'Emissão de Contrato',
        p.titulo, p.unidade, p.etapas_esteira?.nome, p.analistas?.nome,
        p.devolvido_para ? 'Devolvido: '+p.devolvido_para : 'Concluído', p.motivo_devolucao, p.observacoes,
      ].map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(';'))).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `historico-esteira-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    };
    div.querySelectorAll('.hist-abrir').forEach(b => b.onclick = async () => {
      const { data: etapas } = await sb.from('etapas_esteira').select('*').eq('ativa', true).order('ordem');
      div.remove(); openProcessoEsteira(b.dataset.id, etapas || []);
    });
  };
  render();
}

const CHECKLIST_REPASSE_PADRAO = ['RG','CPF','Certidão de nascimento','Certidão de casamento','Holerites',
  'Extrato bancário','Declaração de IR','Comprovante de residência','Carteira de Trabalho','CNIS','FGTS','Procuração'];
const BANCOS_REPASSE = ['Caixa Econômica Federal','Banco do Brasil','Itaú','Bradesco','Santander','Inter','Banrisul','Sicredi','Sicoob','Outro'];
// Parecer da Análise de Crédito — define para onde o processo vai (automação no banco)
const PARECERES_CREDITO = [
  ['aprovado', 'Aprovado'],
  ['aprovado_contrato', 'Aprovado e enviar para emissão de contrato'],
  ['aprovado_pendencia', 'Aprovado com pendência'],
  ['aprovado_pendencia_contrato', 'Aprovado com pendência e enviar para emissão de contrato'],
  ['reprovado', 'Reprovado'],
];
async function openProcessoEsteira(id, etapas) {
  let p = null, historico = [], anexos = [], transicoes = [], checklist = [], mensagensProc = [];
  if (id) {
    const [pp, hh, aa, mm] = await Promise.all([
      sb.from('esteira_processos').select('*').eq('id', id).single(),
      sb.from('esteira_historico').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
      sb.from('esteira_anexos').select('*').eq('processo_id', id).order('criado_em', { ascending: false }),
      sb.from('processo_mensagens').select('*').eq('processo_id', id).order('criado_em'),
    ]);
    p = pp.data; historico = hh.data || []; anexos = aa.data || []; mensagensProc = mm.data || [];
    const naoLidas = mensagensProc.filter(m => m.autor_tipo === 'cliente' && !m.lida);
    if (naoLidas.length) await sb.from('processo_mensagens').update({ lida: true }).eq('processo_id', id).eq('autor_tipo', 'cliente').eq('lida', false);
    const { data: tt } = await sb.from('esteira_transicoes').select('*').eq('etapa_origem_id', p.etapa_atual_id).order('ordem_botao');
    transicoes = tt || [];
    if (p?.esteira_tipo === 'repasse') {
      const { data: cl } = await sb.from('repasse_checklist').select('*').eq('processo_id', id).order('criado_em');
      if (!cl || !cl.length) {
        const seed = CHECKLIST_REPASSE_PADRAO.map(item => ({ processo_id: id, item }));
        const { data: inserido } = await sb.from('repasse_checklist').insert(seed).select();
        checklist = inserido || [];
      } else checklist = cl;
    }
  }
  const L = state.lookups;
  const equipe = L.analistas.filter(a => !['Inativo','Desligado'].includes(a.status));
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
      ${BLOCOS_ESTEIRA[p?.esteira_tipo || state.esteiraTipo] ? `<div><label>Bloco</label><select id="epBloco" ${ro?'disabled':''}>
        ${BLOCOS_ESTEIRA[p?.esteira_tipo || state.esteiraTipo].map(([k,l])=>`<option value="${k}" ${(p?.bloco||BLOCOS_ESTEIRA[p?.esteira_tipo || state.esteiraTipo][0][0])===k?'selected':''}>${l}</option>`).join('')}</select></div>` : ''}
      ${(p?.esteira_tipo || state.esteiraTipo) === 'analise_credito' || (p?.esteira_tipo || state.esteiraTipo) === 'emissao_contrato' ? `<div><label>Processo será faturado?</label><select id="epFaturado" ${ro?'disabled':''}>
        <option value="">— não definido —</option>
        <option value="sim" ${p?.sera_faturado===true?'selected':''}>SIM</option>
        <option value="nao" ${p?.sera_faturado===false?'selected':''}>NÃO</option></select></div>` : ''}
      <div style="grid-column:1/-1"><label>Recado para o próximo responsável</label><textarea id="epObs" rows="2" placeholder="Informações para quem pegar a próxima etapa" ${ro?'disabled':''}>${esc(p?.obs)}</textarea></div>
      <div style="grid-column:1/-1"><label>📝 Observações do processo (acompanha todas as etapas)</label><textarea id="epObservacoes" rows="4" placeholder="Anotações que ficam com o processo do início ao fim — crédito e contrato" ${ro?'disabled':''}>${esc(p?.observacoes)}</textarea></div>
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
    ${p?.esteira_tipo === 'repasse' ? `
    <h2 style="margin-top:18px">📋 Checklist documental</h2>
    <div id="repChecklist">${checklist.map(it => `
      <div class="chk">
        <input type="checkbox" class="chk-item" data-id="${it.id}" ${it.ok?'checked':''} ${ro?'disabled':''}>
        <span style="flex:1">${esc(it.item)}${it.responsavel?` <span style="color:var(--muted2);font-size:11px">· ${esc(it.responsavel)}</span>`:''}${it.validade?` <span style="color:var(--muted2);font-size:11px">· validade ${fmtDt(it.validade)}</span>`:''}</span>
      </div>`).join('')}</div>
    ` : ''}
    <h2 style="margin-top:18px">💬 Conversa com o cliente (Portal)</h2>
    <div id="epChatMsgs" style="max-height:220px;overflow-y:auto;margin-bottom:10px">${mensagensProc.map(m => `
      <div style="display:flex;justify-content:${m.autor_tipo==='equipe'?'flex-end':'flex-start'};margin-bottom:8px">
        <div style="max-width:80%;background:${m.autor_tipo==='equipe'?'var(--accent2)':'var(--panel2)'};color:${m.autor_tipo==='equipe'?'#fff':'var(--text)'};border-radius:12px;padding:8px 12px;font-size:13px">
          <div>${esc(m.mensagem)}</div>
          <div style="font-size:10.5px;opacity:.75;margin-top:3px">${m.autor_tipo==='equipe'?'Equipe':'Cliente'}${m.autor_email?' · '+esc(m.autor_email):''} · ${fmtDt(m.criado_em)}</div>
        </div>
      </div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nenhuma mensagem do cliente ainda.</p>'}</div>
    ${!ro ? `<div style="display:flex;gap:8px;margin-bottom:10px">
      <input id="epChatInput" placeholder="Responder ao cliente..." style="flex:1">
      <button id="epChatEnviar" class="ghost">Enviar</button>
    </div>` : ''}
    <h2 style="margin-top:18px">🕓 Histórico do processo</h2>
    <div class="timeline">${historico.map(h => `
      <div class="tl-item"><div class="tl-dot"></div>
        <div><b>${fmtDt(h.criado_em)}</b> — ${esc(h.evento)}${h.autor ? ` <span style="color:var(--muted2);font-size:11px">· ${esc(h.autor)}</span>` : ''}</div></div>`).join('')}</div>
    ` : ''}
    <div class="msg" id="epMsg"></div>
    ${id && !ro && p?.esteira_tipo === 'analise_credito' ? `
    <div class="transfer-box">
      <b style="font-size:13px">📋 Parecer da análise de crédito</b>
      <p style="color:var(--muted);font-size:12px;margin:4px 0 8px">Escolha o resultado da sua análise. O processo é encaminhado automaticamente conforme o parecer.</p>
      <select id="epParecer" style="width:100%">
        <option value="">— escolher o parecer —</option>
        ${PARECERES_CREDITO.map(([k,l]) => `<option value="${k}" ${p.parecer_credito===k?'selected':''}>${l}</option>`).join('')}
      </select>
      <div id="epContratoBox" style="margin-top:8px;display:none">
        <label>Enviar processo de emissão de contrato para</label>
        <select id="epAnalistaContrato">
          <option value="">Deixar na fila (qualquer um pega)</option>
          ${equipe.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('')}
        </select>
      </div>
      <div style="margin-top:10px"><button id="epRegistrarParecer">Registrar parecer</button></div>
    </div>` : ''}
    ${id && !ro && p?.esteira_tipo !== 'analise_credito' ? `
    <div class="transfer-box">
      <b style="font-size:13px">➡️ Concluir minha etapa e transferir</b>
      <div style="margin-top:8px"><label>Enviar para (responsável pela próxima etapa)</label><select id="epProxAnalista">
        <option value="">Deixar na fila (qualquer um pega)</option>
        ${equipe.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select></div>
      <div style="margin-top:8px"><label>Data/hora dessa movimentação</label><input id="epDataHoraMov" type="datetime-local" value="${new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${transicoes.map(t => `<button class="btn-transicao" data-destino="${t.etapa_destino_id||''}" data-rotulo="${esc(t.rotulo)}">${esc(t.rotulo)}</button>`).join('')
          || '<span style="color:var(--muted);font-size:12.5px">Nenhuma transição configurada para esta etapa.</span>'}
      </div>
    </div>` : ''}
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:end;flex-wrap:wrap">
      <button id="epCancel" class="ghost">Fechar</button>
      ${id ? '<button id="btnEmailProcesso" class="ghost">✉️ Gerar e-mail</button>' : ''}
      ${id && state.role === 'admin' ? '<button id="btnExcluirProc" class="ghost" style="color:var(--err)">🗑️ Excluir processo</button>' : ''}
      ${id && !ro ? '<button id="btnFinalizar" class="ghost">✅ Concluir processo</button>' : ''}
      ${!ro ? `<button id="epSalvar">${id ? 'Salvar alterações' : 'Criar processo'}</button>` : ''}
    </div>
  </div>`;
  document.body.appendChild(div);
  const $ = (i) => div.querySelector('#' + i);
  $('epCancel').onclick = () => div.remove();
  div.querySelectorAll('.chk-item').forEach(c => c.onchange = async () => {
    await sb.from('repasse_checklist').update({ ok: c.checked, responsavel: c.checked ? state.session?.user?.email : null }).eq('id', c.dataset.id);
  });
  const btnEmailProc = $('btnEmailProcesso');
  if (btnEmailProc) btnEmailProc.onclick = () => {
    // Assunto padronizado: PROCESSO / CLIENTE / UNIDADE / EMPREENDIMENTO — sempre no mesmo formato, sem digitar na mão
    const clienteTxt = $('epCliente').options[$('epCliente').selectedIndex]?.text || '—';
    const empTxt = $('epEmp').options[$('epEmp').selectedIndex]?.text || '—';
    const unidadeTxt = $('epUnidade').value.trim() || '—';
    const assunto = `${$('epTitulo').value.trim() || p.titulo} / ${clienteTxt} / ${unidadeTxt} / ${empTxt}`;
    const enc = (s) => encodeURIComponent(s);
    const mailtoUrl = `mailto:?subject=${enc(assunto)}`;
    const div2 = document.createElement('div');
    div2.className = 'modal-bg';
    div2.innerHTML = `<div class="modal" style="width:520px">
      <h2>✉️ Assunto do e-mail gerado</h2>
      <div><label>Assunto</label><input id="geAssunto" value="${esc(assunto)}" readonly></div>
      <div class="msg" id="geMsg" style="margin-top:8px"></div>
      <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
        <button id="geFechar" class="ghost">Fechar</button>
        <button id="geCopiar" class="ghost">📋 Copiar assunto</button>
        <button id="geAbrir">Abrir no e-mail</button>
      </div>
    </div>`;
    document.body.appendChild(div2);
    div2.querySelector('#geFechar').onclick = () => div2.remove();
    div2.querySelector('#geAbrir').onclick = () => { window.location.href = mailtoUrl; };
    div2.querySelector('#geCopiar').onclick = async () => {
      try { await navigator.clipboard.writeText(assunto); div2.querySelector('#geMsg').textContent = '✅ Assunto copiado!'; }
      catch { div2.querySelector('#geAssunto').select(); }
    };
  };
  const chatMsgsEl2 = $('epChatMsgs');
  if (chatMsgsEl2) chatMsgsEl2.scrollTop = chatMsgsEl2.scrollHeight;
  const btnChatEnviar = $('epChatEnviar');
  if (btnChatEnviar) btnChatEnviar.onclick = async () => {
    const texto = $('epChatInput').value.trim();
    if (!texto) return;
    const { error } = await sb.from('processo_mensagens').insert({
      processo_id: id, autor_tipo: 'equipe', autor_email: state.session?.user?.email, mensagem: texto,
    });
    if (!error) { div.remove(); openProcessoEsteira(id, etapas); }
  };

  const coletar = () => ({
    titulo: $('epTitulo').value.trim(),
    cliente_id: $('epCliente').value || null,
    empreendimento_id: $('epEmp').value || null,
    unidade: $('epUnidade').value || null,
    prioridade: $('epPrioridade').value,
    analista_atual_id: $('epAnalista').value || null,
    obs: $('epObs').value || null,
    observacoes: $('epObservacoes') ? ($('epObservacoes').value || null) : null,
    ...( $('epBloco') ? { bloco: $('epBloco').value } : {} ),
    ...( $('epFaturado') ? { sera_faturado: $('epFaturado').value === '' ? null : $('epFaturado').value === 'sim' } : {} ),
  });

  const parecerSelect = $('epParecer');
  const contratoBox = $('epContratoBox');
  const atualizaContratoBox = () => { contratoBox.style.display = ['aprovado_contrato','aprovado_pendencia_contrato'].includes(parecerSelect.value) ? '' : 'none'; };
  atualizaContratoBox();
  if (parecerSelect) parecerSelect.onchange = atualizaContratoBox;

  const btnParecer = $('epRegistrarParecer');
  if (btnParecer) btnParecer.onclick = async () => {
    const parecer = $('epParecer').value;
    if (!parecer) { $('epMsg').textContent = 'Escolha o parecer antes de registrar.'; return; }
    const rotulo = (PARECERES_CREDITO.find(x => x[0] === parecer) || [])[1] || parecer;
    if (!confirm(`Registrar o parecer "${rotulo}"?`)) return;
    btnParecer.disabled = true; $('epMsg').textContent = 'Registrando...';
    // o restante (mover de bloco, encerrar, criar o card de contrato) é feito automaticamente pelo banco (trigger)
    const { error } = await sb.from('esteira_processos').update({ parecer_credito: parecer }).eq('id', id);
    if (error) { $('epMsg').textContent = error.message; btnParecer.disabled = false; return; }
    // Se foi para emissão de contrato e um analista de destino foi escolhido, atribui o processo recém-criado a ele
    const analistaContrato = $('epAnalistaContrato') ? $('epAnalistaContrato').value : '';
    if (['aprovado_contrato','aprovado_pendencia_contrato'].includes(parecer) && analistaContrato) {
      const { data: filho } = await sb.from('esteira_processos').select('id').eq('processo_origem_id', id)
        .eq('esteira_tipo', 'emissao_contrato').order('criado_em', { ascending: false }).limit(1).maybeSingle();
      if (filho) await sb.from('esteira_processos').update({ analista_atual_id: analistaContrato, status: 'EM_ANDAMENTO' }).eq('id', filho.id);
    }
    div.remove();
    renderEsteira();
  };

  const btnSalvar = $('epSalvar');
  if (btnSalvar) btnSalvar.onclick = async () => {
    const rec = coletar();
    if (!rec.titulo) { $('epMsg').textContent = 'Informe o título do processo.'; return; }
    if (!id && !etapas.length) { $('epMsg').textContent = 'Não há nenhuma etapa ativa configurada para esta esteira — avise o administrador (Portal do Cliente → Fluxo do portal).'; return; }
    rec.status = rec.analista_atual_id ? 'EM_ANDAMENTO' : 'AGUARDANDO';
    btnSalvar.disabled = true;
    const txtOriginal = btnSalvar.textContent; btnSalvar.textContent = 'Salvando...';
    try {
      let r;
      if (id) r = await sb.from('esteira_processos').update(rec).eq('id', id);
      else { rec.etapa_atual_id = etapas[0].id; rec.esteira_tipo = state.esteiraTipo; r = await sb.from('esteira_processos').insert(rec); }
      if (r.error) { $('epMsg').textContent = r.error.message; btnSalvar.disabled = false; btnSalvar.textContent = txtOriginal; return; }
      div.remove();
      await renderEsteira();
    } catch (e) {
      $('epMsg').textContent = 'Ocorreu um erro inesperado ao salvar: ' + (e?.message || e);
      btnSalvar.disabled = false; btnSalvar.textContent = txtOriginal;
    }
  };
  if (!id) return;

  div.querySelectorAll('.btn-transicao').forEach(btn => btn.onclick = async () => {
    const destino = btn.dataset.destino || null;
    const rotulo = btn.dataset.rotulo;
    const proxAnalista = $('epProxAnalista').value || null;
    // Data/hora da movimentação: puxa o momento atual automaticamente, mas dá pra editar
    // (ex.: lançar algo que aconteceu mais cedo, sem perder a ordem real no histórico).
    const dataHoraMovInput = $('epDataHoraMov');
    const dataHoraMov = dataHoraMovInput?.value ? new Date(dataHoraMovInput.value).toISOString() : new Date().toISOString();
    if (!destino) {
      const obsAtual = $('epObservacoes') ? $('epObservacoes').value.trim() : '';
      const enviarContrato = rotulo.includes('enviar para Emissão de Contrato');
      const devolver = rotulo.includes('devolver ao Incorporador');
      let motivo = null, paraQuem = null;
      if (devolver) {
        paraQuem = prompt('Devolver para quem? (Incorporador / Imobiliária / nome)', 'Incorporador') || 'Incorporador/Imobiliária';
        motivo = prompt('Motivo da reprovação (fica registrado no histórico):') || null;
      }
      const { error } = await sb.from('esteira_processos').update({
        status: 'CONCLUIDO', concluido_em: dataHoraMov,
        observacoes: obsAtual || p.observacoes || null,
        devolvido_para: paraQuem, motivo_devolucao: motivo,
      }).eq('id', id);
      if (error) { $('epMsg').textContent = error.message; return; }
      await sb.from('esteira_historico').insert({ processo_id: id,
        evento: rotulo + (paraQuem ? ` → ${paraQuem}` : '') + (motivo ? ` · Motivo: ${motivo}` : ''),
        autor: state.session?.user?.email, criado_em: dataHoraMov });
      if (enviarContrato) {
        const { data: primeiraEtapa } = await sb.from('etapas_esteira').select('id').eq('esteira_tipo','emissao_contrato').eq('ativa',true).order('ordem').limit(1).single();
        const { data: novo } = await sb.from('esteira_processos').insert({
          titulo: p.titulo, cliente_id: p.cliente_id, empreendimento_id: p.empreendimento_id, unidade: p.unidade,
          prioridade: p.prioridade, esteira_tipo: 'emissao_contrato', etapa_atual_id: primeiraEtapa.id,
          status: 'AGUARDANDO', processo_origem_id: id,
          obs: `Veio da Análise de Crédito (aprovado)`,
          observacoes: obsAtual || p.observacoes || null,
        }).select('id').single();
        if (novo) await sb.from('esteira_historico').insert({ processo_id: novo.id,
          evento: `Criado a partir da Análise de Crédito aprovada (processo ${id.slice(0,8)})`, autor: state.session?.user?.email });
        state.esteiraTipo = 'emissao_contrato';
      }
      // Link Esteira → Repasse: ao concluir a Emissão de Contrato (sem ser devolução), já nasce o processo de Repasse
      if (p?.esteira_tipo === 'emissao_contrato' && !devolver) {
        const { data: primeiraEtapaRep } = await sb.from('etapas_esteira').select('id').eq('esteira_tipo','repasse').eq('ativa',true).order('ordem').limit(1).maybeSingle();
        if (primeiraEtapaRep) {
          const { data: novoRep } = await sb.from('esteira_processos').insert({
            titulo: p.titulo, cliente_id: p.cliente_id, empreendimento_id: p.empreendimento_id, unidade: p.unidade,
            prioridade: p.prioridade, esteira_tipo: 'repasse', etapa_atual_id: primeiraEtapaRep.id,
            status: 'AGUARDANDO', processo_origem_id: id,
            obs: `Veio da Emissão de Contrato (concluído)`,
            observacoes: obsAtual || p.observacoes || null,
          }).select('id').single();
          if (novoRep) await sb.from('esteira_historico').insert({ processo_id: novoRep.id,
            evento: `Criado a partir da Emissão de Contrato concluída (processo ${id.slice(0,8)})`, autor: state.session?.user?.email, criado_em: dataHoraMov });
        }
      }
      div.remove(); renderEsteira(); return;
    }
    const origemIdx = etapas.findIndex(e => e.id === p.etapa_atual_id);
    const destinoIdx = etapas.findIndex(e => e.id === destino);
    const ehRegressao = destinoIdx > -1 && origemIdx > -1 && destinoIdx < origemIdx;

    let motivoCategoria = null, motivoTexto = null;
    if (ehRegressao) {
      const opcoes = MOTIVOS_REGRESSAO.map(([k,l], i) => `${i+1}. ${l}`).join('\n');
      const escolha = prompt(`Esse processo está regredindo para uma etapa anterior. Qual o motivo?\n\n${opcoes}\n\nDigite o número:`);
      const idxMotivo = Number(escolha) - 1;
      if (!MOTIVOS_REGRESSAO[idxMotivo]) { $('epMsg').textContent = 'Regressão cancelada: escolha um motivo válido para continuar.'; return; }
      motivoCategoria = MOTIVOS_REGRESSAO[idxMotivo][0];
      motivoTexto = prompt('Descreva rapidamente o que aconteceu (fica registrado no histórico e, se for erro, no apontamento):') || MOTIVOS_REGRESSAO[idxMotivo][1];
    }

    const rec = { ...coletar(), etapa_atual_id: destino, analista_atual_id: proxAnalista,
      status: proxAnalista ? 'EM_ANDAMENTO' : 'AGUARDANDO' };
    const { error } = await sb.from('esteira_processos').update(rec).eq('id', id);
    if (error) { $('epMsg').textContent = error.message; return; }
    await sb.from('esteira_historico').insert({
      processo_id: id, evento: rotulo + (ehRegressao ? ` · Motivo: ${motivoTexto}` : ''),
      autor: state.session?.user?.email, motivo_categoria: motivoCategoria, criado_em: dataHoraMov,
    });

    if (ehRegressao) {
      // Erro automático: vai para quem validou (avançou) a etapa que está sendo reaberta —
      // exceto quando o motivo é "pedido do vendedor" (mudança de escopo, não é falha de análise).
      if (motivoCategoria !== 'pedido_vendedor') {
        const { data: ultimaValidacao } = await sb.from('esteira_validacoes')
          .select('validado_por_analista_id, validado_por_email')
          .eq('processo_id', id).eq('etapa_id', destino)
          .order('criado_em', { ascending: false }).limit(1).maybeSingle();
        if (ultimaValidacao?.validado_por_analista_id) {
          await sb.from('apontamentos_erro').insert({
            analista_id: ultimaValidacao.validado_por_analista_id,
            origem: 'esteira_regressao', categoria: 'Retrabalho — regressão de etapa',
            subcategoria: etapas[destinoIdx]?.nome || null,
            descricao: `Processo "${p.titulo}" devolvido de "${etapas[origemIdx]?.nome}" para "${etapas[destinoIdx]?.nome}". Motivo: ${motivoTexto}`,
            registrado_por: state.session?.user?.id, resolvido: false,
          });
        } else {
          await sb.from('esteira_historico').insert({ processo_id: id,
            evento: `⚠️ Não foi possível atribuir erro automático: não há registro de quem validou "${etapas[destinoIdx]?.nome}".`,
            autor: 'sistema' });
        }
      }
    } else {
      // Avanço: registra quem validou a etapa que está sendo concluída agora.
      await sb.from('esteira_validacoes').insert({
        processo_id: id, etapa_id: p.etapa_atual_id,
        validado_por_analista_id: state.meuAnalistaId, validado_por_email: state.session?.user?.email,
        criado_em: dataHoraMov,
      });
    }
    div.remove(); renderEsteira();
  });
  const btnFinalizar = $('btnFinalizar');
  if (btnFinalizar) btnFinalizar.onclick = async () => {
    const { error } = await sb.from('esteira_processos').update({ status: 'CONCLUIDO', concluido_em: new Date().toISOString() }).eq('id', id);
    if (error) { $('epMsg').textContent = error.message; return; }
    div.remove(); renderEsteira();
  };
  const btnExcluirProc = $('btnExcluirProc');
  if (btnExcluirProc) btnExcluirProc.onclick = async () => {
    if (!confirm(`Excluir definitivamente o processo "${p.titulo}"? Essa ação não pode ser desfeita.`)) return;
    await sb.from('esteira_anexos').delete().eq('processo_id', id);
    await sb.from('esteira_historico').delete().eq('processo_id', id);
    const { error } = await sb.from('esteira_processos').delete().eq('id', id);
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
  const [{ data: rowsAll }, { data: procsRepasse }] = await Promise.all([
    sb.from('clientes').select('*, empreendimentos(nome), analistas(nome)').order('criado_em', { ascending: false }).limit(500),
    sb.from('esteira_processos').select('id,cliente_id,status').eq('esteira_tipo', 'repasse'),
  ]);
  const termo = state.repasseBusca.trim().toLowerCase();
  const rows = !termo ? (rowsAll||[]).slice(0,100) : (rowsAll||[]).filter(c =>
    (c.nome||'').toLowerCase().includes(termo) || (c.cpf||'').includes(termo) ||
    (c.unidade||'').toLowerCase().includes(termo) || (c.empreendimentos?.nome||'').toLowerCase().includes(termo));
  const STATUS_REP = ['PROPOSTA','CREDITO','PENDENCIA','CONTRATO','ASSINATURA','REPASSE_CONCLUIDO'];
  const tagCor = (s) => s === 'REPASSE_CONCLUIDO' ? 'CONCLUIDO' : s === 'PENDENCIA' ? 'PENDENTE' : 'RECEBIDO';

  const emAndamento = (procsRepasse||[]).filter(p=>!['CONCLUIDO','CANCELADO'].includes(p.status)).length;
  const concluidas = (procsRepasse||[]).filter(p=>p.status==='CONCLUIDO').length;
  const canceladas = (procsRepasse||[]).filter(p=>p.status==='CANCELADO').length;
  const soma = (campo) => (rowsAll||[]).reduce((s,c)=>s+(Number(c[campo])||0), 0);
  const vgv = soma('valor_compra_venda');
  const totalFinanciado = soma('valor_financiado');
  const comissaoPrevista = soma('valor_comissao_previsto');
  const comissaoRecebida = soma('valor_comissao_recebido');
  const ticketMedio = (rowsAll||[]).length ? vgv / (rowsAll||[]).filter(c=>c.valor_compra_venda).length || 0 : 0;
  const porBanco = {}; (rowsAll||[]).forEach(c => { if (c.banco) porBanco[c.banco] = (porBanco[c.banco]||0)+1; });
  const moeda = (v) => (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  shell(`
    <div class="kpis" style="margin-bottom:16px">
      <div class="kpi"><div class="v">${(rowsAll||[]).length}</div><div class="l">👤 Clientes em repasse</div></div>
      <div class="kpi"><div class="v">${emAndamento}</div><div class="l">⏳ Operações em andamento</div></div>
      <div class="kpi"><div class="v">${concluidas}</div><div class="l">✅ Operações concluídas</div></div>
      <div class="kpi"><div class="v" style="color:${canceladas?'var(--err)':'var(--text)'}">${canceladas}</div><div class="l">✕ Operações canceladas</div></div>
      <div class="kpi"><div class="v" style="font-size:22px">${moeda(vgv)}</div><div class="l">💰 VGV (valor geral de venda)</div></div>
      <div class="kpi"><div class="v" style="font-size:22px">${moeda(totalFinanciado)}</div><div class="l">🏦 Total financiado</div></div>
      <div class="kpi"><div class="v" style="font-size:22px">${moeda(ticketMedio)}</div><div class="l">📊 Ticket médio</div></div>
      <div class="kpi"><div class="v" style="font-size:20px">${moeda(comissaoPrevista)}</div><div class="l">Comissão prevista</div></div>
      <div class="kpi"><div class="v" style="font-size:20px;color:var(--ok)">${moeda(comissaoRecebida)}</div><div class="l">Comissão recebida</div></div>
    </div>
    ${Object.keys(porBanco).length ? `<div class="card" style="margin-bottom:16px">
      <h2 style="font-size:14px">Operações por banco</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${Object.entries(porBanco).sort((a,b)=>b[1]-a[1]).map(([b,q])=>`<span class="tag RECEBIDO">${esc(b)}: <b>${q}</b></span>`).join('')}</div>
    </div>` : ''}
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

  const TIPO_COOBRIGADO = { conjuge: 'Cônjuge', composicao_renda: 'Composição de renda', fiador: 'Fiador', procurador: 'Procurador' };
  async function openCliente(id) {
    let c = { status: 'PROPOSTA' }, eventos = [], coobrigados = [];
    if (id) {
      const [cc, ev, co] = await Promise.all([
        sb.from('clientes').select('*').eq('id', id).single(),
        sb.from('eventos_repasse').select('*').eq('cliente_id', id).order('data'),
        sb.from('clientes_coobrigados').select('*').eq('cliente_id', id).order('criado_em'),
      ]);
      c = cc.data; eventos = ev.data || []; coobrigados = co.data || [];
    }
    const L = state.lookups;
    const ro = state.role === 'leitura' ? 'disabled' : '';
    const dt = (v) => v ? String(v).slice(0,10) : '';
    const div = document.createElement('div');
    div.className = 'modal-bg';
    div.innerHTML = `<div class="modal" style="width:820px">
      <h2>${id ? '🏦 ' + esc(c.nome) : '🏦 Novo cliente'}</h2>
      <h2 style="font-size:13px;color:var(--muted);margin-top:0">Dados pessoais</h2>
      <div class="grid2">
        <div><label>Nome completo</label><input id="cNome" value="${esc(c.nome)}" ${ro}></div>
        <div><label>CPF</label><input id="cCpf" value="${esc(c.cpf)}" ${ro}></div>
        <div><label>RG</label><input id="cRg" value="${esc(c.rg)}" ${ro}></div>
        <div><label>Órgão emissor</label><input id="cRgOrgao" value="${esc(c.rg_orgao_emissor)}" ${ro}></div>
        <div><label>Data de nascimento</label><input id="cNasc" type="date" value="${dt(c.data_nascimento)}" ${ro}></div>
        <div><label>Estado civil</label><input id="cEc" value="${esc(c.estado_civil)}" ${ro}></div>
        <div><label>Nacionalidade</label><input id="cNac" value="${esc(c.nacionalidade)}" placeholder="Brasileira" ${ro}></div>
        <div><label>Profissão</label><input id="cProf" value="${esc(c.profissao)}" ${ro}></div>
        <div><label>Renda (R$)</label><input id="cRenda" type="number" value="${c.renda ?? ''}" ${ro}></div>
        <div><label>E-mail</label><input id="cEmail" value="${esc(c.email)}" ${ro}></div>
        <div><label>Celular</label><input id="cCelular" value="${esc(c.celular)}" ${ro}></div>
        <div><label>Telefone</label><input id="cTel1" value="${esc(c.telefone1)}" ${ro}></div>
        <div style="display:flex;align-items:end"><label class="chk-inline" style="text-transform:none;font-weight:500;color:var(--text)">
          <input type="checkbox" id="cPep" ${c.pep?'checked':''} ${ro}> Pessoa Politicamente Exposta (PEP)</label></div>
      </div>
      <div class="grid2" style="margin-top:6px">
        <div style="grid-column:1/-1"><label>Endereço</label><input id="cEnd" value="${esc(c.endereco)}" style="width:100%" ${ro}></div>
        <div><label>CEP</label><input id="cCep" value="${esc(c.cep)}" ${ro}></div>
        <div><label>Cidade</label><input id="cCidade" value="${esc(c.cidade)}" ${ro}></div>
        <div><label>Estado</label><input id="cEstado" value="${esc(c.estado)}" placeholder="SP" ${ro}></div>
      </div>

      <h2 style="font-size:13px;color:var(--muted);margin-top:18px">Dados da operação</h2>
      <div class="grid2">
        <div><label>Empreendimento</label><select id="cEmp" ${ro}><option value=""></option>
          ${L.empreendimentos.map(e=>`<option value="${e.id}" ${c.empreendimento_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select></div>
        <div><label>Unidade</label><input id="cUnid" value="${esc(c.unidade)}" ${ro}></div>
        <div><label>Incorporadora</label><select id="cIncorp" ${ro}><option value=""></option>
          ${L.empreendedoras.map(e=>`<option value="${e.id}" ${c.incorporadora_id===e.id?'selected':''}>${esc(e.nome)}</option>`).join('')}</select></div>
        <div><label>Imobiliária</label><input id="cImob" value="${esc(c.imobiliaria)}" ${ro}></div>
        <div><label>Corretor</label><input id="cCorretor" value="${esc(c.corretor)}" ${ro}></div>
        <div><label>Analista responsável</label><select id="cResp" ${ro}><option value=""></option>
          ${L.analistas.map(a=>`<option value="${a.id}" ${c.responsavel_id===a.id?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>
        <div><label>Banco</label><select id="cBanco" ${ro}><option value=""></option>
          ${BANCOS_REPASSE.map(b=>`<option ${c.banco===b?'selected':''}>${b}</option>`).join('')}</select></div>
        <div><label>Correspondente</label><input id="cCorr" value="${esc(c.correspondente)}" ${ro}></div>
        <div><label>Status</label><select id="cStatus" ${ro}>
          ${STATUS_REP.map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div><label>Nº da proposta bancária</label><input id="cNumProp" value="${esc(c.numero_proposta)}" ${ro}></div>
        <div><label>Nº do contrato bancário</label><input id="cNumContr" value="${esc(c.numero_contrato_bancario)}" ${ro}></div>
        <div><label>Nº da operação</label><input id="cNumOp" value="${esc(c.numero_operacao)}" ${ro}></div>
        <div><label>Data de entrada</label><input id="cDataEntrada" type="date" value="${dt(c.data_entrada)}" ${ro}></div>
        <div><label>Previsão de conclusão</label><input id="cPrevConcl" type="date" value="${dt(c.previsao_conclusao)}" ${ro}></div>
        <div><label>Data da conclusão</label><input id="cDataConcl" type="date" value="${dt(c.data_conclusao)}" ${ro}></div>
      </div>

      <h2 style="font-size:13px;color:var(--muted);margin-top:18px">Valores</h2>
      <div class="grid2">
        <div><label>Valor da compra e venda</label><input id="cVgv" type="number" step="0.01" value="${c.valor_compra_venda ?? ''}" ${ro}></div>
        <div><label>Valor de entrada</label><input id="cVEntrada" type="number" step="0.01" value="${c.valor_entrada ?? ''}" ${ro}></div>
        <div><label>Valor FGTS</label><input id="cVFgts" type="number" step="0.01" value="${c.valor_fgts ?? ''}" ${ro}></div>
        <div><label>Valor financiado</label><input id="cVFinanciado" type="number" step="0.01" value="${c.valor_financiado ?? ''}" ${ro}></div>
        <div><label>Valor do subsídio</label><input id="cVSubsidio" type="number" step="0.01" value="${c.valor_subsidio ?? ''}" ${ro}></div>
        <div><label>Recursos próprios</label><input id="cVRecProprios" type="number" step="0.01" value="${c.valor_recursos_proprios ?? ''}" ${ro}></div>
        <div><label>% de comissão</label><input id="cPctComissao" type="number" step="0.01" value="${c.percentual_comissao ?? ''}" ${ro}></div>
        <div><label>Comissão prevista (R$)</label><input id="cComissaoPrev" type="number" step="0.01" value="${c.valor_comissao_previsto ?? ''}" ${ro}></div>
        <div><label>Comissão recebida (R$)</label><input id="cComissaoReceb" type="number" step="0.01" value="${c.valor_comissao_recebido ?? ''}" ${ro}></div>
      </div>
      <div class="grid2" style="margin-top:6px"><div style="grid-column:1/-1"><label>Observações</label><input id="cObs" value="${esc(c.obs)}" style="width:100%" ${ro}></div></div>

      ${id ? `
      <h2 style="font-size:13px;color:var(--muted);margin-top:18px">👥 Coobrigados (cônjuge, composição de renda, fiador, procurador)</h2>
      <div id="coobList" class="anexo-list">${coobrigados.map(co => `
        <div class="anexo-item"><span style="flex:1"><b>${esc(TIPO_COOBRIGADO[co.tipo]||co.tipo)}</b> — ${esc(co.nome)}${co.cpf?' · '+esc(co.cpf):''}${co.renda?' · R$ '+Number(co.renda).toLocaleString('pt-BR'):''}</span>
          ${state.role!=='leitura' ? `<button class="ghost coobDel" data-id="${co.id}">✕</button>` : ''}</div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nenhum coobrigado cadastrado.</p>'}</div>
      ${state.role !== 'leitura' ? `<div class="grid2" style="margin-top:8px">
        <div><label>Tipo</label><select id="coobTipo">${Object.entries(TIPO_COOBRIGADO).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div>
        <div><label>Nome</label><input id="coobNome"></div>
        <div><label>CPF</label><input id="coobCpf"></div>
        <div><label>Renda (opcional)</label><input id="coobRenda" type="number"></div>
        <div style="grid-column:1/-1"><button id="btnAddCoob" class="ghost">+ Adicionar coobrigado</button></div>
      </div>` : ''}

      <h2 style="font-size:13px;color:var(--muted);margin-top:18px">⛓️ Workflow do repasse</h2>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:8px">Esteira com as 28 etapas, checklist documental e histórico completo ficam dentro do processo.</p>
      <button id="btnAbrirWorkflow" class="ghost">Abrir workflow e checklist →</button>

      <h2 style="margin-top:16px;font-size:13px;color:var(--muted)">🕓 Anotações rápidas</h2>
      <div class="timeline">${eventos.map(e => `
        <div class="tl-item"><div class="tl-dot"></div>
          <div><b>${new Date(e.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</b> — ${esc(e.evento)}
          ${e.autor ? `<span style="color:var(--muted);font-size:11px"> · ${esc(e.autor)}</span>` : ''}</div></div>`).join('') || '<p style="color:var(--muted);font-size:12.5px">Nenhuma anotação ainda.</p>'}
      </div>
      ${state.role !== 'leitura' ? `<div style="display:flex;gap:8px;margin-top:8px">
        <input id="cNovoEv" placeholder="Registrar anotação rápida" style="flex:1">
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
    const btnAddCoob = $('btnAddCoob');
    if (btnAddCoob) btnAddCoob.onclick = async () => {
      const nome = $('coobNome').value.trim();
      if (!nome) { $('cMsg').textContent = 'Informe o nome do coobrigado.'; return; }
      const { error } = await sb.from('clientes_coobrigados').insert({
        cliente_id: id, tipo: $('coobTipo').value, nome,
        cpf: $('coobCpf').value || null, renda: $('coobRenda').value ? Number($('coobRenda').value) : null,
      });
      if (error) { $('cMsg').textContent = error.message; return; }
      div.remove(); openCliente(id);
    };
    div.querySelectorAll('.coobDel').forEach(b => b.onclick = async () => {
      await sb.from('clientes_coobrigados').delete().eq('id', b.dataset.id);
      div.remove(); openCliente(id);
    });
    const btnWf = $('btnAbrirWorkflow');
    if (btnWf) btnWf.onclick = async () => {
      btnWf.disabled = true; btnWf.textContent = 'Abrindo...';
      const { data: etapasRepasse } = await sb.from('etapas_esteira').select('*').eq('esteira_tipo','repasse').eq('ativa',true).order('ordem');
      let { data: processo } = await sb.from('esteira_processos').select('id').eq('cliente_id', id).eq('esteira_tipo','repasse').maybeSingle();
      if (!processo) {
        const primeira = etapasRepasse[0];
        const { data: novo, error } = await sb.from('esteira_processos').insert({
          titulo: c.nome, cliente_id: id, empreendimento_id: c.empreendimento_id || null, unidade: c.unidade || null,
          esteira_tipo: 'repasse', etapa_atual_id: primeira.id, status: 'AGUARDANDO', analista_atual_id: c.responsavel_id || null,
        }).select('id').single();
        if (error) { $('cMsg').textContent = error.message; btnWf.disabled = false; btnWf.textContent = 'Abrir workflow e checklist →'; return; }
        processo = novo;
      }
      div.remove();
      openProcessoEsteira(processo.id, etapasRepasse);
    };
    const save = $('cSave');
    if (save) save.onclick = async () => {
      const rec = {
        nome: $('cNome').value.trim(), cpf: $('cCpf').value || null, rg: $('cRg').value || null,
        rg_orgao_emissor: $('cRgOrgao').value || null, data_nascimento: $('cNasc').value || null,
        estado_civil: $('cEc').value || null, nacionalidade: $('cNac').value || null, profissao: $('cProf').value || null,
        renda: $('cRenda').value ? Number($('cRenda').value) : null,
        telefone1: $('cTel1').value || null, celular: $('cCelular').value || null,
        email: $('cEmail').value || null, endereco: $('cEnd').value || null,
        cep: $('cCep').value || null, cidade: $('cCidade').value || null, estado: $('cEstado').value || null,
        pep: $('cPep').checked,
        banco: $('cBanco').value || null, correspondente: $('cCorr').value || null,
        empreendimento_id: $('cEmp').value || null, unidade: $('cUnid').value || null,
        incorporadora_id: $('cIncorp').value || null,
        imobiliaria: $('cImob').value || null, corretor: $('cCorretor').value || null,
        responsavel_id: $('cResp').value || null, status: $('cStatus').value,
        numero_proposta: $('cNumProp').value || null, numero_contrato_bancario: $('cNumContr').value || null,
        numero_operacao: $('cNumOp').value || null,
        data_entrada: $('cDataEntrada').value || null, previsao_conclusao: $('cPrevConcl').value || null,
        data_conclusao: $('cDataConcl').value || null,
        valor_compra_venda: $('cVgv').value ? Number($('cVgv').value) : null,
        valor_entrada: $('cVEntrada').value ? Number($('cVEntrada').value) : null,
        valor_fgts: $('cVFgts').value ? Number($('cVFgts').value) : null,
        valor_financiado: $('cVFinanciado').value ? Number($('cVFinanciado').value) : null,
        valor_subsidio: $('cVSubsidio').value ? Number($('cVSubsidio').value) : null,
        valor_recursos_proprios: $('cVRecProprios').value ? Number($('cVRecProprios').value) : null,
        percentual_comissao: $('cPctComissao').value ? Number($('cPctComissao').value) : null,
        valor_comissao_previsto: $('cComissaoPrev').value ? Number($('cComissaoPrev').value) : null,
        valor_comissao_recebido: $('cComissaoReceb').value ? Number($('cComissaoReceb').value) : null,
        obs: $('cObs').value || null,
      };
      if (!rec.nome) { $('cMsg').textContent = 'Informe o nome.'; return; }
      const r = id ? await sb.from('clientes').update(rec).eq('id', id) : await sb.from('clientes').insert(rec);
      if (r.error) { $('cMsg').textContent = r.error.message; return; }
      div.remove(); renderRepasse();
    };
  }
}

// ---------- BIBLIOTECA DO REPASSE (formulários por banco, conhecimento, cartórios, prefeituras) ----------
const CATEGORIAS_CONHECIMENTO = ['FGTS','HMP','HIS','MCMV','Cartórios','Prefeituras','Receita Federal','Legislação','Procedimentos internos'];
async function renderBibliotecaRepasse() {
  if (!state.bibliotecaTab) state.bibliotecaTab = 'formularios';
  const TABS = [['formularios','📁 Formulários por banco'], ['conhecimento','📚 Base de conhecimento'],
    ['cartorios','🏛️ Cartórios'], ['prefeituras','🏢 Prefeituras & Receita Federal']];
  const tabsHtml = `<div class="admin-tabs">${TABS.map(([k,l]) =>
    `<button class="admin-tab ${state.bibliotecaTab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
  const ro = state.role === 'leitura';

  if (state.bibliotecaTab === 'formularios') {
    if (!state.bibliotecaBanco) state.bibliotecaBanco = BANCOS_REPASSE[0];
    const { data: arquivos } = await sb.storage.from('repasse-formularios').list(state.bibliotecaBanco, { sortBy: { column: 'created_at', order: 'desc' } });
    const validos = (arquivos||[]).filter(a=>a.name!=='.emptyFolderPlaceholder');
    // agrupa por "nome base" (sem o prefixo de timestamp) pra achar a versao vigente
    const porBase = {};
    validos.forEach(a => {
      const base = a.name.includes('__') ? a.name.split('__').slice(1).join('__') : a.name;
      (porBase[base] = porBase[base] || []).push(a);
    });
    shell(`
      ${tabsHtml}
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <h2 style="margin:0">📁 Formulários por banco</h2>
          <select id="bibBanco">${BANCOS_REPASSE.map(b=>`<option ${state.bibliotecaBanco===b?'selected':''}>${b}</option>`).join('')}</select>
          ${!ro ? `<input type="file" id="bibUpload" style="max-width:220px">` : ''}
        </div>
        <div class="msg" id="bibMsg"></div>
        ${Object.keys(porBase).length ? Object.entries(porBase).map(([base, versoes]) => `
          <div class="cad-item" style="flex-wrap:wrap">
            <span style="flex:1">${iconeArquivo(base)} <b>${esc(base)}</b> <span class="tag CONCLUIDO">vigente</span>
              <span style="color:var(--muted2);font-size:11px"> · atualizado ${fmtDt(versoes[0].created_at)}</span></span>
            <button class="ghost bibBaixar" data-path="${state.bibliotecaBanco}/${esc(versoes[0].name)}">⬇ Baixar</button>
            ${versoes.length>1 ? `<span style="color:var(--muted2);font-size:11px">+${versoes.length-1} versão(ões) anterior(es)</span>` : ''}
          </div>`).join('') : '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhum formulário enviado para este banco ainda.</p>'}
      </div>`);
    document.getElementById('bibBanco').onchange = (e) => { state.bibliotecaBanco = e.target.value; renderBibliotecaRepasse(); };
    document.querySelectorAll('.bibBaixar').forEach(b => b.onclick = async () => {
      const { data } = await sb.storage.from('repasse-formularios').createSignedUrl(b.dataset.path, 60);
      if (data) window.open(data.signedUrl, '_blank');
    });
    const up = document.getElementById('bibUpload');
    if (up) up.onchange = async () => {
      const f = up.files[0]; if (!f) return;
      const msg = document.getElementById('bibMsg'); msg.textContent = 'Enviando...';
      const path = `${state.bibliotecaBanco}/${Date.now()}__${f.name}`;
      const { error } = await sb.storage.from('repasse-formularios').upload(path, f);
      if (error) { msg.textContent = error.message; return; }
      renderBibliotecaRepasse();
    };

  } else if (state.bibliotecaTab === 'conhecimento') {
    if (!state.conhecimentoCat) state.conhecimentoCat = 'Todas';
    const { data: artigos } = await sb.from('conhecimento_artigos').select('*').order('criado_em', { ascending: false });
    const filtrados = state.conhecimentoCat === 'Todas' ? (artigos||[]) : (artigos||[]).filter(a=>a.categoria===state.conhecimentoCat);
    shell(`
      ${tabsHtml}
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <h2 style="margin:0">📚 Base de conhecimento</h2>
          <select id="conhCatFiltro"><option ${state.conhecimentoCat==='Todas'?'selected':''}>Todas</option>
            ${CATEGORIAS_CONHECIMENTO.map(c=>`<option ${state.conhecimentoCat===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        ${!ro ? `<div class="grid2" style="margin-bottom:14px">
          <div><label>Categoria</label><select id="conhCat">${CATEGORIAS_CONHECIMENTO.map(c=>`<option>${c}</option>`).join('')}</select></div>
          <div><label>Tipo</label><select id="conhTipo"><option value="artigo">Artigo</option><option value="pdf">PDF</option><option value="link">Link</option><option value="modelo">Modelo</option><option value="video">Vídeo</option></select></div>
          <div style="grid-column:1/-1"><label>Título</label><input id="conhTitulo"></div>
          <div style="grid-column:1/-1"><label>Conteúdo / observação</label><textarea id="conhConteudo" rows="2"></textarea></div>
          <div style="grid-column:1/-1"><label>Link (se houver)</label><input id="conhUrl" placeholder="https://..."></div>
          <div style="grid-column:1/-1"><button id="btnAddConh" class="ghost">+ Adicionar</button></div>
        </div>
        <div class="msg" id="conhMsg" style="margin-bottom:10px"></div>` : ''}
        ${filtrados.length ? filtrados.map(a => `
          <div class="cad-item" style="align-items:flex-start;flex-wrap:wrap">
            <span style="flex:1"><span class="tag RECEBIDO">${esc(a.categoria)}</span> <b>${esc(a.titulo)}</b>
              ${a.conteudo?`<br><span style="color:var(--muted);font-size:12.5px">${esc(a.conteudo)}</span>`:''}
              ${a.url?`<br><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.url)}</a>`:''}</span>
            ${!ro ? `<button class="ghost conhDel" data-id="${a.id}">✕</button>` : ''}
          </div>`).join('') : '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nada cadastrado nesta categoria ainda.</p>'}
      </div>`);
    document.getElementById('conhCatFiltro').onchange = (e) => { state.conhecimentoCat = e.target.value; renderBibliotecaRepasse(); };
    const btnAddConh = document.getElementById('btnAddConh');
    if (btnAddConh) btnAddConh.onclick = async () => {
      const titulo = document.getElementById('conhTitulo').value.trim();
      const msg = document.getElementById('conhMsg');
      if (!titulo) { msg.textContent = 'Informe o título.'; return; }
      const { error } = await sb.from('conhecimento_artigos').insert({
        categoria: document.getElementById('conhCat').value, tipo: document.getElementById('conhTipo').value,
        titulo, conteudo: document.getElementById('conhConteudo').value || null, url: document.getElementById('conhUrl').value || null,
        criado_por: state.session?.user?.email,
      });
      if (error) { msg.textContent = error.message; return; }
      renderBibliotecaRepasse();
    };
    document.querySelectorAll('.conhDel').forEach(b => b.onclick = async () => {
      await sb.from('conhecimento_artigos').delete().eq('id', b.dataset.id);
      renderBibliotecaRepasse();
    });

  } else if (state.bibliotecaTab === 'cartorios') {
    const { data: cartorios } = await sb.from('cartorios_registro').select('*').order('nome');
    shell(`
      ${tabsHtml}
      <div class="card">
        <h2>🏛️ Cartórios de Registro de Imóveis <span class="count-badge">${(cartorios||[]).length}</span></h2>
        ${!ro ? `<div class="grid2" style="margin:10px 0">
          <div><label>Nome</label><input id="cartNome"></div>
          <div><label>Cidade</label><input id="cartCidade"></div>
          <div><label>Estado</label><input id="cartEstado" placeholder="SP"></div>
          <div><label>Telefone</label><input id="cartTel"></div>
          <div><label>Site</label><input id="cartSite"></div>
          <div><label>E-mail</label><input id="cartEmail"></div>
          <div><label>Tempo médio</label><input id="cartTempo" placeholder="Ex.: 15 dias úteis"></div>
          <div style="display:flex;align-items:end"><label class="chk-inline" style="text-transform:none;font-weight:500;color:var(--text)"><input type="checkbox" id="cartDigital"> Aceita documentos digitais</label></div>
          <div style="grid-column:1/-1"><label>Observações / requisitos / forma de protocolo</label><textarea id="cartObs" rows="2"></textarea></div>
          <div style="grid-column:1/-1"><button id="btnAddCart" class="ghost">+ Cadastrar cartório</button></div>
        </div>
        <div class="msg" id="cartMsg" style="margin-bottom:10px"></div>` : ''}
        ${(cartorios||[]).length ? cartorios.map(c => `
          <div class="cad-item" style="align-items:flex-start;flex-wrap:wrap">
            <span style="flex:1"><b>${esc(c.nome)}</b> ${c.cidade?`— ${esc(c.cidade)}/${esc(c.estado)}`:''}${c.aceita_digital?' <span class="tag CONCLUIDO">aceita digital</span>':''}
              ${c.telefone?`<br><span style="color:var(--muted);font-size:12px">📞 ${esc(c.telefone)}</span>`:''}
              ${c.tempo_medio?`<br><span style="color:var(--muted);font-size:12px">⏱ ${esc(c.tempo_medio)}</span>`:''}
              ${c.observacoes?`<br><span style="color:var(--muted);font-size:12px">${esc(c.observacoes)}</span>`:''}</span>
            ${!ro ? `<button class="ghost cartDel" data-id="${c.id}">✕</button>` : ''}
          </div>`).join('') : '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhum cartório cadastrado ainda — adicione os que sua equipe mais usa.</p>'}
      </div>`);
    const btnAddCart = document.getElementById('btnAddCart');
    if (btnAddCart) btnAddCart.onclick = async () => {
      const nome = document.getElementById('cartNome').value.trim();
      const msg = document.getElementById('cartMsg');
      if (!nome) { msg.textContent = 'Informe o nome do cartório.'; return; }
      const { error } = await sb.from('cartorios_registro').insert({
        nome, cidade: document.getElementById('cartCidade').value || null, estado: document.getElementById('cartEstado').value || null,
        telefone: document.getElementById('cartTel').value || null, site: document.getElementById('cartSite').value || null,
        email: document.getElementById('cartEmail').value || null, tempo_medio: document.getElementById('cartTempo').value || null,
        aceita_digital: document.getElementById('cartDigital').checked, observacoes: document.getElementById('cartObs').value || null,
      });
      if (error) { msg.textContent = error.message; return; }
      renderBibliotecaRepasse();
    };
    document.querySelectorAll('.cartDel').forEach(b => b.onclick = async () => {
      await sb.from('cartorios_registro').delete().eq('id', b.dataset.id);
      renderBibliotecaRepasse();
    });

  } else {
    const [{ data: prefeituras }, { data: atalhos }] = await Promise.all([
      sb.from('prefeituras_repasse').select('*').order('municipio'),
      sb.from('atalhos_uteis').select('*').order('categoria'),
    ]);
    shell(`
      ${tabsHtml}
      <div class="grid-cad">
        <div class="card">
          <h2>🏢 Prefeituras <span class="count-badge">${(prefeituras||[]).length}</span></h2>
          ${!ro ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
            <input id="prefMunicipio" placeholder="Município" style="flex:1;min-width:120px">
            <input id="prefEstado" placeholder="UF" style="width:60px">
            <input id="prefItbi" placeholder="Link emissão ITBI" style="flex:1;min-width:150px">
            <button id="btnAddPref" class="ghost">+ Adicionar</button>
          </div>
          <div class="msg" id="prefMsg"></div>` : ''}
          ${(prefeituras||[]).length ? prefeituras.map(p => `
            <div class="cad-item"><span style="flex:1"><b>${esc(p.municipio)}</b>${p.estado?'/'+esc(p.estado):''}
              ${p.link_itbi?` · <a href="${esc(p.link_itbi)}" target="_blank" rel="noopener">ITBI</a>`:''}</span>
              ${!ro?`<button class="ghost prefDel" data-id="${p.id}">✕</button>`:''}</div>`).join('')
            : '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhuma prefeitura cadastrada ainda.</p>'}
        </div>
        <div class="card">
          <h2>🏦 Receita Federal & Atalhos <span class="count-badge">${(atalhos||[]).length}</span></h2>
          ${!ro ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
            <input id="atNome" placeholder="Nome do atalho" style="flex:1;min-width:120px">
            <input id="atUrl" placeholder="https://..." style="flex:1;min-width:150px">
            <button id="btnAddAt" class="ghost">+ Adicionar</button>
          </div>` : ''}
          ${(atalhos||[]).length ? atalhos.map(a => `
            <div class="cad-item"><span style="flex:1"><span class="tag RECEBIDO">${esc(a.categoria)}</span> <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.nome)}</a></span>
              ${!ro?`<button class="ghost atDel" data-id="${a.id}">✕</button>`:''}</div>`).join('')
            : '<p style="color:var(--muted);font-size:12.5px;padding:8px 0">Nenhum atalho cadastrado.</p>'}
        </div>
      </div>`);
    const btnAddPref = document.getElementById('btnAddPref');
    if (btnAddPref) btnAddPref.onclick = async () => {
      const municipio = document.getElementById('prefMunicipio').value.trim();
      const msg = document.getElementById('prefMsg');
      if (!municipio) { msg.textContent = 'Informe o município.'; return; }
      const { error } = await sb.from('prefeituras_repasse').insert({
        municipio, estado: document.getElementById('prefEstado').value || null, link_itbi: document.getElementById('prefItbi').value || null,
      });
      if (error) { msg.textContent = error.message; return; }
      renderBibliotecaRepasse();
    };
    document.querySelectorAll('.prefDel').forEach(b => b.onclick = async () => {
      await sb.from('prefeituras_repasse').delete().eq('id', b.dataset.id);
      renderBibliotecaRepasse();
    });
    const btnAddAt = document.getElementById('btnAddAt');
    if (btnAddAt) btnAddAt.onclick = async () => {
      const nome = document.getElementById('atNome').value.trim(), url = document.getElementById('atUrl').value.trim();
      if (!nome || !url) return;
      await sb.from('atalhos_uteis').insert({ nome, url, categoria: 'Geral' });
      renderBibliotecaRepasse();
    };
    document.querySelectorAll('.atDel').forEach(b => b.onclick = async () => {
      await sb.from('atalhos_uteis').delete().eq('id', b.dataset.id);
      renderBibliotecaRepasse();
    });
  }
  document.querySelectorAll('.admin-tab').forEach(b => b.onclick = () => { state.bibliotecaTab = b.dataset.tab; renderBibliotecaRepasse(); });
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
  if (!session) { (EH_PORTAL_LOGIN ? renderLoginPortal : renderLogin)(); return; }
  state.session = session;
  // garante perfil e carrega nível de acesso
  await sb.from('perfis').upsert({ user_id: session.user.id, email: session.user.email }, { onConflict: 'user_id', ignoreDuplicates: true });
  const { data: perfil } = await sb.from('perfis').select('role,nome,email,ativo,analista_id,nome_completo,funcao,cadastro_completo,empreendedora_id').eq('user_id', session.user.id).single();
  if (perfil?.ativo === false) {
    await sb.auth.signOut();
    (EH_PORTAL_LOGIN ? renderLoginPortal : renderLogin)('Sua conta foi desativada. Fale com o administrador do sistema.');
    return;
  }
  if (EH_PORTAL_LOGIN && perfil?.role !== 'cliente') {
    await sb.auth.signOut();
    renderLoginPortal('Este acesso é exclusivo para clientes do Portal. Se você é da equipe interna, use o link do sistema interno.');
    return;
  }
  state.role = perfil?.role || 'analista';
  state.perfilNome = perfil?.nome_completo || perfil?.nome || '';
  state.meuAnalistaId = perfil?.analista_id || null;
  // Portal do Cliente: acesso externo (incorporadora/loteadora), tela totalmente separada do sistema interno
  if (state.role === 'cliente') {
    if (!perfil?.cadastro_completo) { renderCompletarCadastro(session, perfil); return; }
    renderPortalCliente(perfil); return;
  }
  await loadLookups();
  // primeiro acesso: exige nome completo e função antes de liberar o sistema
  if (!perfil?.cadastro_completo) { renderCompletarCadastro(session, perfil); return; }
  if (!podeVer(state.view)) state.view = 'inicio';
  render();
}

const DOMINIO_CORPORATIVO = '@neoservice.com.br';
function renderCompletarCadastro(session, perfil) {
  const ehCliente = perfil?.role === 'cliente';
  const emailCorp = (session.user.email || '').toLowerCase().endsWith(DOMINIO_CORPORATIVO);
  const podeEditar = emailCorp || ehCliente;
  app.innerHTML = `
  <div class="login-wrap" style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px">
    <div class="card" style="width:100%;max-width:460px">
      <h2 style="margin:0 0 4px">👋 Complete seu cadastro</h2>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px">${ehCliente ? 'Como devemos te chamar por aqui?' : 'Precisamos de alguns dados antes do primeiro acesso.'}</p>
      ${!podeEditar ? `<div class="msg" style="background:var(--warn-soft);border-color:var(--warn);margin-bottom:12px">
        ⚠️ O acesso ao sistema exige e-mail corporativo (<b>${DOMINIO_CORPORATIVO}</b>).<br>
        Você entrou com <b>${esc(session.user.email)}</b>. Peça ao administrador um convite para o seu e-mail corporativo.
      </div>` : ''}
      <div><label>Nome completo</label><input id="ccNome" value="${esc(perfil?.nome_completo)}" placeholder="Ex.: Maria Aparecida de Souza" ${!podeEditar?'disabled':''}></div>
      ${!ehCliente ? `<div style="margin-top:10px"><label>Função / cargo</label><input id="ccFuncao" value="${esc(perfil?.funcao)}" placeholder="Ex.: Analista de Contratos" ${!podeEditar?'disabled':''}></div>` : ''}
      <div style="margin-top:10px"><label>E-mail</label><input value="${esc(session.user.email)}" disabled></div>
      <div class="msg" id="ccMsg"></div>
      <div style="display:flex;gap:8px;justify-content:end;margin-top:14px">
        <button id="ccSair" class="ghost">Sair</button>
        ${podeEditar ? '<button id="ccSalvar">Concluir cadastro</button>' : ''}
      </div>
    </div>
  </div>`;
  document.getElementById('ccSair').onclick = async () => { await sb.auth.signOut(); (EH_PORTAL_LOGIN ? renderLoginPortal : renderLogin)(); };
  const bS = document.getElementById('ccSalvar');
  if (bS) bS.onclick = async () => {
    const nome = document.getElementById('ccNome').value.trim();
    const funcao = ehCliente ? '' : document.getElementById('ccFuncao').value.trim();
    if (!nome || (!ehCliente && !funcao)) { document.getElementById('ccMsg').textContent = ehCliente ? 'Preencha seu nome completo.' : 'Preencha nome completo e função.'; return; }
    const upd = { nome_completo: nome, nome, cadastro_completo: true };
    if (!ehCliente) upd.funcao = funcao;
    const { data: salvo, error } = await sb.from('perfis').update(upd)
      .eq('user_id', session.user.id).select().maybeSingle();
    if (error) { document.getElementById('ccMsg').textContent = error.message; return; }
    if (!salvo) { document.getElementById('ccMsg').textContent = 'Não foi possível salvar (sem permissão). Avise o administrador.'; return; }
    init();
  };
}

// ================= PORTAL DO CLIENTE (Fase 1 — somente leitura) =================
// Incorporadoras/loteadoras acompanham seus empreendimentos e processos em tempo real,
// sem acesso ao sistema interno da equipe. Escopo de dados garantido por RLS (perfis.empreendedora_id).
let portalCanal = null;
// Itens do menu lateral do portal. Só "inicio" tem tela própria hoje — os demais abrem um aviso "em breve"
// até termos os dados correspondentes (boletos, repasse, relatórios etc.) modelados no banco.
const PORTAL_NAV = [
  ['inicio', '🏠', 'Meus Empreendimentos'],
  ['processos', '📊', 'Processos'],
  ['pendencias', '📄', 'Pendências'],
  ['assinaturas', '✍️', 'Assinaturas'],
  ['boletos', '💳', 'Boletos'],
  ['repasse', '🏦', 'Repasse'],
  ['relatorios', '📈', 'Relatórios'],
  ['interacoes', '💬', 'Central de Interações'],
  ['documentos', '📁', 'Documentos'],
  ['conhecimento', '❓', 'Base de Conhecimento'],
];
function portalShell(perfil, inner, marca, topo, viewAtiva) {
  if (portalCanal) { sb.removeChannel(portalCanal); portalCanal = null; }
  const logoUrl = marca?.logo_path ? sb.storage.from('empreendimentos-identidade').getPublicUrl(marca.logo_path).data.publicUrl : '';
  const nome = perfil.nome_completo || perfil.nome || perfil.email || '';
  const iniciais = nome ? nome.trim().charAt(0).toUpperCase() : '?';
  const ativa = viewAtiva || 'inicio';
  app.innerHTML = `
  <div class="portal-shell"${marca?.cor_secundaria ? ` style="--accent2:${esc(marca.cor_secundaria)}"` : ''}>
    <aside class="portal-sidebar">
      <div class="portal-sidebar-brand">
        ${logoUrl ? `<img src="${logoUrl}" alt="">` : `<span class="logo" style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">${ICONE_PREDIO}</span>`}
        <div class="txt"><b>${marca ? esc(marca.nome) : 'Portal do Cliente'}</b><small>NEO SERVICE</small></div>
      </div>
      ${PORTAL_NAV.map(([v,ic,label]) => `<button class="portal-nav-item ${v===ativa?'active':''}" data-nav="${v}">${ic} ${esc(label)}</button>`).join('')}
      <div class="portal-sidebar-foot">
        <div class="who">👤 ${esc(nome)}</div>
        <button id="pcSair">Sair</button>
      </div>
    </aside>
    <div class="portal-main">
      <div class="portal-topbar">
        <h1>${esc(topo?.titulo || 'Olá, ' + (nome.split(' ')[0] || '') + '!')}</h1>
        <p>${esc(topo?.subtitulo || 'Acompanhamento exclusivo da sua operação.')}</p>
      </div>
      <div class="portal-content">${inner}</div>
    </div>
  </div>`;
  document.getElementById('pcSair').onclick = async () => { await sb.auth.signOut(); (EH_PORTAL_LOGIN ? renderLoginPortal : renderLogin)(); };
  document.querySelectorAll('.portal-nav-item').forEach(b => b.onclick = () => {
    if (b.dataset.nav === 'inicio') { renderPortalCliente(perfil); return; }
    const label = PORTAL_NAV.find(([v]) => v === b.dataset.nav)?.[2] || '';
    portalShell(perfil, `
      <div class="card" style="text-align:center;padding:48px 20px">
        <div style="font-size:34px;margin-bottom:10px">🚧</div>
        <h2 style="margin-bottom:6px">${esc(label)}</h2>
        <p style="color:var(--muted);font-size:13px">Essa área está em desenvolvimento e vai aparecer em breve por aqui.</p>
      </div>`, marca, { titulo: label, subtitulo: 'Em breve.' }, b.dataset.nav);
  });
}
// Assina mudanças em tempo real e re-renderiza a tela atual quando algo muda
function portalRealtime(tabelas, aoMudar) {
  if (portalCanal) { sb.removeChannel(portalCanal); }
  portalCanal = sb.channel('portal-cliente-' + Date.now());
  tabelas.forEach(t => portalCanal.on('postgres_changes', { event: '*', schema: 'public', table: t }, aoMudar));
  portalCanal.subscribe();
}

// marca (logo/cor) da incorporadora do cliente logado — usada no cabeçalho de todas as telas do Portal
async function marcaDoCliente(perfil) {
  if (!perfil?.empreendedora_id) return null;
  const { data } = await sb.from('empreendedoras').select('nome,logo_path,cor_secundaria').eq('id', perfil.empreendedora_id).single();
  return data || null;
}

async function renderPortalCliente(perfil) {
  const [{ data: emps }, marca] = await Promise.all([
    sb.from('empreendimentos').select('id,nome').order('nome'),
    marcaDoCliente(perfil),
  ]);
  const empIds = (emps||[]).map(e=>e.id);
  const seisAtras = new Date(); seisAtras.setMonth(seisAtras.getMonth()-5); seisAtras.setDate(1); seisAtras.setHours(0,0,0,0);
  const [{ data: processos }, { data: credito }] = await Promise.all([
    sb.from('esteira_processos').select('id,titulo,status,empreendimento_id,etapa_atual_id,esteira_tipo').in('empreendimento_id', empIds.length?empIds:['00000000-0000-0000-0000-000000000000']),
    sb.from('esteira_processos').select('parecer_credito,criado_em').eq('esteira_tipo','analise_credito')
      .in('empreendimento_id', empIds.length?empIds:['00000000-0000-0000-0000-000000000000']).gte('criado_em', seisAtras.toISOString()),
  ]);
  // Análise de crédito mês a mês: recebidos, reprovados, com pendência e evoluídos para contrato
  const porMes = {};
  (credito||[]).forEach(p => {
    const d = new Date(p.criado_em);
    const chave = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    const r = porMes[chave] = porMes[chave] || { recebidos:0, reprovados:0, pendencia:0, contrato:0, data:new Date(d.getFullYear(),d.getMonth(),1) };
    r.recebidos++;
    if (p.parecer_credito === 'reprovado') r.reprovados++;
    if (p.parecer_credito === 'aprovado_pendencia' || p.parecer_credito === 'aprovado_pendencia_contrato') r.pendencia++;
    if (p.parecer_credito === 'aprovado_contrato' || p.parecer_credito === 'aprovado_pendencia_contrato') r.contrato++;
  });
  const mesesCredito = Object.values(porMes).sort((a,b) => b.data - a.data);
  const fmtMes = d => d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
  const emAndamento = (processos||[]).filter(p=>p.status!=='CONCLUIDO').length;
  const concluidos = (processos||[]).filter(p=>p.status==='CONCLUIDO').length;
  const procPorEmp = {};
  (processos||[]).forEach(p => {
    const r = procPorEmp[p.empreendimento_id] = procPorEmp[p.empreendimento_id] || { abertos: 0, concluidos: 0 };
    if (p.status !== 'CONCLUIDO') r.abertos++; else r.concluidos++;
  });
  // Funil resumido por tipo de esteira (análise de crédito / emissão de contrato) + concluídos
  const emAndamentoCredito = (processos||[]).filter(p => p.status!=='CONCLUIDO' && p.esteira_tipo==='analise_credito').length;
  const emAndamentoContrato = (processos||[]).filter(p => p.status!=='CONCLUIDO' && p.esteira_tipo==='emissao_contrato').length;
  const funilPassos = [
    ['Recebidos', (processos||[]).length],
    ['Análise de Crédito', emAndamentoCredito],
    ['Emissão de Contrato', emAndamentoContrato],
    ['Concluído', concluidos],
  ];
  const maxFunil = Math.max(1, ...funilPassos.map(([,n]) => n));
  // Donut de status (dados reais: em andamento x concluído — não temos granularidade de assinatura ainda)
  const totalProc = Math.max(1, (processos||[]).length);
  const pctAndamento = Math.round(emAndamento / totalProc * 100);
  const donutDeg = Math.round(emAndamento / totalProc * 360);
  portalShell(perfil, `
    <div class="pkpis">
      <div class="pkpi"><div class="pkpi-ic">🏗️</div><div><div class="pkpi-v">${(emps||[]).length}</div><div class="pkpi-l">EMPREENDIMENTOS</div></div></div>
      <div class="pkpi"><div class="pkpi-ic">⛓️</div><div><div class="pkpi-v">${emAndamento}</div><div class="pkpi-l">EM ANDAMENTO</div></div></div>
      <div class="pkpi ok"><div class="pkpi-ic">✅</div><div><div class="pkpi-v">${concluidos}</div><div class="pkpi-l">CONCLUÍDOS</div></div></div>
    </div>
    <h2 style="font-size:15px;margin-bottom:12px">Evolução dos processos</h2>
    <div class="pfunil">${funilPassos.map(([nome, n]) => `
      <div class="pfunil-step">
        <div class="n">${n}</div>
        <div class="l">${esc(nome)}</div>
        <div class="bar"><i style="width:${Math.round(n/maxFunil*100)}%"></i></div>
      </div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start">
      <div>
        <h2 style="font-size:15px;margin-bottom:12px">Seus empreendimentos</h2>
        <div class="table-scroll"><table class="users-table"><thead><tr><th>Empreendimento</th><th>Em andamento</th><th>Concluídos</th><th></th></tr></thead>
        <tbody>${(emps||[]).map(e => `
          <tr class="portal-emp-row" data-id="${e.id}" style="cursor:pointer">
            <td><b>${esc(e.nome)}</b></td>
            <td>${procPorEmp[e.id]?.abertos || 0}</td>
            <td>${procPorEmp[e.id]?.concluidos || 0}</td>
            <td style="text-align:right;color:var(--muted2)">→</td>
          </tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">Nenhum empreendimento vinculado ainda.</td></tr>'}</tbody></table></div>
      </div>
      <div>
        <h2 style="font-size:15px;margin-bottom:12px">Status dos Processos</h2>
        <div class="card" style="display:flex;align-items:center;gap:18px;margin-bottom:16px">
          <div style="width:84px;height:84px;border-radius:50%;flex-shrink:0;
            background:conic-gradient(var(--accent) 0deg ${donutDeg}deg, var(--border) ${donutDeg}deg 360deg);
            display:flex;align-items:center;justify-content:center">
            <div style="width:54px;height:54px;border-radius:50%;background:var(--panel);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">${totalProc}</div>
          </div>
          <div style="font-size:12.5px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="width:9px;height:9px;border-radius:50%;background:var(--accent);display:inline-block"></span>Em andamento (${pctAndamento}%)</div>
            <div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:var(--border);display:inline-block"></span>Concluídos (${100-pctAndamento}%)</div>
          </div>
        </div>
      </div>
    </div>
    <h2 style="font-size:15px;margin:22px 0 12px">Análise de Crédito — mês a mês</h2>
    <div class="table-scroll"><table class="users-table"><thead><tr><th>Mês</th><th>Recebidos</th><th>Reprovados</th><th>Com pendência</th><th>Evoluíram p/ contrato</th></tr></thead>
    <tbody>${mesesCredito.map(m => `
      <tr><td><b>${esc(fmtMes(m.data))}</b></td><td>${m.recebidos}</td><td>${m.reprovados}</td><td>${m.pendencia}</td><td>${m.contrato}</td></tr>`).join('')
      || '<tr><td colspan="5" style="color:var(--muted)">Nenhum processo de análise de crédito nos últimos 6 meses.</td></tr>'}</tbody></table></div>`,
    marca, { titulo: `Olá, ${(perfil.nome_completo || perfil.nome || perfil.email || '').split(' ')[0]}! 👋`,
             subtitulo: 'Aqui está o resumo do andamento dos seus processos.' });
  document.querySelectorAll('.portal-emp-row').forEach(el => el.onclick = () => renderPortalEmpreendimento(perfil, el.dataset.id));
  portalRealtime(['esteira_processos','esteira_historico'], () => renderPortalCliente(perfil));
}

async function renderPortalEmpreendimento(perfil, empId) {
  const [{ data: emp }, { data: processos }] = await Promise.all([
    sb.from('empreendimentos').select('id,nome,empreendedora_id').eq('id', empId).single(),
    sb.from('esteira_processos').select('*').eq('empreendimento_id', empId).order('criado_em', { ascending: false }),
  ]);
  const marca = await marcaDoCliente(perfil);
  portalShell(perfil, `
    <button id="pcVoltar" class="ghost" style="margin-bottom:16px">← Todos os empreendimentos</button>
    ${(processos||[]).map(p => `
      <div class="portal-proc-card">
        <div><b>${esc(p.titulo)}</b><div class="portal-proc-meta">${p.unidade?`Unidade ${esc(p.unidade)}`:'Sem unidade informada'}</div></div>
        <div style="display:flex;align-items:center;gap:14px">
          <span class="tag ${p.status==='CONCLUIDO'?'CONCLUIDO':p.status==='EM_ANDAMENTO'?'RECEBIDO':'PENDENTE'}">${esc(p.status)}</span>
          <button class="pcAbrir" data-id="${p.id}">Acompanhar →</button>
        </div>
      </div>`).join('') || '<p style="color:var(--muted)">Nenhum processo neste empreendimento ainda.</p>'}`,
    marca, { titulo: emp?.nome || 'Empreendimento', subtitulo: 'Acompanhe abaixo cada processo deste empreendimento.' });
  document.getElementById('pcVoltar').onclick = () => renderPortalCliente(perfil);
  document.querySelectorAll('.pcAbrir').forEach(b => b.onclick = () => renderPortalProcesso(perfil, b.dataset.id, empId));
  portalRealtime(['esteira_processos','esteira_historico'], () => renderPortalEmpreendimento(perfil, empId));
}

async function renderPortalProcesso(perfil, processoId, empId) {
  const [{ data: p }, { data: validacoes }, marca] = await Promise.all([
    sb.from('esteira_processos').select('*').eq('id', processoId).single(),
    sb.from('esteira_validacoes').select('*').eq('processo_id', processoId).order('criado_em'),
    marcaDoCliente(perfil),
  ]);
  if (!p) { renderPortalEmpreendimento(perfil, empId); return; }
  const { data: etapas } = await sb.from('etapas_esteira').select('*').eq('esteira_tipo', p.esteira_tipo).eq('ativa', true).order('ordem');
  const etapaAtualIdx = (etapas||[]).findIndex(e => e.id === p.etapa_atual_id);
  // última validação registrada para cada etapa (quem confirmou aquele passo como pronto, e quando)
  const validacaoPorEtapa = {};
  (validacoes||[]).forEach(v => { validacaoPorEtapa[v.etapa_id] = v; }); // a última sobrescreve as anteriores
  const fmtDuracao = (ms) => {
    const h = Math.floor(ms / 3600000), m = Math.round((ms % 3600000) / 60000);
    if (h < 24) return `${h}h${m ? ' '+m+'min' : ''}`;
    return `${Math.floor(h/24)}d ${h%24}h`;
  };
  let horarioAnterior = new Date(p.criado_em);
  const linhasEtapa = (etapas||[]).map((e, i) => {
    const v = validacaoPorEtapa[e.id];
    const concluida = i < etapaAtualIdx, atual = i === etapaAtualIdx;
    let tempoTxt = '—';
    if (v) { tempoTxt = fmtDuracao(new Date(v.criado_em) - horarioAnterior); horarioAnterior = new Date(v.criado_em); }
    else if (atual) { tempoTxt = fmtDuracao(new Date() - horarioAnterior) + ' (em andamento)'; }
    return { e, i, concluida, atual, v, tempoTxt };
  });
  const empNome = (await sb.from('empreendimentos').select('nome').eq('id', empId).single()).data?.nome || 'Empreendimento';
  const { data: mensagens } = await sb.from('processo_mensagens').select('*').eq('processo_id', processoId).order('criado_em');
  portalShell(perfil, `
    <button id="pcVoltar" class="ghost" style="margin-bottom:14px">← ${esc(empNome)}</button>
    <div class="card" style="margin-bottom:14px">
      <p style="color:var(--muted);font-size:13px">Status <span class="tag ${p.status==='CONCLUIDO'?'CONCLUIDO':'RECEBIDO'}">${esc(p.status)}</span>
        </p>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h2 style="font-size:14px;margin-bottom:16px">Andamento</h2>
      <div class="stepper">${linhasEtapa.map(({e,concluida,atual,v,tempoTxt}) => `
        <div class="step-row ${concluida?'done':atual?'current':'pending'}">
          <div class="step-line"></div>
          <div class="step-dot">${concluida?'✓':atual?'●':''}</div>
          <div class="step-body">
            <b>${esc(e.nome)}</b>
            <div class="step-meta">
              ${concluida?`<span>Concluída em ${fmtDt(v?.criado_em)}</span>`:atual?`<span>Em andamento</span>`:`<span>Aguardando</span>`}
              ${v?.validado_por_email ? `<span>Responsável: ${esc(v.validado_por_email)}</span>` : ''}
              <span>Tempo: ${tempoTxt}</span>
            </div>
          </div>
        </div>`).join('')}
      </div>
      <p style="color:var(--muted2);font-size:11px;margin-top:14px">SLA por etapa ainda não configurado — assim que houver um prazo padrão definido para cada etapa, aparece aqui também.</p>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h2 style="font-size:14px">💬 Falar com a equipe</h2>
      <p style="color:var(--muted);font-size:12px;margin-bottom:10px">Precisa cobrar um retorno? Manda aqui — quem está com o processo na esteira recebe o aviso.</p>
      <div id="pcChatMsgs" style="max-height:280px;overflow-y:auto;margin-bottom:10px">${(mensagens||[]).map(m => `
        <div style="display:flex;justify-content:${m.autor_tipo==='cliente'?'flex-end':'flex-start'};margin-bottom:8px">
          <div style="max-width:80%;background:${m.autor_tipo==='cliente'?'var(--accent)':'var(--panel2)'};color:${m.autor_tipo==='cliente'?'#fff':'var(--text)'};border-radius:12px;padding:8px 12px;font-size:13px">
            <div>${esc(m.mensagem)}</div>
            <div style="font-size:10.5px;opacity:.75;margin-top:3px">${m.autor_tipo==='cliente'?'Você':'Equipe'} · ${fmtDt(m.criado_em)}</div>
          </div>
        </div>`).join('') || '<p style="color:var(--muted);font-size:13px">Nenhuma mensagem ainda.</p>'}</div>
      <div style="display:flex;gap:8px">
        <input id="pcChatInput" placeholder="Escreva sua mensagem..." style="flex:1">
        <button id="pcChatEnviar">Enviar</button>
      </div>
    </div>`, marca, { titulo: p.titulo, subtitulo: `${empNome}${p.unidade ? ' · Unidade ' + p.unidade : ''}` });
  document.getElementById('pcVoltar').onclick = () => renderPortalEmpreendimento(perfil, empId);
  const chatMsgsEl = document.getElementById('pcChatMsgs');
  if (chatMsgsEl) chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight;
  document.getElementById('pcChatEnviar').onclick = async () => {
    const inp = document.getElementById('pcChatInput');
    const texto = inp.value.trim();
    if (!texto) return;
    const { error } = await sb.from('processo_mensagens').insert({
      processo_id: processoId, autor_tipo: 'cliente', autor_email: state.session?.user?.email, mensagem: texto,
    });
    if (!error) renderPortalProcesso(perfil, processoId, empId);
  };
  document.getElementById('pcChatInput').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('pcChatEnviar').click(); });
  portalRealtime(['esteira_processos','esteira_historico','processo_mensagens'], () => renderPortalProcesso(perfil, processoId, empId));
}

init();
