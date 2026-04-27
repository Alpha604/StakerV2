import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Go to dev server
  await page.goto('http://localhost:3000');
  
  // Wait for load
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const loginUser = () => {
      localStorage.setItem('stake_user_session', JSON.stringify({username: 'test', balance: 100}));
      window.location.reload();
    };
    loginUser();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Go to Wheel
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Wheel'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click 'Tourner'
  await page.evaluate(() => {
    const spinBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Tourner'));
    if (spinBtn) spinBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 4500));

  const text = await page.evaluate(() => {
    return document.body.innerText;
  });
  if (text.includes('App crashed')) {
     console.log('CRASH DETECTED:', text);
  } else {
     console.log('NO CRASH DETECTED');
  }
  
  await browser.close();
})();
