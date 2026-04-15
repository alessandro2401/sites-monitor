import { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
}

const AUTHORIZED_USERS = [
  { email: 'alessandro@pizzolatto.com.br', password: 'Mmb@2026br$', name: 'Alessandro Pizzolatto' },
  { email: 'junio.tosta@alphanacional.com.br', password: 'Mmb@2026br$', name: 'Junio Tosta' },
  { email: 'adriele.roque@grupommb.com', password: 'Mmb@2026br$', name: 'Adriele Roque' },
];

const STORAGE_KEY = 'mutual_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function loadSession(): User | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const session = JSON.parse(data);
    if (!session?.user?.email) return null;
    const isAuthorized = AUTHORIZED_USERS.some(
      u => u.email.toLowerCase() === session.user.email.toLowerCase()
    );
    return isAuthorized ? session.user : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession());

  const login = (email: string, password: string) => {
    const found = AUTHORIZED_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      const userData: User = { email: found.email, name: found.name };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, timestamp: new Date().toISOString() }));
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: 'E-mail ou senha incorretos.' };
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
