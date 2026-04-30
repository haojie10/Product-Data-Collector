// 产品数据类型定义
export interface ProductData {
  id: string;
  image_url: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  net_weight_g: number | null;
  material: string;
  title_zh?: string;
  title_en?: string;
  selling_points_zh: string[];
  selling_points_en: string[];
  spec_description: string;
  created_at: string;
}
