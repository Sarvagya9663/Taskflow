import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  const demo = (email, pw) => setForm({ email, password: pw });

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>
      {/* Form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:36 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={18} color="#fff" fill="#fff"/>
            </div>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.03em' }}>TaskFlow</span>
          </div>

          <h1 style={{ fontSize:26, fontWeight:700, marginBottom:6 }}>Welcome back</h1>
          <p style={{ color:'var(--text-muted)', marginBottom:28, fontSize:13 }}>Sign in to your workspace</p>

          {error && <div className="alert-error" style={{ marginBottom:18 }}>{error}</div>}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="field">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required/>
            </div>
            <div className="field">
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <input type={show?'text':'password'} className="input" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required style={{ paddingRight:38 }}/>
                <button type="button" onClick={()=>setShow(v=>!v)}
                  style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', color:'var(--text-dim)', display:'flex' }}>
                  {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ justifyContent:'center', padding:'11px 16px', marginTop:4, fontSize:14 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:22, color:'var(--text-muted)', fontSize:13 }}>
            No account? <Link to="/signup" style={{ color:'var(--accent)', fontWeight:500 }}>Create one</Link>
          </p>

          <div style={{ marginTop:28, padding:'14px 16px', background:'var(--accent-glow)', borderRadius:'var(--r)', border:'1px solid rgba(91,80,245,.2)' }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'.05em' }}>Quick demo</p>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => demo('admin@demo.com','admin123')} style={{ flex:1, justifyContent:'center', fontSize:11 }}>Admin</button>
              <button className="btn btn-ghost btn-sm" onClick={() => demo('member@demo.com','member123')} style={{ flex:1, justifyContent:'center', fontSize:11 }}>Member</button>
            </div>
            <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6, textAlign:'center' }}>Click a role, then Sign in</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width:440, background:'var(--bg-card)', borderLeft:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', padding:48, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, background:'radial-gradient(circle, rgba(91,80,245,.12) 0%, transparent 70%)', borderRadius:'50%' }}/>
        <div style={{ position:'relative' }}>
          <h2 style={{ fontSize:28, fontWeight:800, lineHeight:1.25, marginBottom:28, letterSpacing:'-0.02em' }}>Ship faster,<br/>together.</h2>
          {[
            ['⚡','Real-time task tracking'],
            ['👥','Role-based team access'],
            ['📋','Kanban & priority boards'],
            ['📊','Dashboard & overdue alerts'],
            ['💬','Task comments & history'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ color:'var(--text-muted)', fontSize:14 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
