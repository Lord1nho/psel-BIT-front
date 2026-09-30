import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Loader, CheckCircle2, Layers, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts'
import { STATUS } from '../data/mock'
import * as api from '../services/api'

const TOTAL_COLOR = '#1E2A78'
const iso = (d) => d.toISOString().slice(0, 10)
const daysBack = (n) => iso(new Date(Date.now() - n * 86400000))
const fmtDay = (s) => s.slice(8, 10) + '/' + s.slice(5, 7)

function useCountUp(value) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t0 = Date.now()
    // setInterval (e não rAF) para a contagem terminar mesmo com a aba em segundo plano
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / 600, 1)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p >= 1) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [value])
  return n
}

function Kpi({ to, color, icon: Icon, label, description, value, total }) {
  const n = useCountUp(value)
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <Link to={to} className="card kpi-lg" style={{ '--c': color }}>
      <div className="kpi-top">
        <span className="kpi-icon"><Icon size={22} /></span>
        <span className="kpi-pct">{pct}% do total</span>
      </div>
      <strong>{n}</strong>
      <h4>{label}</h4>
      <p className="muted">{description}</p>
      <div className="meter"><i style={{ width: `${pct}%` }} /></div>
    </Link>
  )
}

// preenche os dias sem chamados para a linha do tempo ficar contínua
function fillDays(porDia) {
  if (!porDia.length) return []
  const map = Object.fromEntries(porDia.map((d) => [d.data, d]))
  const out = []
  const end = new Date(porDia[porDia.length - 1].data + 'T00:00:00Z')
  for (let d = new Date(porDia[0].data + 'T00:00:00Z'); d <= end; d = new Date(d.getTime() + 86400000)) {
    const k = iso(d)
    out.push(map[k] || { data: k, criadas: 0, concluidas: 0 })
  }
  return out
}

export default function Dashboard() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hidden, setHidden] = useState({})

  const invalidRange = from && to && to < from
  const today = iso(new Date())
  const endsToday = to === '' || to === today
  const activePreset = !endsToday ? '' : from === '' ? 'all' : from === daysBack(6) ? '7' : from === daysBack(29) ? '30' : ''

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (invalidRange) return
    let cancelled = false
    setLoading(true)
    api
      .getDashboard({ from, to, categoryId })
      .then((d) => {
        if (cancelled) return
        setData(d)
        setError('')
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [from, to, categoryId, invalidRange])

  const setPreset = (p) => {
    setTo('')
    setFrom(p === 'all' ? '' : daysBack(p === '7' ? 6 : 29))
  }
  const toggle = (e) => setHidden((h) => ({ ...h, [e.dataKey]: !h[e.dataKey] }))

  const statusData = data
    ? [
        { key: 'ABERTO', value: data.abertas },
        { key: 'EM_ATENDIMENTO', value: data.emAtendimento },
        { key: 'CONCLUIDO', value: data.concluidas },
      ].map((d) => ({ ...d, name: STATUS[d.key].label, color: STATUS[d.key].color }))
    : []
  const rate = data?.total ? Math.round((data.concluidas / data.total) * 100) : 0
  const timeline = data ? fillDays(data.porDia) : []

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Indicadores de operação das solicitações</p>
        </div>
      </div>

      <div className="card dash-filters">
        <div className="chips">
          {[['all', 'Tudo'], ['30', '30 dias'], ['7', '7 dias']].map(([k, l]) => (
            <button key={k} className={activePreset === k ? 'chip active' : 'chip'} onClick={() => setPreset(k)}>{l}</button>
          ))}
        </div>
        <label className="date-field">De <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="date-field">Até <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      {invalidRange && <p className="error">A data final não pode ser anterior à inicial.</p>}
      {error && <p className="error">{error}</p>}

      {!data ? (
        <div className="grid kpis4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card skeleton" style={{ height: 190 }} />)}
        </div>
      ) : (
        <div className={loading ? 'dash loading' : 'dash'}>
          <div className="grid kpis4">
            <Kpi to="/solicitacoes" color={TOTAL_COLOR} icon={Layers} label="Total de solicitações" description="Todas as solicitações registradas no período" value={data.total} total={data.total} />
            <Kpi to="/solicitacoes?status=ABERTO" color={STATUS.ABERTO.color} icon={Inbox} label="Abertas" description="Aguardando o primeiro atendimento" value={data.abertas} total={data.total} />
            <Kpi to="/solicitacoes?status=EM_ATENDIMENTO" color={STATUS.EM_ATENDIMENTO.color} icon={Loader} label="Em atendimento" description="Sendo tratadas por um atendente" value={data.emAtendimento} total={data.total} />
            <Kpi to="/solicitacoes?status=CONCLUIDO" color={STATUS.CONCLUIDO.color} icon={CheckCircle2} label="Concluídas" description="Demandas resolvidas e encerradas" value={data.concluidas} total={data.total} />
          </div>

          {data.total === 0 ? (
            <div className="card empty">
              <Inbox size={40} />
              <h3>Sem solicitações no período</h3>
              <p className="muted">Ajuste o período ou a categoria para ver os gráficos.</p>
            </div>
          ) : (
            <>
              <section className="card rate">
                <TrendingUp size={22} />
                <div className="grow">
                  <h3>Taxa de conclusão</h3>
                  <p className="muted">{data.concluidas} de {data.total} solicitações concluídas</p>
                  <div className="meter big"><i style={{ width: `${rate}%` }} /></div>
                </div>
                <strong>{rate}%</strong>
              </section>

              <div className="grid two">
                <section className="card">
                  <h3>Distribuição por status</h3>
                  <div className="chart">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3}>
                          {statusData.map((d) => <Cell key={d.key} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} (${Math.round((v / data.total) * 100)}%)`, n]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center"><strong>{data.total}</strong><span>total</span></div>
                  </div>
                </section>

                <section className="card">
                  <h3>Solicitações por categoria</h3>
                  <div className="chart">
                    <ResponsiveContainer>
                      <BarChart data={data.porCategoria} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'rgba(62,193,213,.08)' }} />
                        <Legend onClick={toggle} />
                        <Bar dataKey="abertas" name="Abertas" stackId="s" fill={STATUS.ABERTO.color} hide={hidden.abertas} />
                        <Bar dataKey="emAtendimento" name="Em atendimento" stackId="s" fill={STATUS.EM_ATENDIMENTO.color} hide={hidden.emAtendimento} />
                        <Bar dataKey="concluidas" name="Concluídas" stackId="s" fill={STATUS.CONCLUIDO.color} hide={hidden.concluidas} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <section className="card">
                <h3>Evolução diária</h3>
                <div className="chart tall">
                  <ResponsiveContainer>
                    <AreaChart data={timeline} margin={{ left: -20 }}>
                      <defs>
                        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3EC1D5" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#3EC1D5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="data" tickFormatter={fmtDay} tick={{ fontSize: 12 }} minTickGap={24} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={fmtDay} />
                      <Legend onClick={toggle} />
                      <Area type="monotone" dataKey="criadas" name="Criadas" stroke="#3EC1D5" strokeWidth={2} fill="url(#gc)" hide={hidden.criadas} />
                      <Area type="monotone" dataKey="concluidas" name="Concluídas (das criadas no dia)" stroke={STATUS.CONCLUIDO.color} strokeWidth={2} fill="none" hide={hidden.concluidas} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </>
  )
}
