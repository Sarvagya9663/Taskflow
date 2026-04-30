import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Trash2, Send, Edit2, X, Check } from 'lucide-react';

export default function TaskDetail() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({});
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(r => {
        setTask(r.data);
        setEf({ title:r.data.title, description:r.data.description||'', status:r.data.status, priority:r.data.priority, assignee_id:r.data.assignee_id||'', due_date:r.data.due_date?r.data.due_date.split('T')[0]:'' });
        return api.get(`/projects/${r.data.project_id}`);
      })
      .then(r => setMembers(r.data.members||[]))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    try {
      const r = await api.put(`/tasks/${id}`, { ...ef, assignee_id: ef.assignee_id||null, due_date: ef.due_date||null });
      setTask(t => ({ ...t, ...r.data }));
      setEditing(false);
    } catch(e) { alert(e.response?.data?.error||'Failed'); }
  };

  const postComment = async e => {
    e.preventDefault(); if (!comment.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/tasks/${id}/comments`, { content: comment });
      setTask(t => ({ ...t, comments: [...(t.comments||[]), r.data] }));
      setComment('');
    } catch {}
    setPosting(false);
  };

  const del = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    navigate(-1);
  };

  if (loading) return <div className="center"><div className="spinner"/></div>;

  const over = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'done';
  const canEdit = user.role==='admin' || task.reporter_id===user.id || task.assignee_id===user.id;

  return (
    <div className="page">
      <button onClick={() => navigate(-1)} style={{ background:'none', color:'var(--text-dim)', display:'flex', alignItems:'center', gap:3, fontSize:12, marginBottom:18 }}>
        <ChevronLeft size={13}/> Back
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, maxWidth:960 }}>
        {/* Main */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card" style={{ padding:22 }}>
            {editing ? (
              <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <input className="input" value={ef.title} onChange={e=>setEf(f=>({...f,title:e.target.value}))} style={{ fontSize:17, fontWeight:700 }}/>
                <textarea className="input" value={ef.description} onChange={e=>setEf(f=>({...f,description:e.target.value}))} rows={4} placeholder="Description…"/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div className="field"><label className="label">Status</label>
                    <select className="input" value={ef.status} onChange={e=>setEf(f=>({...f,status:e.target.value}))}>
                      <option value="todo">To Do</option><option value="in_progress">In Progress</option>
                      <option value="review">Review</option><option value="done">Done</option>
                    </select>
                  </div>
                  <div className="field"><label className="label">Priority</label>
                    <select className="input" value={ef.priority} onChange={e=>setEf(f=>({...f,priority:e.target.value}))}>
                      {['low','medium','high','urgent'].map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="label">Assignee</label>
                    <select className="input" value={ef.assignee_id} onChange={e=>setEf(f=>({...f,assignee_id:e.target.value}))}>
                      <option value="">Unassigned</option>
                      {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="label">Due Date</label>
                    <input type="date" className="input" value={ef.due_date} onChange={e=>setEf(f=>({...f,due_date:e.target.value}))}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" onClick={save}><Check size={12}/> Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(false)}><X size={12}/> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {over && <span style={{ fontSize:11, color:'var(--red)', fontWeight:700 }}>OVERDUE</span>}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {canEdit && <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(true)}><Edit2 size={11}/> Edit</button>}
                    {(user.role==='admin'||task.reporter_id===user.id) && <button className="btn btn-danger btn-sm" onClick={del}><Trash2 size={11}/> Delete</button>}
                  </div>
                </div>
                <h1 style={{ fontSize:20, fontWeight:700, marginBottom:12, lineHeight:1.3 }}>{task.title}</h1>
                {task.description
                  ? <p style={{ color:'var(--text-muted)', lineHeight:1.7, fontSize:14 }}>{task.description}</p>
                  : <p style={{ color:'var(--text-dim)', fontStyle:'italic', fontSize:13 }}>No description</p>}
              </>
            )}
          </div>

          {/* Comments */}
          <div className="card" style={{ padding:18 }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Comments ({task.comments?.length||0})</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
              {(task.comments||[]).map(c=>(
                <div key={c.id} style={{ display:'flex', gap:10 }}>
                  <img src={c.user_avatar} alt={c.user_name} style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:600 }}>{c.user_name}</span>
                      <span style={{ fontSize:11, color:'var(--text-dim)' }}>{format(parseISO(c.created_at),'MMM d, h:mm a')}</span>
                    </div>
                    <p style={{ fontSize:13, color:'var(--text-muted)', background:'var(--bg-hover)', padding:'9px 12px', borderRadius:'var(--r)', lineHeight:1.5 }}>{c.content}</p>
                  </div>
                </div>
              ))}
              {!task.comments?.length && <p style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'12px 0' }}>No comments yet</p>}
            </div>
            <form onSubmit={postComment} style={{ display:'flex', gap:9 }}>
              <img src={user.avatar} alt={user.name} style={{ width:28, height:28, borderRadius:'50%', flexShrink:0 }}/>
              <input className="input" placeholder="Add a comment…" value={comment} onChange={e=>setComment(e.target.value)} style={{ flex:1 }}/>
              <button type="submit" className="btn btn-primary btn-sm" disabled={posting||!comment.trim()}><Send size={12}/></button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="card" style={{ padding:16, alignSelf:'flex-start' }}>
          <p style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>Details</p>
          {[
            { label:'Project', value:<Link to={`/projects/${task.project_id}`} style={{ color:'var(--accent)', fontSize:13 }}>{task.project_name}</Link> },
            { label:'Assignee', value: task.assignee_name
                ? <div style={{ display:'flex', alignItems:'center', gap:6 }}><img src={task.assignee_avatar} style={{ width:18, height:18, borderRadius:'50%' }}/><span style={{ fontSize:13 }}>{task.assignee_name}</span></div>
                : <span style={{ color:'var(--text-dim)', fontSize:13 }}>Unassigned</span> },
            { label:'Reporter', value:<span style={{ fontSize:13 }}>{task.reporter_name}</span> },
            { label:'Due Date', value: task.due_date
                ? <span style={{ fontSize:13, color:over?'var(--red)':'var(--text)' }}>{format(parseISO(task.due_date),'MMM d, yyyy')}</span>
                : <span style={{ color:'var(--text-dim)', fontSize:13 }}>—</span> },
            { label:'Created', value:<span style={{ fontSize:13 }}>{format(parseISO(task.created_at),'MMM d, yyyy')}</span> },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text-dim)' }}>{label}</span>
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
