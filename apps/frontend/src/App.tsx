import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function SiteSwitch() {
  const location = useLocation()
  const navigate = useNavigate()
  const isBuild = location.pathname.startsWith('/build')

  return (
    <select
      value={isBuild ? 'build' : 'manage'}
      onChange={(e) => navigate(e.target.value === 'build' ? '/build' : '/manage')}
      style={{ padding: 6, marginRight: 12 }}
    >
      <option value="build">Build</option>
      <option value="manage">Manage</option>
    </select>
  )
}

function BuildHome() {
  const test = async () => {
    const res = await fetch(`${API_URL}/api/build/projects/hello`)
    alert(await res.text())
  }
  return (
    <div>
      <h2>Build</h2>
      <button onClick={test}>Ping Build API</button>
    </div>
  )
}

function ManageHome() {
  const test = async () => {
    const res = await fetch(`${API_URL}/api/manage/sites/hello`)
    alert(await res.text())
  }
  return (
    <div>
      <h2>Manage</h2>
      <button onClick={test}>Ping Manage API</button>
    </div>
  )
}

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <SiteSwitch />
        <Link to="/build">Build</Link>
        <Link to="/manage" style={{ marginLeft: 12 }}>Manage</Link>
        <a href={`${API_URL}/api/core/health`} style={{ marginLeft: 'auto' }}>Health</a>
      </header>
      <Routes>
        <Route path="/build" element={<BuildHome />} />
        <Route path="/manage" element={<ManageHome />} />
        <Route path="*" element={<BuildHome />} />
      </Routes>
    </div>
  )
}

