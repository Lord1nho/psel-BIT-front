import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Ticket, PlusCircle, Bell, Search, LogOut, Menu, ArrowLeft } from 'lucide-react'
import { useApp } from '../context'
import { ROLES } from '../data/mock'
import { Avatar } from './Shared'

export default function Layout() {
  const { logout, user, isAgent } = useApp()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const nav = useNavigate()
  const { key } = useLocation()
  const canGoBack = key !== 'default'
  const link = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <div className="shell">
      <aside className={open ? 'sidebar open' : 'sidebar'} onClick={() => setOpen(false)}>
        <div className="brand">
          <span className="logo">BIT</span>
          <span>
            Portal de
            <br />
            Solicitações
          </span>
        </div>
        <nav>
          {isAgent && (
            <NavLink to="/" end className={link}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
          )}
          <NavLink to="/solicitacoes" className={link}>
            <Ticket size={18} /> Solicitações
          </NavLink>
          {!isAgent && (
            <NavLink to="/nova" className={link}>
              <PlusCircle size={18} /> Nova solicitação
            </NavLink>
          )}
        </nav>
        <div className="side-foot">Bit Tecnologia e Energias Renováveis</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <button className="icon-btn" onClick={() => nav(-1)} disabled={!canGoBack} aria-label="Voltar" title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <label className="search">
            <Search size={16} />
            <input placeholder="Buscar solicitações..." onKeyDown={(e) => e.key === 'Enter' && nav(`/solicitacoes?q=${encodeURIComponent(e.target.value)}`)} />
          </label>
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
          <div className="user" onClick={() => setMenu(!menu)}>
            <Avatar name={user.name} />
            <span className="hide-sm user-info">
              {user.name}
              <small>{ROLES[user.role]}</small>
            </span>
            {menu && (
              <div className="dropdown">
                <button onClick={logout}>
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
