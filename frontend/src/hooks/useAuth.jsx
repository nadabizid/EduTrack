import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(() => JSON.parse(localStorage.getItem('user')||'null'));
  const [loading,setLoading]= useState(true);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => { setUser(r.data); localStorage.setItem('user',JSON.stringify(r.data)); })
      .catch(() => { localStorage.clear(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const fetchNotifs = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications||[]);
      setUnread(data.unread||0);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [user, fetchNotifs]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setNotifs(n => n.map(x=>({...x,is_read:true})));
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null); setNotifs([]); setUnread(0);
  };

  return (
    <Ctx.Provider value={{ user,loading,login,logout,notifs,unread,markAllRead,fetchNotifs }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
