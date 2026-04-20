
import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/data/products');
    const data = await res.json();
    const sorted = data.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length).slice(0, 10);
    console.log('Top 10 largest products (via API):');
    sorted.forEach(p => {
        console.log(`- ID: ${p.id}, Length: ${JSON.stringify(p).length}`);
        if (p.logs) console.log(`  - Logs: ${p.logs.length}`);
    });
  } catch (err) {
    console.error(err);
  }
}

test();
