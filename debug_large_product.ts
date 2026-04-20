
import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/products/mmj3w2zps70zq');
    const product = await res.json();
    console.log('Product keys:', Object.keys(product));
    Object.keys(product).forEach(k => {
        const val = product[k];
        if (typeof val === 'string') {
            console.log(`  - ${k}: string, length ${val.length}, value: ${val.substring(0, 50)}`);
        } else if (Array.isArray(val)) {
            console.log(`  - ${k}: array, length ${val.length}`);
        } else {
            console.log(`  - ${k}: ${typeof val}`);
        }
    });
  } catch (err) {
    console.error(err);
  }
}

test();
