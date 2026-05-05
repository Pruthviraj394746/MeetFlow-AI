import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MeetingRoom from './pages/MeetingRoom'
import Lobby from './pages/Lobby'
import Tasks from './pages/Tasks'
import Meetings from './pages/Meetings'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="*" element={
          <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
            
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={localStorage.getItem('token') ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/lobby/:id" element={<Lobby />} />
                <Route path="/meeting/:id" element={<MeetingRoom />} />
                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                } />
                <Route path="/meetings" element={
                  <ProtectedRoute>
                    <Meetings />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App
