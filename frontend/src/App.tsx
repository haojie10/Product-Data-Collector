import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Camera, ArrowLeft, List } from 'lucide-react';
import CapturePage from './pages/CapturePage';
import ProductPreviewPage from './pages/ProductPreviewPage';
import ProductListPage from './pages/ProductListPage';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isList = location.pathname === '/list';

  return (
    <header className="glass-panel" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--color-border)',
      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      minHeight: '64px'
    }}>
      {/* 左侧区域：固定宽度确保居中 */}
      <div style={{ width: '80px', display: 'flex', alignItems: 'center' }}>
        {!isHome && (
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              color: 'var(--color-text-secondary)',
              padding: '4px'
            }}
          >
            <ArrowLeft size={24} />
          </button>
        )}
      </div>

      {/* 中间标题区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', flex: 1 }}>
        <Camera color="var(--color-primary)" size={22} />
        <h1 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          产品信息采集助手
        </h1>
      </div>

      {/* 右侧区域：固定宽度确保居中 */}
      <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
        {!isList && (
          <button 
            onClick={() => navigate('/list')} 
            style={{ 
              background: 'rgba(255, 120, 0, 0.1)', 
              border: '1px solid var(--color-primary)', 
              borderRadius: '20px',
              padding: '0.3rem 0.6rem',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2px',
              color: 'var(--color-primary)',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}
          >
            <List size={16} />
            <span style={{ fontWeight: 600 }}>产品库</span>
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
          <Route path="/preview" element={<ProductPreviewPage />} />
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
