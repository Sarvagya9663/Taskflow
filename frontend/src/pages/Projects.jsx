import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, FolderKanban, Users, CheckSquare, X } from 'lucide-react';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#84cc16'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', color:COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/projects').then(r=>setProjects(r.data)).finally(()=>setLoading(false)); }, []);

  const create = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const r = await api.post('/projects', form);
      const full = await api.get(`/projects/${r.data.id}`);
      setProjects(p=>[full.data,...p]);
      setShow(false); setForm({ name:'', description:'', color:COLORS[0] });
    } catch(e) { setErr(e.response?.data?.errors?.[0]?.msg || e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="center"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} project{projects.length!==1?'s':''}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShow(true)}><Plus size={14}/> New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty" style={{ marginTop:60 }}>
          <FolderKanban size={48}/>
          <p style={{ fontSize:15, fontWeight:600, color:'var(--text-muted)' }}>No projects yet</p>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={()=>setShow(true)}><Plus size={14}/> New Project</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
          {projects.map(p => {
            const pct = p.task_count > 0 ? Math.round((p.done_count/p.task_count)*100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card"
                style={{ padding:18, display:'block', transition:'all .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color; e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)';}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:p.color+'20', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <FolderKanban size={15} color={p.color}/>
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600 }}>{p.name}</p>
                      <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${p.status==='active'?'in_progress':p.status==='done'?'done':'todo'}`}>{p.status}</span>
                </div>
                {p.description && <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.description}</p>}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:11, color:'var(--text-dim)' }}>Progress</span>
                    <span style={{ fontSize:11, color:'var(--text-dim)' }}>{pct}%</span>
                  </div>
                  <div style={{ height:3, background:'var(--border)', borderRadius:2 }}>
                    <div style={{ height:'100%', borderRadius:2, background:p.color, width:`${pct}%`, transition:'width .3s' }}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:14 }}>
                  <span style={{ fontSize:11, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:4 }}>
                    <CheckSquare size={11}/> {p.done_count}/{p.task_count} tasks
                  </span>
                  <span style={{ fontSize:11, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:4 }}>
                    <Users size={11}/> {p.member_count} members
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {show && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShow(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:17, fontWeight:700 }}>New Project</h2>
              <button onClick={()=>setShow(false)} className="btn-icon btn-ghost"><X size={15}/></button>
            </div>
            {err && <div className="alert-error" style={{ marginBottom:14 }}>{err}</div>}
            <form onSubmit={create} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="field">
                <label className="label">Name *</label>
                <input className="input" placeholder="My Project" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
              </div>
              <div className="field">
                <label className="label">Description</label>
                <textarea className="input" placeholder="What is this project about?" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <div className="field">
                <label className="label">Color</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {COLORS.map(c=>(
                    <button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))}
                      style={{ width:26, height:26, borderRadius:'50%', background:c, border:'none',
                        outline:form.color===c?`3px solid ${c}`:'2px solid transparent', outlineOffset:2, cursor:'pointer' }}/>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Creating…':'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
