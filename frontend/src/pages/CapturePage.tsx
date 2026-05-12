import { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function CapturePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const processImageToSquare = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 1024; // 统一输出 1024x1024
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // 计算中心裁剪区域
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          // 绘制到 canvas
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          // 转换为 jpeg 压缩体积，质量设为 0.85
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 开始处理图片（裁剪为 1:1）
    const processedBase64 = await processImageToSquare(file);
    setImagePreview(processedBase64);
    setImageBase64(processedBase64);
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
      
      <div className="card" style={{ 
        width: '100%', 
        aspectRatio: '1/1', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderStyle: imagePreview ? 'solid' : 'dashed', 
        borderWidth: '2px', 
        borderColor: imagePreview ? 'var(--color-border)' : 'var(--color-primary-light)', 
        overflow: 'hidden', 
        padding: 0,
        margin: 0
      }}>
        
        {imagePreview ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              onClick={() => { setImagePreview(null); setImageBase64(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--color-primary-light)', padding: '1.5rem', borderRadius: '50%' }}>
              <Camera size={48} color="var(--color-primary)" />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>拍摄产品照片</h3>
              <p style={{ fontSize: '0.85rem' }}>自动裁剪为 1:1 正方形</p>
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
