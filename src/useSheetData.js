import { useState, useEffect } from 'react'

// ─── CONFIGURAÇÃO ──────────────────────────────────────────────
// URL publicada via Arquivo > Publicar na web > CSV
// Para atualizar: gere nova URL e substitua aqui
const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhJwXPdMuoWPVXI8R93-k7eJMNZi84UwIyPSUc2GEqbZWpGiVzZ2i8Kvnq1EiWP-Fus95jvp9kGMNx/pub?output=csv'
// ──────────────────────────────────────────────────────────────

function getObjetivo(campanha) {
  const c = campanha.toUpperCase()
  if (c.includes('MSG_WPP') && c.includes('ENGAJAMENTO')) return 'Engajamento + Mensagens WPP'
  if (c.includes('MSG_WPP')) return 'Mensagens — WhatsApp'
  if (c.includes('TRAFEGO') || c.includes('VISITA_PERFIL')) return 'Tráfego — Visita ao Perfil'
  if (c.includes('ENGAJA') || c.includes('ENGAJAMENTO')) return 'Engajamento Puro'
  if (c.includes('RECONHECIMENTO') || c.includes('RENCONHECIMENTO') || c.includes('ALCANCE')) return 'Alcance e Reconhecimento'
  return 'Outros'
}

function parsePeriod(dateStr) {
  // Sheets retorna datas como "2026-03-14" ou serial Excel
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function processRows(rows) {
  // rows[0] = cabeçalho real (linha 2 da planilha)
  const header = rows[0]
  const dataRows = rows.slice(1)

  const idx = {
    day:     header.indexOf('Day'),
    camp:    header.indexOf('Campaign name'),
    ad:      header.indexOf('Ad Name'),
    url:     header.indexOf('Creative Facebook URL'),
    reach:   header.indexOf('Reach'),
    impr:    header.indexOf('Impressions'),
    clicks:  header.indexOf('Link clicks'),
    msgs:    header.indexOf('Messaging conversations started'),
    cpm_msg: header.indexOf('Cost per messaging conversation started'),
    p3s:     header.indexOf('3-second video plays'),
    p75:     header.indexOf('Video plays at 75%'),
  }

  // Agrupar por mês
  const byMes = {}

  for (const row of dataRows) {
    const day = row[idx.day]
    const mes = parsePeriod(day)
    if (!mes) continue

    const campanha  = row[idx.camp] || ''
    const adName    = row[idx.ad]   || ''
    const url       = row[idx.url]  || ''
    const reach     = parseFloat(row[idx.reach])  || 0
    const impr      = parseFloat(row[idx.impr])   || 0
    const clicks    = parseFloat(row[idx.clicks]) || 0
    const msgs      = parseFloat(row[idx.msgs])   || 0
    const costMsg   = parseFloat(row[idx.cpm_msg])|| 0
    const p3s       = parseFloat(row[idx.p3s])    || 0
    const p75       = parseFloat(row[idx.p75])    || 0
    const custo     = msgs * costMsg
    const objetivo  = getObjetivo(campanha)

    if (!byMes[mes]) byMes[mes] = { rows: [] }
    byMes[mes].rows.push({ adName, campanha, url, reach, impr, clicks, msgs, custo, p3s, p75, objetivo })
  }

  // Agregar KPIs, objetivos e criativos por mês
  const result = {}
  for (const [mes, { rows }] of Object.entries(byMes)) {
    // KPIs gerais
    const kpis = {
      criativos: new Set(rows.map(r => r.adName)).size,
      impressoes: rows.reduce((s, r) => s + r.impr,    0),
      cliques:    rows.reduce((s, r) => s + r.clicks,  0),
      mensagens:  rows.reduce((s, r) => s + r.msgs,    0),
      custo:      rows.reduce((s, r) => s + r.custo,   0),
      plays3s:    rows.reduce((s, r) => s + r.p3s,     0),
      plays75:    rows.reduce((s, r) => s + r.p75,     0),
    }

    // Por objetivo
    const objetivosMap = {}
    for (const r of rows) {
      if (!objetivosMap[r.objetivo]) {
        objetivosMap[r.objetivo] = { impressoes:0, cliques:0, msgs:0, custo:0, p3s:0, p75:0 }
      }
      const o = objetivosMap[r.objetivo]
      o.impressoes += r.impr
      o.cliques    += r.clicks
      o.msgs       += r.msgs
      o.custo      += r.custo
      o.p3s        += r.p3s
      o.p75        += r.p75
    }
    const objetivos = {}
    for (const [obj, o] of Object.entries(objetivosMap)) {
      objetivos[obj] = {
        impressoes: Math.round(o.impressoes),
        cliques:    Math.round(o.cliques),
        mensagens:  Math.round(o.msgs),
        custo:      Math.round(o.custo * 100) / 100,
        cpm:   o.impressoes > 0 ? Math.round(o.custo / o.impressoes * 1000 * 100) / 100 : 0,
        ctr:   o.impressoes > 0 ? o.cliques / o.impressoes : 0,
        cpc:   o.cliques    > 0 ? o.custo   / o.cliques    : 0,
        conv:  o.cliques    > 0 ? o.msgs    / o.cliques    : 0,
        cMsg:  o.msgs       > 0 ? o.custo   / o.msgs       : 0,
      }
    }

    // Por criativo (adName + objetivo)
    const crMap = {}
    for (const r of rows) {
      const key = `${r.adName}||${r.objetivo}`
      if (!crMap[key]) crMap[key] = { nome: r.adName, objetivo: r.objetivo, url: r.url,
        alcance:0, impr:0, clicks:0, msgs:0, custo:0, p3s:0, p75:0 }
      const c = crMap[key]
      c.alcance += r.reach
      c.impr    += r.impr
      c.clicks  += r.clicks
      c.msgs    += r.msgs
      c.custo   += r.custo
      c.p3s     += r.p3s
      c.p75     += r.p75
    }
    const criativos = Object.values(crMap).map(c => ({
      nome:      c.nome,
      objetivo:  c.objetivo,
      url:       c.url,
      alcance:   Math.round(c.alcance),
      impressoes:Math.round(c.impr),
      cliques:   Math.round(c.clicks),
      mensagens: Math.round(c.msgs),
      custo:     Math.round(c.custo * 100) / 100,
      cpc:    c.clicks > 0 ? c.custo  / c.clicks : 0,
      ctr:    c.impr   > 0 ? c.clicks / c.impr   : 0,
      gancho: c.impr   > 0 ? c.p3s    / c.impr   : 0,
      retencao: c.p3s  > 0 ? c.p75    / c.p3s    : 0,
      pctMsg: c.clicks > 0 ? c.msgs   / c.clicks : 0,
    }))

    result[mes] = { kpis, objetivos, criativos }
  }

  return result
}

export function useSheetData() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        // Buscar CSV da planilha publicada
        const res = await fetch(SHEET_CSV_URL)
        if (!res.ok) throw new Error(`Erro ao buscar planilha: ${res.status}`)
        const csv = await res.text()

        // Parse CSV simples
        const rows = csv.split('\n').map(line => {
          // Remover aspas externas de cada campo
          return line.match(/(".*?"|[^",]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g)
            ?.map(v => v.replace(/^"|"$/g, '').trim()) || []
        }).filter(r => r.some(v => v !== ''))

        // Filtrar linhas vazias — linha 1 vazia no CSV publicado, linha 2 é cabeçalho
        const nonEmpty = rows.filter(r => r.some(v => v !== ""))
        const processed = processRows(nonEmpty)
        setData(processed)
        setUpdatedAt(new Date())
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { data, loading, error, updatedAt }
}
