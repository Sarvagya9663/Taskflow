import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signup(form); navigate('/dashboard'); }
    catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : (err.response?.data?.error || 'Signup failed'));
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:36 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={18} color="#fff" fill="#fff"/>
          </div>
          <span style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.03em' }}>TaskFlow</span>
        </div>

        <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>Create your account</h1>
        <p style={{ color:'var(--text-muted)', marginBottom:26, fontSize:13 }}>Join your team on TaskFlow</p>

        {error && <div className="alert-error" style={{ marginBottom:16 }}>{error}</div>}

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div className="field">
            <label className="label">Full Name</label>
            <input className="input" placeholder="Jane Smith" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="jane@company.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
          </div>
          <div className="field">
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent:'center', padding:'11px', marginTop:4, fontSize:14 }}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, color:'var(--text-muted)', fontSize:13 }}>
          Already have an account? <Link to="/login" style={{ color:'var(--accent)', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
