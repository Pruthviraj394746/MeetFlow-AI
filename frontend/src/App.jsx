import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MeetingRoom from './pages/MeetingRoom'
import Lobby from './pages/Lobby'
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
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lobby/:id" element={<Lobby />} />
            <Route path="/meeting/:id" element={<MeetingRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
