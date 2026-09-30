import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Inbox, Loader, CheckCircle2, Layers, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts'
import { useApp } from '../context'
import { STATUS } from '../data/mock'
import * as api from '../services/api'

const TOTAL_COLOR = '#1E2A78'
const GROUPING = { dia: 'dia', semana: 'semana', mes: 'mês' }
const dmy = (s) => s.slice(8, 10) + '/' + s.slice(5, 7)

// `data` da série: dia = o próprio dia; semana = segunda-feira; mês = dia 1
const tickLabel = (grouping) => (s) =>
  grouping === 'mes' ? `${s.slice(5, 7)}/${s.slice(0, 4)}` : dmy(s)
const fullLabel = (grouping) => (s) =>
  grouping === 'semana' ? `Semana de ${dmy(s)}` : grouping === 'mes' ? `${s.slice(5, 7)}/${s.slice(0, 4)}` : dmy(s)

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

export default function Dashboard() {
  const { isAgent, user } = useApp()
  // `periodo` e `dataInicio/dataFim` são exclusivos: escolher um limpa o outro
  const [periodo, setPeriodo] = useState('tudo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [escopo, setEscopo] = useState('geral')
  const [categories, setCategories] = useState([])
  const [hidden, setHidden] = useState({})

  const invalidRange = dataInicio && dataFim && dataFim < dataInicio

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  const filters = {
    periodo: periodo || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    categoriaId: categoriaId || undefined,
    escopo: isAgent && escopo === 'meus' ? 'meus' : undefined,
  }
  const { data, isPending, isFetching, error } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => api.getDashboard(filters),
    placeholderData: keepPreviousData,
    enabled: !invalidRange,
  })

  const pickPreset = (p) => {
    setPeriodo(p)
    setDataInicio('')
    setDataFim('')
  }
  const pickDate = (setter) => (e) => {
    setter(e.target.value)
    setPeriodo('')
  }
  const toggle = (e) => setHidden((h) => ({ ...h, [e.dataKey]: !h[e.dataKey] }))
  const selectCategory = (d) => d?.categoriaId && setCategoriaId(String(d.categoriaId))

  const t = data?.totais
  const grouping = data?.periodo.agrupamento
  const statusData = data
    ? data.porStatus.map((s) => ({ ...s, name: STATUS[s.status].label, color: STATUS[s.status].color }))
    : []
  const rate = t?.total ? Math.round((t.concluidas / t.total) * 100) : 0
  const shownFrom = periodo ? data?.periodo.dataInicio || '' : dataInicio
  const shownTo = periodo ? data?.periodo.dataFim || '' : dataFim
  // Leva os filtros ativos do dashboard para a listagem (status do card + período, setor e escopo)
  const listLink = (status) => {
    const q = new URLSearchParams()
    if (status) q.set('status', status)
    if (data && data.periodo.tipo !== 'tudo') {
      q.set('dataInicio', data.periodo.dataInicio)
      q.set('dataFim', data.periodo.dataFim)
    }
    if (categoriaId) q.set('categoriaId', categoriaId)
    if (isAgent && escopo === 'meus') q.set('atendente', String(user.id))
    const s = q.toString()
    return '/solicitacoes' + (s ? `?${s}` : '')
  }
  const scopeLabel = data?.escopo === 'proprias' ? 'suas solicitações' : data?.escopo === 'meus' ? 'solicitações que você assumiu' : 'todas as solicitações'

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Indicadores de {scopeLabel}
            {data && ` · ${dmy(data.periodo.dataInicio)} a ${dmy(data.periodo.dataFim)}`}
          </p>
        </div>
      </div>

      <div className="card dash-filters">
        <div className="chips">
          {[['tudo', 'Tudo'], ['30d', '30 dias'], ['7d', '7 dias']].map(([k, l]) => (
            <button key={k} className={periodo === k ? 'chip active' : 'chip'} onClick={() => pickPreset(k)}>{l}</button>
          ))}
        </div>
        <label className="date-field">De <input type="date" value={shownFrom} max={shownTo || undefined} onChange={pickDate(setDataInicio)} /></label>
        <label className="date-field">Até <input type="date" value={shownTo} min={shownFrom || undefined} onChange={pickDate(setDataFim)} /></label>
        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Todos os setores</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {isAgent && (
          <div className="chips">
            {[['geral', 'Geral'], ['meus', 'Meus']].map(([k, l]) => (
              <button key={k} className={escopo === k ? 'chip active' : 'chip'} onClick={() => setEscopo(k)}>{l}</button>
            ))}
          </div>
        )}
      </div>
      {invalidRange && <p className="error">A data final não pode ser anterior à inicial.</p>}
      {error && <p className="error">{error.message}</p>}

      {isPending ? (
        <div className="grid kpis4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card skeleton" style={{ height: 190 }} />)}
        </div>
      ) : data ? (
        <div className={isFetching ? 'dash loading' : 'dash'}>
          <div className="grid kpis4">
            <Kpi to={listLink()} color={TOTAL_COLOR} icon={Layers} label="Total de solicitações" description="Todas as solicitações registradas no período" value={t.total} total={t.total} />
            <Kpi to={listLink('ABERTO')} color={STATUS.ABERTO.color} icon={Inbox} label="Abertas" description="Aguardando o primeiro atendimento" value={t.abertas} total={t.total} />
            <Kpi to={listLink('EM_ATENDIMENTO')} color={STATUS.EM_ATENDIMENTO.color} icon={Loader} label="Em atendimento" description="Sendo tratadas por um atendente" value={t.emAtendimento} total={t.total} />
            <Kpi to={listLink('CONCLUIDO')} color={STATUS.CONCLUIDO.color} icon={CheckCircle2} label="Concluídas" description="Demandas resolvidas e encerradas" value={t.concluidas} total={t.total} />
          </div>
          {data.escopo === 'meus' && (
            <p className="muted note">No escopo "Meus", Abertas é sempre 0: um chamado aberto ainda não tem atendente.</p>
          )}

          {t.total === 0 ? (
            <div className="card empty">
              <Inbox size={40} />
              <h3>Sem solicitações no período</h3>
              <p className="muted">Ajuste o período, o setor ou o escopo para ver os gráficos.</p>
            </div>
          ) : (
            <>
              <section className="card rate">
                <TrendingUp size={22} />
                <div className="grow">
                  <h3>Taxa de conclusão</h3>
                  <p className="muted">{t.concluidas} de {t.total} solicitações concluídas</p>
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
                        <Pie data={statusData} dataKey="total" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3}>
                          {statusData.map((d) => <Cell key={d.status} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} (${Math.round((v / t.total) * 100)}%)`, n]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center"><strong>{t.total}</strong><span>total</span></div>
                  </div>
                </section>

                <section className="card">
                  <h3>Solicitações por setor</h3>
                  <p className="muted hint">Clique numa barra para filtrar pelo setor</p>
                  <div className="chart short">
                    <ResponsiveContainer>
                      <BarChart data={data.porCategoria} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'rgba(62,193,213,.08)' }} />
                        <Legend onClick={toggle} />
                        <Bar dataKey="abertas" name="Abertas" stackId="s" fill={STATUS.ABERTO.color} hide={hidden.abertas} cursor="pointer" onClick={selectCategory} />
                        <Bar dataKey="emAtendimento" name="Em atendimento" stackId="s" fill={STATUS.EM_ATENDIMENTO.color} hide={hidden.emAtendimento} cursor="pointer" onClick={selectCategory} />
                        <Bar dataKey="concluidas" name="Concluídas" stackId="s" fill={STATUS.CONCLUIDO.color} hide={hidden.concluidas} cursor="pointer" radius={[4, 4, 0, 0]} onClick={selectCategory} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <section className="card">
                <h3>Evolução por {GROUPING[grouping]}</h3>
                <div className="chart tall">
                  <ResponsiveContainer>
                    <AreaChart data={data.serie} margin={{ left: -20 }}>
                      <defs>
                        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3EC1D5" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#3EC1D5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="data" tickFormatter={tickLabel(grouping)} tick={{ fontSize: 12 }} minTickGap={24} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={fullLabel(grouping)} />
                      <Legend onClick={toggle} />
                      <Area type="monotone" dataKey="criadas" name="Criadas" stroke="#3EC1D5" strokeWidth={2} fill="url(#gc)" hide={hidden.criadas} />
                      <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke={STATUS.CONCLUIDO.color} strokeWidth={2} fill="none" hide={hidden.concluidas} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}
        </div>
      ) : null}
    </>
  )
}
