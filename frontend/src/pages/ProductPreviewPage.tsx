import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, RefreshCw, Loader2, CheckCircle2, List } from 'lucide-react';
import { analyzeProductImage } from '../services/aiService';
import { supabaseMock } from '../lib/supabase';
import type { ProductData } from '../types/product';

function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { imageBase64: string, imagePreview: string };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<Partial<ProductData>>({});

  useEffect(() => {
    if (!state?.imageBase64) {
      navigate('/');
      return;
    }

    const runAnalysis = async () => {
      try {
        const result = await analyzeProductImage(state.imageBase64);
        setProduct({ ...result, image_url: state.imageBase64 });
      } catch (error) {
        console.error("Analysis failed:", error);
        alert("AI 分析失败，请重试");
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [state, navigate]);

  // Helper to convert base64 to File
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid dataurl");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSave = async () => {
    if (!product.net_weight_g) {
      alert("请填写产品净重");
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = product.image_url;
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        const ext = finalImageUrl.split(';')[0].split('/')[1] || 'jpg';
        const file = dataURLtoFile(finalImageUrl, `product_${Date.now()}.${ext}`);
        finalImageUrl = await supabaseMock.uploadImage(file);
      }
      
      await supabaseMock.saveProduct({ ...product, image_url: finalImageUrl } as Omit<ProductData, 'id' | 'created_at'>);
      setSuccess(true);
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--color-primary)' }}>
        <Loader2 size={48} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} />
        <h3 style={{ color: 'var(--color-text-primary)' }}>AI 正在识别产品信息...</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>正在计算长宽高并生成多语种卖点</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--color-success)' }}>
        <CheckCircle2 size={64} />
        <h2 style={{ color: 'var(--color-text-primary)' }}>保存成功！</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            继续采集
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/list')}>
            <List size={20} />
            查看列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5rem' }}>
      {/* Image Preview */}
      <div className="card" style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center', background: '#e2e8f0' }}>
        <img src={state.imagePreview} alt="Product" style={{ maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
      </div>

      {/* Dimensions & Weight */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>产品规格</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>长度 (cm) 🤖</label>
            <input type="number" className="input-field" value={product.length_cm || ''} onChange={e => setProduct({...product, length_cm: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>宽度 (cm) 🤖</label>
            <input type="number" className="input-field" value={product.width_cm || ''} onChange={e => setProduct({...product, width_cm: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>高度 (cm) 🤖</label>
            <input type="number" className="input-field" value={product.height_cm || ''} onChange={e => setProduct({...product, height_cm: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>材质 🤖</label>
            <input type="text" className="input-field" value={product.material || ''} onChange={e => setProduct({...product, material: e.target.value})} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-primary-dark)', fontWeight: 'bold', marginBottom: '0.25rem' }}>净重 (克) *手动输入*</label>
          <input type="number" className="input-field" placeholder="例如：350" value={product.net_weight_g || ''} onChange={e => setProduct({...product, net_weight_g: Number(e.target.value)})} style={{ borderColor: 'var(--color-primary-dark)', borderWidth: '2px' }} />
        </div>
      </div>

      {/* Selling Points */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>产品卖点 🤖</h3>
        
        {product.selling_points_zh?.map((pt, i) => (
          <div key={i} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.95rem' }}>🇨🇳 {pt}</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>🇬🇧 {product.selling_points_en?.[i]}</p>
          </div>
        ))}
      </div>

      {/* Spec Description */}
      <div className="card">
        <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>给供应商的描述 🤖</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{product.spec_description}</p>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="glass-panel" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--color-border)', maxWidth: '500px', margin: '0 auto' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>
          <RefreshCw size={20} />
          重拍
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
          {saving ? <Loader2 className="lucide-spin" size={20} style={{ animation: 'spin 2s linear infinite' }} /> : <Save size={20} />}
          {saving ? '保存中...' : '保存到数据库'}
        </button>
      </div>
    </div>
  );
}

export default PreviewPage;
