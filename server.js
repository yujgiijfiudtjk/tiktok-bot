const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

// CORS সব অনুমতি
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());

const PORT = process.env.PORT || 3000;

// হেলথ চেক — সার্ভার লাইভ কিনা
app.get('/', (req, res) => {
    res.json({ status: '✅ OMEGA টিকটক বট লাইভ', time: new Date().toISOString() });
});

app.post('/like-bulk', async (req, res) => {
    const { videos, cookies } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({ error: 'videos array লাগবে' });
    }
    if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({ error: 'cookies array লাগবে' });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setCookie(...cookies);

    const results = [];

    for (let i = 0; i < videos.length; i++) {
        const url = videos[i];
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            const likeSelector = '[data-e2e="like-icon"], button[class*="like"], svg[data-icon="heart"]';
            await page.waitForSelector(likeSelector, { timeout: 15000 });
            await page.click(likeSelector);
            results.push({ url, status: 'liked' });
            if (i < videos.length - 1) {
                await new Promise(r => setTimeout(r, 6000 + Math.random() * 4000));
            }
        } catch (error) {
            results.push({ url, status: 'failed', error: error.message });
        }
    }

    await browser.close();
    res.json({ success: true, total: videos.length, results });
});

app.listen(PORT, () => console.log(`🔥 OMEGA বট চলছে পোর্ট ${PORT}`));
