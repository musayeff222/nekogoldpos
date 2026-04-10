
import React from 'react';
import { Product, AppSettings } from '@/types';

interface LabelPrintProps {
  product: Product;
  settings: AppSettings;
}

export const LabelPrint: React.FC<LabelPrintProps> = ({ product, settings }) => {
  const { labelConfig } = settings;

  if (!labelConfig || !labelConfig.elements) {
    return (
      <div style={{ padding: '20px', color: 'black', background: 'white' }}>
        Ayar tapılmadı
      </div>
    );
  }

  const safeProduct = product || {
    code: '---',
    weight: 0,
    price: 0,
    carat: '',
    supplier: '',
    brilliant: ''
  };

  return (
    <div className="label-print-container" style={{
      width: `${labelConfig.width || 50}mm`,
      height: `${labelConfig.height || 30}mm`,
      position: 'relative',
      backgroundColor: 'white',
      color: 'black',
      overflow: 'hidden',
      fontWeight: settings.labelFontWeight || '600'
    }}>
      {labelConfig.elements.map(el => (
        el.visible && (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: `${el.fontSize}px`,
              fontWeight: el.bold ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              fontFamily: 'Arial, sans-serif',
              color: 'black'
            }}
          >
            {el.field === 'shopName' ? (settings.shopName || 'NEKO GOLD') : 
             el.field === 'code' ? (safeProduct.code || '---') : 
             el.field === 'weight' ? `${Number(safeProduct.weight || 0).toFixed(2)} gr` : 
             el.field === 'price' ? `${Math.round(Number(safeProduct.price) || 0)}` : 
             el.field === 'carat' ? `${safeProduct.carat || ''}` : 
             el.field === 'supplier' ? (safeProduct.supplier || '') : 
             el.field === 'brilliant' ? (safeProduct.brilliant || '') : 
             el.field === 'currency' ? 'AZN' : ''}
          </div>
        )
      ))}
    </div>
  );
};
