import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useOutlet, useNavigate, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { LayoutDashboard, Ticket, PlusCircle, Bell, LogOut, Menu } from 'lucide-react'
import { useApp } from '../context'
import { ROLES } from '../data/mock'
import { Avatar } from './Shared'
import { useAction } from '../hooks/useAction'
import { pageVariants } from '../motion/variants'

// Ordem dos itens no menu: define se a tela nova vem de cima (item acima) ou de baixo (item abaixo)
const sectionIndex = (path) => (path.startsWith('/solicitacoes') ? 1 : path.startsWith('/nova') ? 2 : 0)

const NAV = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/solicitacoes', icon: Ticket, label: 'Solicitações' },
  { to: '/nova', icon: PlusCircle, label: 'Nova solicitação', requesterOnly: true },
]

export default function Layout() {
  const { logout, user, isAgent } = useApp()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [runLogout, loggingOut] = useAction()
  const nav = useNavigate()
  const { pathname, state } = useLocation()
  const navType = useNavigationType()
  const outlet = useOutlet()
  const profileRef = useRef(null)

  // Direção da transição: voltar (POP) · clique no menu (cima/baixo, vinda no state do link) · demais (avançar)
  const dir = navType === 'POP' ? 'back' : state?.dir || 'forward'
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // clicar num item acima/abaixo do atual: a tela nova entra de cima/de baixo
  const menuDirection = (to) => {
    const from = sectionIndex(pathname)
    const target = sectionIndex(to)
    return target === from ? undefined : { dir: target < from ? 'up' : 'down' }
  }

  // fecha o menu do perfil ao clicar fora ou com Esc
  useEffect(() => {
    if (!menu) return
    const onDown = (e) => profileRef.current && !profileRef.current.contains(e.target) && setMenu(false)
    const onKey = (e) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])
  // Esc fecha o menu aberto
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={open ? 'sidebar open' : 'sidebar'} onClick={() => setOpen(false)}>
        <div className="brand">
          <Link to="/solicitacoes" className="logo" aria-label="BIT — ir para a tela inicial" title="Ir para a tela inicial">BIT</Link>
          <span className="brand-text">
            Portal de
            <br />
            Solicitações
          </span>
        </div>
        <nav>
          {NAV.filter((n) => !n.requesterOnly || !isAgent).map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              state={menuDirection(to)}
            >
              {({ isActive }) => (
                <>
                  {/* o marcador desliza até o item novo: sobe ou desce conforme a posição */}
                  {isActive && <m.span layoutId="nav-indicator" className="nav-indicator" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                  <Icon size={18} /> <span className="label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">Bit Tecnologia e Energias Renováveis</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} title={open ? 'Fechar menu' : 'Abrir menu'}>
            <Menu size={20} />
          </button>
          <div className="spacer" />
          {!isAgent && (
            <button className="btn primary sm hide-sm" onClick={() => nav('/nova')}>
              <PlusCircle size={16} /> Nova
            </button>
          )}
          <button className="icon-btn" aria-label="Notificações">
            <Bell size={20} />
            <i className="ping" />
          </button>
          <div className="user" ref={profileRef} onClick={() => setMenu(!menu)}>
            <Avatar name={user.name} />
            <span className="hide-sm user-info">
              {user.name}
              <small>{ROLES[user.role]}</small>
            </span>
            <AnimatePresence>
              {menu && (
                <m.div
                  className="dropdown"
                  style={{ transformOrigin: 'top right' }}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                >
                  <button onClick={() => runLogout(logout)} disabled={loggingOut}>
                    <LogOut size={16} /> Sair
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </header>
        <main className="content">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <m.div key={pathname} custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit">
              {outlet}
            </m.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  )
}
