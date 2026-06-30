const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ডেলে ফাংশন—রেট লিমিট এভয়েড
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/like-bulk', async (req, res) => {
    const { videos, cookies } = req.body; // videos = ["url1", "url2", ...]

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({ error: 'videos array পাঠাতে হবে' });
    }
    if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({ error: 'cookies array পাঠাতে হবে' });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // রেন্ডারের জন্য আবশ্যক
    });

    const page = await browser.newPage();
    await page.setCookie(...cookies);

    const results = [];

    for (let i = 0; i < videos.length; i++) {
        const url = videos[i];
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // লাইক বাটন খোঁজা—ফলব্যাক সিলেক্টর
            const likeSelector = '[data-e2e="like-icon"], button[class*="like"], svg[data-icon="heart"]';
            await page.waitForSelector(likeSelector, { timeout: 10000 });
            await page.click(likeSelector);
            
            results.push({ url, status: 'liked' });
            console.log(`✅ লাইক দিলাম: ${url}`);

            // প্রতি লাইকের মাঝে ৫-১০ সেকেন্ড গ্যাপ
            if (i < videos.length - 1) {
                const waitTime = 5000 + Math.random() * 5000;
                await delay(waitTime);
            }
        } catch (error) {
            results.push({ url, status: 'failed', error: error.message });
            console.log(`❌ ব্যর্থ: ${url} — ${error.message}`);
        }
    }

    await browser.close();
    res.json({ success: true, total: videos.length, results });
});

app.listen(PORT, () => console.log(`🔥 সার্ভার চলছে পোর্ট ${PORT}-এ`));