import React, { useState, useMemo } from 'react'
import { useSheetData } from './useSheetData'
import {
  fmt, pct, fmtBRL, deltaClass, deltaLabel, mesLabel,
  OBJ_META, OBJ_ORDER, ganchoColor, retencaoColor
} from './utils'
import styles from './App.module.css'

// ── Badge de gancho/retenção ──────────────────────────────────
function MetricBadge({ value, colorFn }) {
  const color = colorFn(value)
  if (!color) return <span className={styles.nd}>—</span>
  const fire = color === 'blue' ? ' 🔥' : ''
  return (
    <span className={`${styles.badge} ${styles['badge_' + color]}`}>
      {pct(value)}{fire}
    </span>
  )
}

// ── Funil de métricas ─────────────────────────────────────────
function Funil({ obj }) {
  const ctr     = obj.impressoes > 0 ? obj.cliques / obj.impressoes : 0
  const convRate = obj.cliques   > 0 ? obj.mensagens / obj.cliques  : 0
  const cpm     = obj.custo > 0 && obj.impressoes > 0 ? obj.custo / obj.impressoes * 1000 : 0
  const cpc     = obj.custo > 0 && obj.cliques    > 0 ? obj.custo / obj.cliques            : 0
  const cMsg    = obj.mensagens  > 0 ? obj.custo / obj.mensagens : 0

  return (
    <div className={styles.funil}>
      <div className={styles.funilStep}>
        <div className={styles.funilBox}>
          <div className={styles.funilMetric}>{fmt(obj.impressoes)}</div>
          <div className={styles.funilLabel}>Impressões</div>
          <div className={styles.funilSub}>{cpm > 0 ? `CPM R$ ${fmt(cpm, 2)}` : 'CPM N/D'}</div>
        </div>
      </div>

      <div className={styles.funilArrow}>
        <div className={styles.funilRate}>{pct(ctr)}</div>
        <div className={styles.arr}>→</div>
        <div className={styles.funilCost}>{cpc > 0 ? `CPC R$${fmt(cpc, 2)}` : 'N/D'}</div>
      </div>

      <div className={styles.funilStep}>
        <div className={styles.funilBox}>
          <div className={styles.funilMetric}>{fmt(obj.cliques)}</div>
          <div className={styles.funilLabel}>Cliques</div>
          <div className={styles.funilSub}>{obj.custo > 0 ? `R$ ${fmt(obj.custo, 2)} total` : 'Custo N/D'}</div>
        </div>
      </div>

      {obj.mensagens > 0 && <>
        <div className={styles.funilArrow}>
          <div className={styles.funilRate}>{pct(convRate)}</div>
          <div className={styles.arr}>→</div>
          <div className={styles.funilCost}>{`R$ ${fmt(cMsg, 2)} / msg`}</div>
        </div>
        <div className={styles.funilStep}>
          <div className={styles.funilBox}>
            <div className={styles.funilMetric}>{fmt(obj.mensagens)}</div>
            <div className={styles.funilLabel}>Mensagens</div>
            <div className={styles.funilSub}>{`R$ ${fmt(cMsg, 2)} / msg`}</div>
          </div>
        </div>
      </>}
    </div>
  )
}

// ── Callouts automáticos ──────────────────────────────────────
function Callouts({ objNome, criativos }) {
  const items = []

  const altaRet = criativos.filter(c => c.retencao >= 0.5 && c.gancho < 0.1 && c.mensagens === 0)
  if (altaRet.length)
    items.push({ type: 'warn', msg: `⚠ ${altaRet.map(c => c.nome).join(', ')} — retenção alta mas gancho <10% e zero conversas. Funciona para audiência quente, não para frio.` })

  const altaCtr = criativos.filter(c => c.ctr >= 0.05 && c.mensagens === 0)
  if (altaCtr.length)
    items.push({ type: 'info', msg: `📌 ${altaCtr.map(c => c.nome).join(', ')} — CTR excepcional (${altaCtr.map(c => pct(c.ctr)).join(', ')}). Testar em campanha MSG_WPP.` })

  if (objNome === 'Alcance e Reconhecimento') {
    const lixo = criativos.filter(c => c.retencao < 0.05 && c.alcance > 5000)
    if (lixo.length)
      items.push({ type: 'warn', msg: `⚠ ${lixo.map(c => c.nome).join(', ')} — alto alcance com retenção <5%. Queimando budget sem construir audiência qualificada.` })
  }

  if (objNome === 'Engajamento Puro') {
    const hot = criativos.filter(c => c.gancho >= 0.30)
    if (hot.length)
      items.push({ type: 'ok', msg: `⚡ ${hot.map(c => c.nome).join(', ')} — gancho excepcional (${hot.map(c => pct(c.gancho)).join(', ')}). Ideal para aquecer audiência.` })
  }

  return items.map((it, i) => (
    <div key={i} className={`${styles.callout} ${styles['callout_' + it.type]}`}>{it.msg}</div>
  ))
}

// ── Tabela de criativos ───────────────────────────────────────
function TabelaCriativos({ criativos }) {
  const sorted = [...criativos].sort((a, b) => (b.mensagens - a.mensagens) || (b.impressoes - a.impressoes))
  const maxMsg = Math.max(...sorted.map(r => r.mensagens), 0)

  return (
    <div className={styles.tblWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Criativo</th><th>Alcance</th><th>Impressões</th><th>Cliques</th>
            <th>CPC</th><th>CTR</th><th>T. Gancho</th><th>T. Retenção</th>
            <th>Mensagens</th><th>% Msg/Click</th><th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const isCamp = r.mensagens > 0 && r.mensagens === maxMsg
            return (
              <tr key={i}>
                <td className={styles.tdNome}>{r.nome}{isCamp ? ' 🏆' : ''}</td>
                <td>{fmt(r.alcance)}</td>
                <td>{fmt(r.impressoes)}</td>
                <td>{fmt(r.cliques)}</td>
                <td>{r.cpc > 0 ? `R$ ${fmt(r.cpc, 2)}` : <span className={styles.nd}>—</span>}</td>
                <td>{r.ctr > 0 ? pct(r.ctr) : <span className={styles.nd}>—</span>}</td>
                <td><MetricBadge value={r.gancho}   colorFn={ganchoColor} /></td>
                <td><MetricBadge value={r.retencao} colorFn={retencaoColor} /></td>
                <td>{r.mensagens > 0 ? fmt(r.mensagens) : <span className={styles.nd}>—</span>}</td>
                <td>{r.pctMsg > 0 ? pct(r.pctMsg) : <span className={styles.nd}>—</span>}</td>
                <td>
                  {r.url && r.url.startsWith('http')
                    ? <a className={styles.linkBtn} href={r.url} target="_blank" rel="noreferrer">Abrir ↗</a>
                    : <span className={styles.nd}>—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Seção de objetivo ─────────────────────────────────────────
function SecaoObjetivo({ objNome, objData, criativos }) {
  const meta  = OBJ_META[objNome] || { ico: '📌', desc: '' }
  const badge = objData.mensagens > 0
    ? `${fmt(objData.mensagens)} mensagens · R$ ${fmt(objData.custo, 2)} investidos`
    : objData.custo > 0 ? `R$ ${fmt(objData.custo, 2)} investidos` : 'Custo não rastreado'

  return (
    <div className={styles.sec}>
      <div className={styles.secHd}>
        <div className={styles.secIco}>{meta.ico}</div>
        <div>
          <div className={styles.secTitle}>{objNome}</div>
          <div className={styles.secSub}>{meta.desc}</div>
        </div>
        <div className={styles.secBadge}>{badge}</div>
      </div>
      <Funil obj={objData} />
      <Callouts objNome={objNome} criativos={criativos} />
      <TabelaCriativos criativos={criativos} />
    </div>
  )
}

// ── Bloco comparativo ─────────────────────────────────────────
function Comparativo({ mesSel, meses, data }) {
  const idx   = meses.indexOf(mesSel)
  const prevM = idx > 0 ? meses[idx - 1] : null
  if (!prevM) return null

  const k  = data[mesSel].kpis
  const pk = data[prevM].kpis
  const campos = [
    { l: 'Impressões',     v: k.impressoes, pv: pk.impressoes, f: n => fmt(n) },
    { l: 'Cliques',        v: k.cliques,    pv: pk.cliques,    f: n => fmt(n) },
    { l: 'Mensagens',      v: k.mensagens,  pv: pk.mensagens,  f: n => fmt(n) },
    { l: 'Custo Estimado', v: k.custo,      pv: pk.custo,      f: n => fmtBRL(n, 2) },
    { l: 'Plays 3s',       v: k.plays3s,    pv: pk.plays3s,    f: n => fmt(n) },
    { l: 'Plays 75%',      v: k.plays75,    pv: pk.plays75,    f: n => fmt(n) },
  ]

  return (
    <div className={styles.compBox}>
      <div className={styles.compTitle}>↗ Comparativo — {mesLabel(mesSel)} vs {mesLabel(prevM)}</div>
      <div className={styles.compGrid}>
        {campos.map((c, i) => (
          <div key={i} className={styles.compItem}>
            <div className={styles.compItemLbl}>{c.l}</div>
            <div className={styles.compVals}>
              <span className={styles.compCur}>{c.f(c.v)}</span>
              <span className={styles.compPrev}>{c.f(c.pv)}</span>
              <span className={`${styles.compDelta} ${styles[deltaClass(c.v, c.pv)]}`}>
                {deltaLabel(c.v, c.pv)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPIs do header ────────────────────────────────────────────
function HeaderKpis({ mesSel, meses, data }) {
  const idx  = meses.indexOf(mesSel)
  const prevM = idx > 0 ? meses[idx - 1] : null
  const k  = data[mesSel]?.kpis
  const pk = prevM ? data[prevM]?.kpis : null
  if (!k) return null

  const campos = [
    { l: 'Impressões', v: k.impressoes, pv: pk?.impressoes, f: n => fmt(n) },
    { l: 'Cliques',    v: k.cliques,    pv: pk?.cliques,    f: n => fmt(n) },
    { l: 'Mensagens',  v: k.mensagens,  pv: pk?.mensagens,  f: n => fmt(n) },
    { l: 'Custo Est.', v: k.custo,      pv: pk?.custo,      f: n => fmtBRL(n, 0) },
    { l: 'Criativos',  v: k.criativos,  pv: pk?.criativos,  f: n => fmt(n) },
  ]

  return (
    <div className={styles.hdKpis}>
      {campos.map((c, i) => (
        <div key={i} className={styles.kpi}>
          <div className={styles.kpiL}>{c.l}</div>
          <div className={styles.kpiV}>{c.f(c.v)}</div>
          {pk && (
            <div className={`${styles.kpiDelta} ${styles[deltaClass(c.v, c.pv)]}`}>
              {deltaLabel(c.v, c.pv)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── App principal ─────────────────────────────────────────────
export default function App() {
  const { data, loading, error, updatedAt } = useSheetData()
  const meses = useMemo(() => data ? Object.keys(data).sort() : [], [data])
  const [mesSel, setMesSel] = useState(null)

  // Selecionar automaticamente o mês mais recente
  const mesAtual = mesSel || (meses.length > 0 ? meses[meses.length - 1] : null)

  const mesData = mesAtual && data ? data[mesAtual] : null
  const objsOrdenados = mesData
    ? [...OBJ_ORDER.filter(o => mesData.objetivos[o]), ...Object.keys(mesData.objetivos).filter(o => !OBJ_ORDER.includes(o))]
    : []

  return (
    <div className={styles.app}>
      {/* HEADER */}
      <header className={styles.hd}>
        <div className={styles.hdLeft}>
          <div className={styles.logo}>
            <span className={styles.logoKeep}>Keep</span>
            <span className={styles.logoAds}>ads</span>
            <span className={styles.logoTag}>performance &amp; estratégia</span>
          </div>
          <div className={styles.hdDivider} />
          <div className={styles.hdInfo}>
            <div className={styles.hdClient}>Casa Nobre Home Center</div>
            <div className={styles.hdTitle}>Análise de Criativos por Objetivo</div>
          </div>
        </div>
        {data && mesAtual && (
          <HeaderKpis mesSel={mesAtual} meses={meses} data={data} />
        )}
      </header>

      {/* TABS */}
      {data && (
        <nav className={styles.tabBar}>
          <span className={styles.tabLbl}>Mês</span>
          {meses.map(m => (
            <button
              key={m}
              className={`${styles.tab} ${m === mesAtual ? styles.tabActive : ''}`}
              onClick={() => setMesSel(m)}
            >
              {mesLabel(m)}
            </button>
          ))}
        </nav>
      )}

      {/* LEGENDA */}
      <div className={styles.legBar}>
        <div className={styles.legGr}>
          <span className={styles.legLbl}>Gancho (&gt;15% bom · &gt;25% exc.):</span>
          {[['red','<10%'],['amber','10–15%'],['green','>15%'],['blue','>25%']].map(([c,l]) => (
            <span key={c} className={styles.li}><span className={styles.ld} style={{background:`var(--${c})`}} />{l}</span>
          ))}
        </div>
        <div className={styles.sv} />
        <div className={styles.legGr}>
          <span className={styles.legLbl}>Retenção (&gt;25% bom · &gt;40% exc.):</span>
          {[['red','<15%'],['amber','15–25%'],['green','>25%'],['blue','>40%']].map(([c,l]) => (
            <span key={c} className={styles.li}><span className={styles.ld} style={{background:`var(--${c})`}} />{l}</span>
          ))}
        </div>
      </div>

      {/* LOADING / ERRO */}
      {loading && (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <span>Carregando dados da planilha...</span>
        </div>
      )}
      {error && (
        <div className={styles.errorBox}>
          <strong>Erro ao carregar planilha:</strong> {error}
          <br /><small>Verifique se o VITE_SHEET_ID está configurado e a planilha está pública.</small>
        </div>
      )}

      {/* CONTEÚDO */}
      {mesData && (
        <main className={styles.main}>
          <Comparativo mesSel={mesAtual} meses={meses} data={data} />
          {objsOrdenados.map(obj => (
            <SecaoObjetivo
              key={obj}
              objNome={obj}
              objData={mesData.objetivos[obj]}
              criativos={mesData.criativos.filter(c => c.objetivo === obj)}
            />
          ))}
        </main>
      )}

      {/* FOOTER */}
      <footer className={styles.foot}>
        <span>
          Taxa de Gancho = Plays 3s ÷ Impressões · Taxa de Retenção = Plays 75% ÷ Plays 3s · % Msg/Click = Mensagens ÷ Cliques
        </span>
        <div className={styles.footBrand}>
          <span className={styles.footK}>Keep</span><span className={styles.footA}>ads</span>
          <span style={{marginLeft:6, color:'var(--muted2)'}}>
            · Fonte: Google Sheets · {updatedAt ? `Atualizado ${updatedAt.toLocaleTimeString('pt-BR')}` : ''}
          </span>
        </div>
      </footer>
    </div>
  )
}
