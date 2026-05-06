import { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function CapturePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setImagePreview(url);

    // Convert to Base64 for AI processing
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (imageBase64 && imagePreview) {
      navigate('/preview', { 
        state: { imageBase64, imagePreview } 
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', borderStyle: imagePreview ? 'solid' : 'dashed', borderWidth: '2px', borderColor: imagePreview ? 'var(--color-border)' : 'var(--color-primary-light)', overflow: 'hidden', padding: imagePreview ? 0 : 'var(--spacing-4)' }}>
        
        {imagePreview ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <button 
              onClick={() => { setImagePreview(null); setImageBase64(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--color-primary-light)', padding: '1rem', borderRadius: '50%' }}>
              <Camera size={48} color="var(--color-primary)" />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>拍摄产品照片</h3>
            </div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        style={{ display: 'none' }} 
      />

      {/* 功能介绍模块 */}
      {!imagePreview && (
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            核心功能介绍
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--color-primary)', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>1</span>
              <span>创新型<strong>纯视觉</strong>尺寸测算</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--color-primary)', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>2</span>
              <span>智能<strong>多语种</strong>卖点自动生成</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'var(--color-primary)', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>3</span>
              <span>批量管理一键导出<strong>MDS格式</strong></span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        {!imagePreview ? (
          <>
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}>
              <Camera size={20} />
              开始拍照采集
            </button>
            <button className="btn btn-secondary" onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
                fileInputRef.current.setAttribute('capture', 'environment');
              }
            }} style={{ width: '100%' }}>
              <ImageIcon size={20} />
              从相册选择
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={handleAnalyze} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            <Sparkles size={20} />
            生成产品信息 (AI)
          </button>
        )}
      </div>
    </div>
  );
}
