import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Today from './pages/Today';
import Horizons from './pages/Horizons';
import Backlog from './pages/Backlog';
import Stats from './pages/Stats';
import Setup from './pages/Setup';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  // If not logged in, show the Login page
  if (!session) return <Login />;

  // If logged in, show the App with Tabs
  return (
    <BrowserRouter>
      <div className="pb-16 min-h-screen bg-gray-50"> {/* Padding at bottom so nav doesn't hide content */}
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/horizons" element={<Horizons />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;