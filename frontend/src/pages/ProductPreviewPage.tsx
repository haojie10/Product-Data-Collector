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

  // 包装信息联动逻辑
  useEffect(() => {
    setProduct(prev => {
      const updates: Partial<ProductData> = {};
      let changed = false;

      // 默认值初始化
      if (prev.pack_method === undefined) { updates.pack_method = 'CB'; changed = true; }
      if (prev.pack_qty === undefined) { updates.pack_qty = 1; changed = true; }
      if (prev.outer_box_qty === undefined) { updates.outer_box_qty = 50; changed = true; }

      // 自动计算逻辑
      if (prev.length_cm && prev.width_cm && prev.height_cm) {
        // 计算产品体积（立方分米, dm³）
        // 1 dm³ = 1000 cm³
        const volumeDm3 = (prev.length_cm * prev.width_cm * prev.height_cm) / 1000;
        
        // 1. 计算装量
        let qty = 50;
        if (volumeDm3 <= 0.33) {
          qty = 100;
        } else if (volumeDm3 <= 0.66) {
          qty = 50;
        } else if (volumeDm3 <= 1.0) {
          qty = 24;
        } else {
          qty = 12;
        }

        if (prev.outer_box_qty !== qty) {
          updates.outer_box_qty = qty;
          changed = true;
        }

        // 2. 计算外箱尺寸
        let d1 = 0, d2 = 0, d3 = 0;
        if (qty === 100) {
          d1 = prev.height_cm * 4.1;
          d2 = prev.length_cm * 5.1;
          d3 = prev.width_cm * 5.1;
        } else if (qty === 50) {
          d1 = prev.height_cm * 2.1;
          d2 = prev.length_cm * 5.1;
          d3 = prev.width_cm * 5.1;
        } else if (qty === 24) {
          d1 = prev.height_cm * 2.1;
          d2 = prev.length_cm * 3.1;
          d3 = prev.width_cm * 4.1;
        } else if (qty === 12) {
          d1 = prev.height_cm * 2.1;
          d2 = prev.length_cm * 2.1;
          d3 = prev.width_cm * 3.1;
        }

        // 排序，获取最大（长）、中间（宽）、最小（高）
        const sortedDims = [d1, d2, d3].sort((a, b) => b - a); // 降序
        const expectedLen = Number(sortedDims[0].toFixed(1));
        const expectedWidth = Number(sortedDims[1].toFixed(1));
        const expectedHeight = Number(sortedDims[2].toFixed(1));

        if (prev.outer_box_length !== expectedLen) {
          updates.outer_box_length = expectedLen;
          changed = true;
        }
        if (prev.outer_box_width !== expectedWidth) {
          updates.outer_box_width = expectedWidth;
          changed = true;
        }
        if (prev.outer_box_height !== expectedHeight) {
          updates.outer_box_height = expectedHeight;
          changed = true;
        }
      }

      // 3. 计算外箱重量
      const currentQty = updates.outer_box_qty !== undefined ? updates.outer_box_qty : prev.outer_box_qty;
      if (prev.net_weight_g !== undefined && prev.net_weight_g !== null && currentQty) {
        const expectedWeight = Number(((currentQty * prev.net_weight_g * 1.05) / 1000).toFixed(2));
        if (prev.outer_box_weight !== expectedWeight) {
          updates.outer_box_weight = expectedWeight;
          changed = true;
        }
      }

      return changed ? { ...prev, ...updates } : prev;
    });
  }, [product.length_cm, product.width_cm, product.height_cm, product.net_weight_g]);

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
    if (saving) return;
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

      {/* Supplier Name */}
      <div className="card">
        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>供应商名称 (选填)</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="请输入供应商名称" 
          value={product.supplier_name || ''} 
          onChange={e => setProduct({...product, supplier_name: e.target.value})} 
        />
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
          <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-primary-dark)', fontWeight: 'bold', marginBottom: '0.25rem' }}>净重 (克) 🤖</label>
          <input type="number" className="input-field" placeholder="例如：350" value={product.net_weight_g || ''} onChange={e => setProduct({...product, net_weight_g: Number(e.target.value)})} style={{ borderColor: 'var(--color-primary-dark)', borderWidth: '2px' }} />
        </div>
      </div>

      {/* Packaging Info */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>包装信息</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>包装方式</label>
            <input type="text" className="input-field" value={product.pack_method || ''} onChange={e => setProduct({...product, pack_method: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>包装数量</label>
            <input type="number" className="input-field" value={product.pack_qty || ''} onChange={e => setProduct({...product, pack_qty: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>外箱装量</label>
            <input type="number" className="input-field" value={product.outer_box_qty || ''} onChange={e => setProduct({...product, outer_box_qty: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>外箱重量 (kg)</label>
            <input type="number" className="input-field" value={product.outer_box_weight || ''} onChange={e => setProduct({...product, outer_box_weight: Number(e.target.value)})} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>外箱长 (cm)</label>
            <input type="number" className="input-field" value={product.outer_box_length || ''} onChange={e => setProduct({...product, outer_box_length: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>外箱宽 (cm)</label>
            <input type="number" className="input-field" value={product.outer_box_width || ''} onChange={e => setProduct({...product, outer_box_width: Number(e.target.value)})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>外箱高 (cm)</label>
            <input type="number" className="input-field" value={product.outer_box_height || ''} onChange={e => setProduct({...product, outer_box_height: Number(e.target.value)})} />
          </div>
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
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
          <strong>🇨🇳 中文规格描述：</strong><br />
          {product.spec_description}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          <strong>🇬🇧 英文规格描述：</strong><br />
          {product.spec_description_en}
        </p>
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
