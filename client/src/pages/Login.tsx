import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = login(email.trim(), password);
    if (!result.success) {
      setError(result.message || 'E-mail ou senha incorretos.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px',
            background: '#1a237e', borderRadius: '12px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a237e', letterSpacing: '0.05em', margin: 0 }}>
            MUTUAL
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
            Administradora Mutual
          </p>
        </div>

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#f0f4ff', border: '1px solid #c5cae9',
          borderRadius: '8px', padding: '0.75rem 1rem',
          marginBottom: '1.5rem', fontSize: '0.875rem',
          color: '#3949ab', fontWeight: 500,
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Acesso restrito a usuários autorizados
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#333', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              E-mail
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg style={{ position: 'absolute', left: '0.875rem', color: '#999' }} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                required
                style={{
                  width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.75rem',
                  border: '2px solid #e0e0e0', borderRadius: '8px',
                  fontSize: '0.9rem', color: '#333', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#333', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Senha
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg style={{ position: 'absolute', left: '0.875rem', color: '#999' }} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                  border: '2px solid #e0e0e0', borderRadius: '8px',
                  fontSize: '0.9rem', color: '#333', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.875rem',
              background: loading ? '#9fa8da' : '#1a237e',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Verificando...' : 'Entrar no Portal'}
          </button>

          {error && (
            <div style={{
              background: '#ffebee', border: '1px solid #ef9a9a',
              borderRadius: '8px', padding: '0.75rem 1rem',
              color: '#c62828', fontSize: '0.85rem',
              marginTop: '1rem', textAlign: 'center',
            }}>
              {error}
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999', marginTop: '1.5rem' }}>
          Administradora Mutual &mdash; Acesso exclusivo para usuários autorizados.
        </p>
      </div>
    </div>
  );
}
