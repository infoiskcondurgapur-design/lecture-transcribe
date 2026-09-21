import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Transcriptions from './pages/Transcriptions';
import Search from './pages/Search';
import TranscriptDetail from './pages/TranscriptDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEdit from './pages/AdminEdit';

function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <NavLink to="/" className="brand">
          <span className="logo">&#128266;</span>
          <h1>
            Lecture Transcription Archive
            <small>Audio &amp; Transcript Library</small>
          </h1>
        </NavLink>
        <nav className="site-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/transcriptions">Transcriptions</NavLink>
          <NavLink to="/search">Search</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transcriptions" element={<Transcriptions />} />
        <Route path="/search" element={<Search />} />
        <Route path="/lecture/:id" element={<TranscriptDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/new" element={<AdminEdit />} />
        <Route path="/admin/edit/:id" element={<AdminEdit />} />
      </Routes>
    </div>
  );
}