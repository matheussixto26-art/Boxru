// api/server.js
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');

// ==================================================================
// !!! PERIGO: DADOS SENSÍVEIS DIRETAMENTE NO CÓDIGO !!!
// !!! NUNCA ENVIE ISSO PARA UM REPOSITÓRIO PÚBLICO NO GITHUB !!!
const CREDENCIAIS = {
    instagram: {
        usuario: 'S1xtoo_lk', // !!! TROQUE AQUI
        senha: 'Ru20121209@'      // !!! TROQUE AQUI
    }
    // Adicione outras credenciais se precisar
};
// ==================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Função auxiliar para iniciar o navegador no ambiente da Vercel
async function getBrowser() {
    return puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });
}

// Rota de Pesquisa
app.get('/api/pesquisar', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'O parâmetro "query" é obrigatório.' });

    console.log(`Iniciando pesquisa para: ${query}`);
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
            })).filter(item => item.titulo && item.link).slice(0, 5); // Pega só os 5 primeiros
        });
        res.json({ query, resultados });
    } catch (error) {
        console.error('Erro na pesquisa:', error);
        res.status(500).json({ error: 'Falha ao realizar a pesquisa.', details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { site } = req.body;
    if (!site || !CREDENCIAIS[site]) {
        return res.status(400).json({ success: false, message: `Site '${site}' não suportado.` });
    }
    const { usuario, senha } = CREDENCIAIS[site];
    console.log(`Iniciando login no site: ${site}`);
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
            await new Promise(r => setTimeout(r, 3000)); // Espera para ver o resultado
        }

        res.json({ success: true, message: `Processo de login no ${site} executado.` });
    } catch (error) {
        console.error(`Erro no login do ${site}:`, error);
        res.status(500).json({ success: false, message: `Falha ao fazer login no ${site}.`, details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// A Vercel gerencia o servidor, então não precisamos de app.listen()
// Em vez disso, exportamos o app para a Vercel usar.
module.exports = app;
                  
