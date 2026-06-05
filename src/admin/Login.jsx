import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const ADMIN_EMAIL = 'admin@leacosenza.studio';

export function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
    } catch {
      setError('Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-mark">
          <span className="dot" />LC / Admin
        </div>
        <h1 className="login-h">Enter<br />password<em>.</em></h1>
        <form onSubmit={submit}>
          <input
            className="login-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="login-err">{error}</div>}
          <button className="login-btn" type="submit" disabled={loading || !password}>
            {loading ? 'Signing in…' : 'Enter →'}
          </button>
        </form>
      </div>
    </div>
  );
}
