import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Zap } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width:220, background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize:17, fontWeight:800, letterSpacing:'-0.03em' }}>TaskFlow</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {[
            { to:'/dashboard', icon:LayoutDashboard, label:'Dashboard' },
            { to:'/projects',  icon:FolderKanban,  label:'Projects'  },
          ].map(({ to, icon:Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--r)',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              fontSize:13, fontWeight:500, transition:'all .15s',
            })}>
              <Icon size={16}/> {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'10px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px' }}>
            <img src={user?.avatar} alt={user?.name} style={{ width:30, height:30, borderRadius:'50%', flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em' }}>{user?.role}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn-icon btn-ghost" title="Logout" style={{ color:'var(--text-dim)' }}>
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
