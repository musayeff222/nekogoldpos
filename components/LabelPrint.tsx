import React from 'react';
import { Product, AppSettings } from '../types';

interface LabelPrintProps {
  product: Product | null;
  settings: AppSettings;
}

export const LabelPrint: React.FC<LabelPrintProps> = ({ product, settings }) => {
  if (!product) return null;
  
  const { labelConfig } = settings;
  
  return (
    <div 
      className="relative bg-white overflow-hidden label-print-item"
      style={{ 
        width: `${labelConfig.width}mm`, 
        height: `${labelConfig.height}mm`,
        fontWeight: settings.labelFontWeight
      }}
    >
      {labelConfig.elements.map(el => {
        if (!el.visible) return null;
        
        let content = '';
        switch(el.field) {
          case 'shopName': content = settings.shopName; break;
          case 'code': content = product.code; break;
          case 'weight': content = product.weight.toString(); break;
          case 'price': content = (Number(product.price) || 0).toLocaleString(); break;
          case 'carat': content = product.carat.toString(); break;
          case 'supplier': content = product.supplier; break;
          case 'brilliant': content = product.brilliant || ''; break;
          case 'currency': content = 'AZN'; break;
        }
        
        if (!content && el.field !== 'currency' && el.field !== 'shopName') return null;

        return (
          <div
            key={el.id}
            className="absolute whitespace-nowrap"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: `${el.fontSize}px`,
              fontWeight: el.bold ? '900' : 'normal',
              fontFamily: 'Arial, sans-serif',
              lineHeight: 1,
              color: '#000000',
              WebkitFontSmoothing: 'none',
              textRendering: 'geometricPrecision'
            }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};
