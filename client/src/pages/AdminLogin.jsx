import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.login(password);
      navigate('/admin');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="form-card login-box">
        <h1>Admin Login</h1>
        <p className="muted">Sign in to manage lectures and transcripts.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy || !password} style={{ width: '100%' }}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}