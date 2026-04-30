import ExcelJS from 'exceljs';
import type { ProductData } from '../types/product';

export const exportToExcel = async (products: ProductData[]) => {
  try {
    // 1. Fetch the template
    const response = await fetch('/template.xlsx');
    const arrayBuffer = await response.arrayBuffer();

    // 2. Load the workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    // 3. Fill data starting from row 3
    let currentRow = 3;
    const templateRow = worksheet.getRow(3);

    for (const product of products) {
      const row = worksheet.getRow(currentRow);
      
      // Copy styles from the template row to the current row if it's beyond the template row
      if (currentRow > 3) {
        row.height = templateRow.height || 80;
        templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          row.getCell(colNumber).style = cell.style;
        });
      } else {
        row.height = 80;
      }
      
      row.getCell('O').value = product.title_zh || '';
      row.getCell('P').value = product.title_en || '';
      
      row.getCell('Q').value = product.selling_points_zh[0] || '';
      row.getCell('R').value = product.selling_points_en[0] || '';
      row.getCell('S').value = product.selling_points_zh[1] || '';
      row.getCell('T').value = product.selling_points_en[1] || '';
      row.getCell('U').value = product.selling_points_zh[2] || '';
      row.getCell('V').value = product.selling_points_en[2] || '';
      
      row.getCell('AN').value = product.spec_description || '';
      row.getCell('AO').value = product.title_en ? `${product.title_en}. Material: ${product.material}. Size: ${product.length_cm}x${product.width_cm}x${product.height_cm}cm` : '';
      
      // We will append net weight and material to the spec description
      const extraDesc = `\n净重：${product.net_weight_g || 0}g\n材质：${product.material}`;
      row.getCell('AN').value = (row.getCell('AN').value?.toString() || '') + extraDesc;

      // Handle Image
      if (product.image_url) {
        try {
          let extension: 'jpeg' | 'png' = 'png';
          let imageBuffer: ArrayBuffer | string = '';
          
          if (product.image_url.startsWith('data:image')) {
            const matches = product.image_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              extension = matches[1] === 'jpeg' || matches[1] === 'jpg' ? 'jpeg' : 'png';
              imageBuffer = matches[2]; // base64 string
            }
          } else if (product.image_url.startsWith('http')) {
            extension = product.image_url.toLowerCase().includes('.jpg') || product.image_url.toLowerCase().includes('.jpeg') ? 'jpeg' : 'png';
            const response = await fetch(product.image_url);
            imageBuffer = await response.arrayBuffer();
          }

          if (imageBuffer) {
            const imageId = workbook.addImage({
              [typeof imageBuffer === 'string' ? 'base64' : 'buffer']: imageBuffer,
              extension: extension,
            } as any);

            // Column E is index 4 (0-based)
            worksheet.addImage(imageId, {
              tl: { col: 4, row: currentRow - 1 },
              ext: { width: 100, height: 100 }
            });
            
            // Column AL is index 37 (0-based)
            worksheet.addImage(imageId, {
              tl: { col: 37, row: currentRow - 1 },
              ext: { width: 100, height: 100 }
            });
          }
        } catch (err) {
          console.error("Failed to embed image", err);
        }
      }

      row.commit();
      currentRow++;
    }

    // 4. Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `产品信息导出_${new Date().getTime()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};
