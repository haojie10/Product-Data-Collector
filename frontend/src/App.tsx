import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, List } from 'lucide-react';
import CapturePage from './pages/CapturePage';
import PreviewPage from './pages/PreviewPage';
import ProductListPage from './pages/ProductListPage';

function Header() {
  const navigate = useNavigate();
  return (
    <header className="glass-panel" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--color-border)',
      borderTop: 'none', borderLeft: 'none', borderRight: 'none'
    }}>
      <div style={{ flex: 1 }}>
        {window.location.pathname !== '/' && (
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={24} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 2, justifyContent: 'center' }}>
        <Camera color="var(--color-primary)" size={24} />
        <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-primary)' }}>产品采集器</h1>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {window.location.pathname !== '/list' && (
          <button onClick={() => navigate('/list')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}>
            <List size={24} />
          </button>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <>
      <Header />
      <main style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<CapturePage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/list" element={<ProductListPage />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
