import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Clock, RotateCcw, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/dashboard').then(r=>setData(r.data)).finally(()=>setLoading(false)); }, []);

  if (loading) return <div className="center"><div className="spinner"/></div>;

  const stats = [
    { label:'To Do',      value: data.byStatus.todo,        color:'var(--text-muted)', icon:Clock },
    { label:'In Progress',value: data.byStatus.in_progress,  color:'#818cf8',           icon:TrendingUp },
    { label:'In Review',  value: data.byStatus.review,       color:'var(--yellow)',     icon:RotateCcw },
    { label:'Done',       value: data.byStatus.done,         color:'var(--green)',      icon:CheckCircle2 },
  ];

  const upcoming = data.myTasks.filter(t => t.status !== 'done').slice(0, 8);

  return (
    <div className="page">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>
          Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {user?.name.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--text-muted)', marginTop:3, fontSize:13 }}>
          {format(new Date(),'EEEE, MMMM d')} · {data.totalTasks} task{data.totalTasks!==1?'s':''} assigned to you
        </p>
      </div>

      {data.overdue.length > 0 && (
        <div className="alert-warn" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <AlertTriangle size={15}/>
          <span>{data.overdue.length} overdue task{data.overdue.length>1?'s':''} need attention</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {stats.map(({ label, value, color, icon:Icon }) => (
          <div key={label} className="card" style={{ padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>{label}</p>
              <p style={{ fontSize:28, fontWeight:800, color, lineHeight:1 }}>{value}</p>
            </div>
            <div style={{ width:34, height:34, borderRadius:'var(--r)', background:color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={15} color={color}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:18 }}>
        {/* My Tasks */}
        <div className="card">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ fontSize:15, fontWeight:700 }}>My Open Tasks</h2>
            <Link to="/projects" style={{ fontSize:12, color:'var(--accent)', display:'flex', alignItems:'center', gap:4 }}>
              All projects <ArrowRight size={11}/>
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty"><CheckCircle2 size={36}/><p>All caught up! No open tasks.</p></div>
          ) : upcoming.map(task => {
            const over = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status!=='done';
            return (
              <Link key={task.id} to={`/tasks/${task.id}`}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--border)', transition:'background .1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:3, height:32, borderRadius:2, flexShrink:0, background:
                  {urgent:'var(--red)',high:'var(--yellow)',medium:'var(--accent)',low:'var(--green)'}[task.priority] }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.title}</p>
                  <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{task.project_name}</p>
                </div>
                <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                {task.due_date && <span style={{ fontSize:11, color:over?'var(--red)':'var(--text-dim)', flexShrink:0 }}>{format(parseISO(task.due_date),'MMM d')}</span>}
              </Link>
            );
          })}
        </div>

        {/* Activity */}
        <div className="card">
          <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:15, fontWeight:700 }}>Recent Activity</h2>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="empty" style={{ padding:32 }}><p>No recent activity</p></div>
          ) : data.recentActivity.map(t => (
            <Link key={t.id} to={`/tasks/${t.id}`}
              style={{ display:'flex', gap:10, padding:'11px 16px', borderBottom:'1px solid var(--border)', transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:8, height:8, borderRadius:'50%', marginTop:5, flexShrink:0, background:t.project_color }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</p>
                <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{t.project_name} · {format(parseISO(t.updated_at),'MMM d')}</p>
              </div>
              <span className={`badge badge-${t.status}`} style={{ alignSelf:'flex-start', marginTop:2 }}>{t.status.replace('_',' ')}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
