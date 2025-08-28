// api/server.js
const express = require('express');
const cors = require('cors');
// MUDANÇA IMPORTANTE AQUI: Importando o novo pacote
const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chrome-aws-lambda');

// ==================================================================
// Suas credenciais (sem alteração)
const CREDENCIAIS = {
    instagram: {
        usuario: 'S1xtoo_lk',
        senha: 'Ru20121209@'
    }
};
// ==================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Função para iniciar o navegador (sem alteração na lógica)
async function getBrowser() {
    // Para o puppeteer-core v17, é recomendado usar a sintaxe de 'await'
    // para ambos executablePath e args.
    return puppeteer.launch({
        args: await chrome.args,
        executablePath: await chrome.executablePath,
        headless: await chrome.headless,
    });
}

// Rota de Pesquisa (sem alteração na lógica)
app.get('/api/pesquisar', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'O parâmetro "query" é obrigatório.' });

    let browser = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        await page.waitForSelector('div.g', { timeout: 10000 });
        const resultados = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('div.g')).map(item => ({
                titulo: item.querySelector('h3')?.innerText,
                link: item.querySelector('a')?.href,
                snippet: item.querySelector('div[data-sncf="2"]')?.innerText
            })).filter(item => item.titulo && item.link).slice(0, 5);
        });
        res.json({ query, resultados });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao realizar a pesquisa.', details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Rota de Login (sem alteração na lógica)
app.post('/api/login', async (req, res) => {
    const { site } = req.body;
    if (!site || !CREDENCIAIS[site]) {
        return res.status(400).json({ success: false, message: `Site '${site}' não suportado.` });
    }
    const { usuario, senha } = CREDENCIAIS[site];
    let browser = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        
        if (site === 'instagram') {
            await page.goto('https://www.instagram.com/accounts/login/');
            await page.waitForSelector('input[name="username"]', { timeout: 10000 });
            await page.type('input[name="username"]', usuario, { delay: 50 });
            await page.type('input[name="password"]', senha, { delay: 50 });
            await page.click('button[type="submit"]');
            await new Promise(r => setTimeout(r, 3000));
        }

        res.json({ success: true, message: `Processo de login no ${site} executado.` });
    } catch (error) {
        res.status(500).json({ success: false, message: `Falha ao fazer login no ${site}.`, details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

module.exports = app;
            
