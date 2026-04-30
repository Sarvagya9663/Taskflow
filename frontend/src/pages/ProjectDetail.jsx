import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';
import { Plus, ChevronLeft, X, UserPlus, Trash2 } from 'lucide-react';

const COLS = [
  { key:'todo',        label:'To Do' },
  { key:'in_progress', label:'In Progress' },
  { key:'review',      label:'Review' },
  { key:'done',        label:'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [allUsers, setAll]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTask, setShowTask]   = useState(false);
  const [showMembers, setShowMem] = useState(false);
  const [initStatus, setInitStatus] = useState('todo');
  const [taskForm, setTF] = useState({ title:'', description:'', priority:'medium', status:'todo', assigneeId:'', dueDate:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const canManage = project?.my_role === 'admin' || user?.role === 'admin';

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/tasks`),
      api.get('/auth/users'),
    ]).then(([p,t,u]) => { setProject(p.data); setTasks(t.data); setAll(u.data); })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const openTask = (status='todo') => { setInitStatus(status); setTF({ title:'', description:'', priority:'medium', status, assigneeId:'', dueDate:'' }); setShowTask(true); };

  const createTask = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const r = await api.post(`/projects/${id}/tasks`, {
        ...taskForm, assigneeId: taskForm.assigneeId ? parseInt(taskForm.assigneeId) : undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setTasks(t=>[r.data,...t]);
      setShowTask(false);
    } catch(e) { setErr(e.response?.data?.errors?.[0]?.msg || e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const moveTask = async (taskId, status) => {
    try {
      const r = await api.put(`/tasks/${taskId}`, { status });
      setTasks(t=>t.map(tk=>tk.id===taskId?r.data:tk));
    } catch {}
  };

  const deleteTask = async taskId => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(t=>t.filter(tk=>tk.id!==taskId));
  };

  const addMember = async (userId, role) => {
    try {
      await api.post(`/projects/${id}/members`, { userId:parseInt(userId), role });
      const r = await api.get(`/projects/${id}`);
      setProject(r.data);
    } catch(e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const removeMember = async userId => {
    if (!confirm('Remove member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    const r = await api.get(`/projects/${id}`);
    setProject(r.data);
  };

  if (loading) return <div className="center"><div className="spinner"/></div>;

  const byStatus = COLS.reduce((a,c) => { a[c.key]=tasks.filter(t=>t.status===c.key); return a; }, {});
  const nonMembers = allUsers.filter(u => !project.members?.find(m=>m.id===u.id));

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--border)', background:'var(--bg-card)', flexShrink:0 }}>
        <Link to="/projects" style={{ fontSize:12, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:3, marginBottom:8 }}>
          <ChevronLeft size={13}/> Projects
        </Link>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:project.color+'20', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:12, height:12, borderRadius:3, background:project.color }}/>
            </div>
            <div>
              <h1 style={{ fontSize:18, fontWeight:700 }}>{project.name}</h1>
              {project.description && <p style={{ fontSize:12, color:'var(--text-muted)' }}>{project.description}</p>}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', marginRight:4 }}>
              {project.members?.slice(0,5).map((m,i)=>(
                <img key={m.id} src={m.avatar} alt={m.name} title={`${m.name} (${m.role})`}
                  style={{ width:26, height:26, borderRadius:'50%', border:'2px solid var(--bg-card)', marginLeft:i>0?-8:0 }}/>
              ))}
            </div>
            {canManage && <button className="btn btn-ghost btn-sm" onClick={()=>setShowMem(true)}><UserPlus size={12}/> Members</button>}
            <button className="btn btn-primary btn-sm" onClick={()=>openTask()}><Plus size={12}/> Add Task</button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div style={{ flex:1, overflow:'auto', padding:'18px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(250px,1fr))', gap:14, minWidth:900 }}>
          {COLS.map(col=>(
            <div key={col.key} style={{ display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span className={`badge badge-${col.key}`}>{col.label}</span>
                  <span style={{ fontSize:11, color:'var(--text-dim)' }}>{byStatus[col.key].length}</span>
                </div>
                <button className="btn-icon btn-ghost" style={{ padding:3 }} onClick={()=>openTask(col.key)}>
                  <Plus size={12} color="var(--text-dim)"/>
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, minHeight:80 }}>
                {byStatus[col.key].map(task=>(
                  <TaskCard key={task.id} task={task} onMove={moveTask} onDelete={deleteTask} canManage={canManage}/>
                ))}
                {byStatus[col.key].length===0 && (
                  <div onClick={()=>openTask(col.key)}
                    style={{ border:'1px dashed var(--border)', borderRadius:'var(--r)', padding:16, textAlign:'center', color:'var(--text-dim)', fontSize:12, cursor:'pointer', transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    + Add task
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {showTask && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowTask(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ fontSize:16, fontWeight:700 }}>New Task</h2>
              <button onClick={()=>setShowTask(false)} className="btn-icon btn-ghost"><X size={14}/></button>
            </div>
            {err && <div className="alert-error" style={{ marginBottom:14 }}>{err}</div>}
            <form onSubmit={createTask} style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div className="field">
                <label className="label">Title *</label>
                <input className="input" placeholder="Task title…" value={taskForm.title} onChange={e=>setTF(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div className="field">
                <label className="label">Description</label>
                <textarea className="input" placeholder="Optional details…" value={taskForm.description} onChange={e=>setTF(f=>({...f,description:e.target.value}))}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="field">
                  <label className="label">Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e=>setTF(f=>({...f,priority:e.target.value}))}>
                    {['low','medium','high','urgent'].map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Status</label>
                  <select className="input" value={taskForm.status} onChange={e=>setTF(f=>({...f,status:e.target.value}))}>
                    {COLS.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Assignee</label>
                  <select className="input" value={taskForm.assigneeId} onChange={e=>setTF(f=>({...f,assigneeId:e.target.value}))}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={taskForm.dueDate} onChange={e=>setTF(f=>({...f,dueDate:e.target.value}))}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Creating…':'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowMem(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ fontSize:16, fontWeight:700 }}>Team Members</h2>
              <button onClick={()=>setShowMem(false)} className="btn-icon btn-ghost"><X size={14}/></button>
            </div>
            <p style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Current Members</p>
            {project.members?.map(m=>(
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <img src={m.avatar} alt={m.name} style={{ width:30, height:30, borderRadius:'50%' }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:500 }}>{m.name}</p>
                  <p style={{ fontSize:11, color:'var(--text-dim)' }}>{m.email}</p>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {canManage && m.id!==project.owner_id && (
                  <button className="btn-icon btn-ghost" onClick={()=>removeMember(m.id)} style={{ color:'var(--red)' }}><Trash2 size={12}/></button>
                )}
              </div>
            ))}
            {canManage && nonMembers.length>0 && (
              <>
                <p style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em', marginTop:16, marginBottom:10 }}>Add Members</p>
                {nonMembers.map(u=>(
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0' }}>
                    <img src={u.avatar} alt={u.name} style={{ width:28, height:28, borderRadius:'50%' }}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13 }}>{u.name}</p>
                      <p style={{ fontSize:11, color:'var(--text-dim)' }}>{u.email}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>addMember(u.id,'member')}>+ Add</button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onMove, onDelete, canManage }) {
  const over = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status!=='done';
  return (
    <div className="card" style={{ padding:'12px 13px', transition:'border-color .15s', cursor:'default' }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:8 }}>
        <Link to={`/tasks/${task.id}`} style={{ fontSize:13, fontWeight:500, lineHeight:1.4, flex:1 }} onClick={e=>e.stopPropagation()}>
          {task.title}
        </Link>
        <span className={`badge badge-${task.priority}`} style={{ flexShrink:0, alignSelf:'flex-start' }}>{task.priority}</span>
      </div>
      {task.description && (
        <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:9, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{task.description}</p>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          {task.assignee_name && (
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <img src={task.assignee_avatar} alt={task.assignee_name} style={{ width:18, height:18, borderRadius:'50%' }}/>
              <span style={{ fontSize:11, color:'var(--text-dim)' }}>{task.assignee_name.split(' ')[0]}</span>
            </div>
          )}
          {task.due_date && <span style={{ fontSize:11, color:over?'var(--red)':'var(--text-dim)' }}>{format(parseISO(task.due_date),'MMM d')}</span>}
        </div>
        <select value={task.status} onChange={e=>{ e.stopPropagation(); onMove(task.id,e.target.value); }}
          onClick={e=>e.stopPropagation()}
          style={{ background:'transparent', border:'none', color:'var(--text-dim)', fontSize:11, cursor:'pointer' }}>
          {[{k:'todo',l:'Todo'},{k:'in_progress',l:'In Progress'},{k:'review',l:'Review'},{k:'done',l:'Done'}].map(s=>(
            <option key={s.k} value={s.k}>{s.l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
