// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==================================================================
// !!! PERIGO: DADOS SENSÍVEIS DIRETAMENTE NO CÓDIGO !!!
// !!! FAÇA ISSO APENAS PARA TESTES LOCAIS E NUNCA ENVIE PARA O GITHUB !!!
const CREDENCIAIS = {
    instagram: {
        usuario: '
          S1xtoo_lk', // !!! TROQUE AQUI
        senha: 'Ru201data-sncf    // !!! TROQUE AQUI
    },
    facebook: {
        usuario: 'SEU_EMAIL_FACEBOOK_DE_TESTE', // !!! TROQUE AQUI
        senha: 'SUA_SENHA_FACEBOOK_DE_TESTE'   // !!! TROQUE AQUI
    }
};
// ==================================================================

// Endpoint para PESQUISAR
app.get('/pesquisar', async (req, res) => {
    // ... (código de pesquisa permanece o mesmo de antes) ...
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'O parâmetro "query" é obrigatório.' });

    console.log(`Iniciando pesquisa para: ${query}`);
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        await page.waitForSelector('div.g');
        const resultados = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('div.g')).map(item => ({
                titulo: item.querySelector('h3')?.innerText,
                link: item.querySelector('a')?.href,
                snippet: item.querySelector('div[data-sncf="2"]')?.innerText
            })).filter(item => item.titulo && item.link);
        });
        await browser.close();
        console.log(`Pesquisa concluída. ${resultados.length} resultados encontrados.`);
        res.json({ query, resultados });
    } catch (error) {
        console.error('Erro na pesquisa:', error);
        res.status(500).json({ error: 'Falha ao realizar a pesquisa.', details: error.message });
    }
});

// Endpoint para FAZER LOGIN
app.post('/login', async (req, res) => {
    const { site } = req.body;

    if (!site || !CREDENCIAIS[site]) {
        return res.status(400).json({ success: false, message: `Site '${site}' não é suportado ou não foi encontrado.` });
    }

    const { usuario, senha } = CREDENCIAIS[site];
    console.log(`Iniciando tentativa de login no site: ${site}`);

    let browser;
    try {
        // Inicia o navegador em modo visível para podermos ver o que acontece
        browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        if (site === 'instagram') {
            await page.goto('https://www.instagram.com/accounts/login/');
            await page.waitForSelector('input[name="username"]');
            await page.type('input[name="username"]', usuario, { delay: 50 });
            await page.type('input[name="password"]', senha, { delay: 50 });
            await page.click('button[type="submit"]');
        } else if (site === 'facebook') {
            await page.goto('https://www.facebook.com/');
            await page.waitForSelector('#email');
            await page.type('#email', usuario, { delay: 50 });
            await page.type('#pass', senha, { delay: 50 });
            await page.click('button[name="login"]');
        }

        // Espera um tempo para ver o resultado do login
        // Em um projeto real, você esperaria por um seletor específico da página de login bem-sucedido
        await page.waitForTimeout(5000); 

        console.log(`Login no ${site} finalizado.`);
        // Aqui você pode adicionar uma lógica para verificar se o login deu certo
        // (ex: checar a URL ou a existência de um elemento)

        await browser.close();
        res.json({ success: true, message: `Processo de login no ${site} executado com sucesso!` });
    } catch (error) {
        console.error(`Erro no login do ${site}:`, error);
        if (browser) await browser.close();
        res.status(500).json({ success: false, message: `Falha ao fazer login no ${site}.`, details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de automação rodando na porta ${PORT}`);
});
          
