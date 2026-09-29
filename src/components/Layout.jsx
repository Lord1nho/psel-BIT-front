import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, PlusCircle, Bell, Search, LogOut, Menu, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context'
import { CURRENT_USER } from '../data/mock'
import { Avatar } from './Shared'

export default function Layout() {
  const { logout, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const nav = useNavigate()
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
          <NavLink to="/" end className={link}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/solicitacoes" className={link}>
            <Ticket size={18} /> Solicitações
          </NavLink>
          <NavLink to="/nova" className={link}>
            <PlusCircle size={18} /> Nova solicitação
          </NavLink>
        </nav>
        <div className="side-foot">Bit Tecnologia e Energias Renováveis</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <label className="search">
            <Search size={16} />
            <input placeholder="Buscar solicitações..." onKeyDown={(e) => e.key === 'Enter' && nav('/solicitacoes')} />
          </label>
          <div className="spacer" />
          <button className="btn primary sm hide-sm" onClick={() => nav('/nova')}>
            <PlusCircle size={16} /> Nova
          </button>
          <button className="icon-btn" aria-label="Notificações">
            <Bell size={20} />
            <i className="ping" />
          </button>
          <div className="user" onClick={() => setMenu(!menu)}>
            <Avatar name={CURRENT_USER} />
            <span className="hide-sm">{CURRENT_USER}</span>
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

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
    </div>
  )
}
