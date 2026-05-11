import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if the httpOnly cookie is still valid by calling whoami
  useEffect(() => {
    api
      .whoami()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await api.signin(credentials);
    setUser(data.user);
    return data;
  };

  const signup = async (userData) => {
    const data = await api.signup(userData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.signout(); } catch { /* ignore */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
