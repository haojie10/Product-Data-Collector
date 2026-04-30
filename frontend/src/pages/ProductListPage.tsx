import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Camera, Loader2 } from 'lucide-react';
import { supabaseMock } from '../lib/supabase';
import type { ProductData } from '../types/product';
import { exportToExcel } from '../services/excelService';

export default function ProductListPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await supabaseMock.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);
    try {
      const selectedProducts = products.filter(p => selectedIds.has(p.id));
      await exportToExcel(selectedProducts);
    } catch (error) {
      alert("导出失败");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-primary)' }}>
        <Loader2 size={32} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <p>暂无产品记录</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <Camera size={20} />
          去采集
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>我的采集</h2>
        <button 
          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', cursor: 'pointer' }}
          onClick={() => {
            if (selectedIds.size === products.length) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(products.map(p => p.id)));
            }
          }}
        >
          {selectedIds.size === products.length ? '取消全选' : '全选'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map(product => (
          <div 
            key={product.id} 
            className="card" 
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              padding: '0.75rem', 
              cursor: 'pointer',
              borderWidth: '2px',
              borderColor: selectedIds.has(product.id) ? 'var(--color-primary)' : 'transparent',
              transition: 'border-color 0.2s ease'
            }}
            onClick={() => toggleSelect(product.id)}
          >
            <img 
              src={product.image_url} 
              alt="Product" 
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: 'var(--color-text-primary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.title_zh || '未命名产品'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                净重: {product.net_weight_g}g | 尺寸: {product.length_cm}x{product.width_cm}x{product.height_cm}cm
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '4px', 
                border: '2px solid',
                borderColor: selectedIds.has(product.id) ? 'var(--color-primary)' : 'var(--color-border)',
                background: selectedIds.has(product.id) ? 'var(--color-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedIds.has(product.id) && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Export Bar */}
      <div className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', display: 'flex', borderTop: '1px solid var(--color-border)', maxWidth: '500px', margin: '0 auto' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleExport} 
          disabled={selectedIds.size === 0 || exporting} 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          {exporting ? <Loader2 className="lucide-spin" size={20} style={{ animation: 'spin 2s linear infinite' }} /> : <Download size={20} />}
          {exporting ? '导出中...' : `导出选中 (${selectedIds.size})`}
        </button>
      </div>
    </div>
  );
}
