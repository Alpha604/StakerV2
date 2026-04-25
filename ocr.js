const Tesseract = require('tesseract.js');
const fs = require('fs');

async function run() {
  const cdxUrl = 'http://web.archive.org/cdx/search/cdx?url=mediumrare.imgix.net/*&output=json&matchType=domain&collapse=urlkey';
  const res = await fetch(cdxUrl);
  const data = await res.json();
  const urls = data.map(x=>x[2]).filter(u => u.includes('w=180') && u.includes('h=236'));
  
  const uniqueHashes = [...new Set(urls.map(u => {
    try { return new URL(u).pathname.split('/')[1]; } catch(e) { return null; }
  }).filter(Boolean))].slice(0, 30);
  
  for (const hash of uniqueHashes) {
    const url = `https://mediumrare.imgix.net/${hash}?w=180&h=236&fit=min&auto=format`;
    try {
      const result = await Tesseract.recognize(url, 'eng');
      console.log(hash, '=>', result.data.text.trim().replace(/\n/g, ' '));
    } catch (err) {
      console.log(hash, '=> error');
    }
  }
}
run();
