import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const liveRatesPlugin = () => ({
  name: 'live-rates-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/live-rates')) {
        const url = new URL(req.url, 'http://localhost');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        
        if (from && to) {
          if (from === to) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ rate: 1.0, from, to }));
            return;
          }
          const pair = `${from}-${to}`;
          try {
            const fetchRes = await fetch(`https://www.google.com/finance/quote/${pair}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
              }
            });
            const html = await fetchRes.text();
            const regex = /class="[^"]*IHz7Sd[^"]*"[\s\S]*?jsname="Pdsbrc"[^>]*><span>([\d\.,]+)<\/span>/;
            const match = html.match(regex);
            let rate = null;
            if (match) {
              rate = parseFloat(match[1].replace(/,/g, ''));
            } else {
              const fallbackRegex = /jsname="Pdsbrc"[^>]*><span>([\d\.,]+)<\/span>/;
              const fallbackMatch = html.match(fallbackRegex);
              if (fallbackMatch) {
                rate = parseFloat(fallbackMatch[1].replace(/,/g, ''));
              }
            }
            
            if (rate) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ rate, from, to }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Could not extract rate for ${pair}` }));
            }
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        } else {
          const pairs = ['GBP-INR', 'GBP-AED', 'GBP-CAD', 'GBP-EUR', 'GBP-USD'];
          const rates: Record<string, number> = {};
          
          try {
            await Promise.all(
              pairs.map(async (pair) => {
                const toCurrency = pair.split('-')[1];
                try {
                  const fetchRes = await fetch(`https://www.google.com/finance/quote/${pair}`, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
                    }
                  });
                  const html = await fetchRes.text();
                  const regex = /class="[^"]*IHz7Sd[^"]*"[\s\S]*?jsname="Pdsbrc"[^>]*><span>([\d\.,]+)<\/span>/;
                  const match = html.match(regex);
                  if (match) {
                    rates[toCurrency] = parseFloat(match[1].replace(/,/g, ''));
                  } else {
                    const fallbackRegex = /jsname="Pdsbrc"[^>]*><span>([\d\.,]+)<\/span>/;
                    const fallbackMatch = html.match(fallbackRegex);
                    if (fallbackMatch) {
                      rates[toCurrency] = parseFloat(fallbackMatch[1].replace(/,/g, ''));
                    }
                  }
                } catch (e) {
                  console.error(`Error fetching/parsing ${pair}:`, e);
                }
              })
            );
            
            // Verify we have all required rates
            const expectedCurrencies = ['INR', 'AED', 'CAD', 'EUR', 'USD'];
            const missing = expectedCurrencies.filter(curr => !rates[curr]);
            
            if (missing.length > 0) {
              console.warn(`Missing exchange rates: ${missing.join(', ')}. Using defaults.`);
              const defaults: Record<string, number> = { INR: 124.9, AED: 4.67, CAD: 1.74, EUR: 1.18, USD: 1.27 };
              for (const curr of missing) {
                rates[curr] = defaults[curr];
              }
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ rates }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      } else {
        next();
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), liveRatesPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})

