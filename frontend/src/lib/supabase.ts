import { createClient } from '@supabase/supabase-js';
import type { ProductData } from '../types/product';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseMock = {
  getProducts: async (): Promise<ProductData[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    return data as ProductData[];
  },
  
  saveProduct: async (product: Omit<ProductData, 'id' | 'created_at'>): Promise<ProductData> => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
      
    if (error) {
      console.error('Error saving product:', error);
      throw error;
    }
    return data as ProductData;
  },
  
  uploadImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  deleteProduct: async (id: string, imageUrl: string): Promise<void> => {
    // 1. 从数据库删除
    const { error: dbError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting product from DB:', dbError);
      throw dbError;
    }

    // 2. 如果有图片，从存储桶删除
    if (imageUrl && imageUrl.includes('product-images')) {
      try {
        // 从 URL 提取文件名 (e.g., .../product-images/filename.jpg)
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([fileName]);
          
          if (storageError) {
            console.warn('Failed to delete image from storage:', storageError);
          }
        }
      } catch (e) {
        console.warn('Error parsing image URL for deletion:', e);
      }
    }
  }
};
