import type { ProductData } from '../types/product';

const ALIYUN_API_KEY = import.meta.env.VITE_ALIYUN_API_KEY || '';
const ALIYUN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

/**
 * 分析产品图片，调用真实的阿里云通义千问 API 返回尺寸、材质和卖点信息
 * @param imageBase64 产品图片的 Base64 编码
 */
export const analyzeProductImage = async (imageBase64: string): Promise<Partial<ProductData>> => {
  if (!ALIYUN_API_KEY) {
    throw new Error("请在 .env.local 中配置 VITE_ALIYUN_API_KEY");
  }

  const systemPrompt = `
你是一个专业的产品信息采集AI。用户将给你一张产品图片，你需要分析这张图片并提取出产品信息。

【重要尺寸估算说明】
请你务必根据画面中产品在纯视觉上的结构特点、常见同类产品的尺寸常识，精确估算出产品的长、宽、高。

请必须使用 JSON 格式返回分析结果，格式如下：
{
  "title_zh": "中文简短产品名称",
  "title_en": "英文简短产品名称",
  "length_cm": 估算的长度(数字),
  "width_cm": 估算的宽度(数字),
  "height_cm": 估算的高度(数字),
  "net_weight_g": 估算的净重(数字，单位克),
  "material": "产品的主要材质(如：塑料/ABS/金属等)",
  "selling_points_zh": ["卖点名称：中文卖点说明1", "卖点名称：中文卖点说明2", "卖点名称：中文卖点说明3"],
  "selling_points_en": ["Feature Name: English feature description 1", "Feature Name: English feature description 2", "Feature Name: English feature description 3"],
  "spec_description": "尺寸：长*宽*高cm\n净重：克重g\n材料：材料中文名称",
  "spec_description_en": "Dimensions: L*W*H cm\nNet Weight: weight g\nMaterial: Material English Name"
}
注意：
1. 长度、宽度、高度单位为厘米（cm），请务必进行纯视觉尺寸估算。如果不确定，请给出最合理的常识估值。
2. 净重单位为克(g)，请根据产品材质和尺寸进行合理估算。
3. selling_points_zh 和 selling_points_en 必须包含 3 个数组元素，简明扼要，突出商业卖点。每个卖点必须严格遵循“卖点名称：卖点说明”的格式。
4. spec_description 和 spec_description_en 必须严格遵循示例格式，包含换行符（\\n）。中文描述不要出现英文，英文描述不要出现中文。
4. 返回的结果必须是纯 JSON，不需要Markdown代码块标记。
`;

  const payload = {
    model: 'qwen-vl-max',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请分析这张产品图片并按要求返回JSON数据。'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' }
  };

  try {
    const response = await fetch(ALIYUN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ALIYUN_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Aliyun API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Sometimes the model might wrap response in markdown blocks even if asked not to
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    }

    const parsedData = JSON.parse(content);
    return parsedData as Partial<ProductData>;
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw error;
  }
};
