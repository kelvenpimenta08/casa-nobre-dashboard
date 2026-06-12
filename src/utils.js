export function fmt(n, dec = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export function pct(v, dec = 1) {
  if (!v || v === 0) return '—'
  return (v * 100).toFixed(dec) + '%'
}

export function fmtBRL(n, dec = 2) {
  if (!n || isNaN(n)) return '—'
  return 'R$ ' + fmt(n, dec)
}

export function deltaClass(cur, prev) {
  if (!prev) return 'neu'
  return cur > prev ? 'up' : cur < prev ? 'dn' : 'neu'
}

export function deltaLabel(cur, prev) {
  if (!prev || prev === 0) return '—'
  const d = ((cur - prev) / prev) * 100
  const sym = d > 0 ? '▲' : '▼'
  return `${sym} ${Math.abs(d).toFixed(1)}%`
}

export const MESES_LABEL = {
  '2026-03': 'Mar 2026',
  '2026-04': 'Abr 2026',
  '2026-05': 'Mai 2026',
  '2026-06': 'Jun 2026',
  '2026-07': 'Jul 2026',
  '2026-08': 'Ago 2026',
  '2026-09': 'Set 2026',
  '2026-10': 'Out 2026',
  '2026-11': 'Nov 2026',
  '2026-12': 'Dez 2026',
}

export function mesLabel(mes) {
  return MESES_LABEL[mes] || mes
}

export const OBJ_META = {
  'Mensagens — WhatsApp':        { ico: '💬', desc: 'Objetivo direto de conversas no WhatsApp' },
  'Engajamento + Mensagens WPP': { ico: '📊', desc: 'Engajamento + conversas WPP combinados' },
  'Engajamento Puro':            { ico: '👁', desc: 'Funil encerra no clique — sem rastreio de custo direto' },
  'Tráfego — Visita ao Perfil':  { ico: '🖱', desc: 'Funil encerra no clique — visita ao perfil' },
  'Alcance e Reconhecimento':    { ico: '📡', desc: 'CPM baixo, volume de impressões — funil encerra no clique' },
}

export const OBJ_ORDER = [
  'Mensagens — WhatsApp',
  'Engajamento + Mensagens WPP',
  'Engajamento Puro',
  'Tráfego — Visita ao Perfil',
  'Alcance e Reconhecimento',
]

export function ganchoColor(v) {
  if (!v || v === 0) return null
  if (v >= 0.25) return 'blue'
  if (v >= 0.15) return 'green'
  if (v >= 0.10) return 'amber'
  return 'red'
}

export function retencaoColor(v) {
  if (!v || v === 0) return null
  if (v >= 0.40) return 'blue'
  if (v >= 0.25) return 'green'
  if (v >= 0.15) return 'amber'
  return 'red'
}
