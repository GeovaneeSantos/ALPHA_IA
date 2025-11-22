const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const fetchModule = require('node-fetch');

const multer = require('multer');
const FormData = require('form-data');
const path = require('path'); 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fetch = fetchModule.default || fetchModule;
const app = express(); 
const PORT = 3000; 
const DB_FILE = './bancoSite.db'; 
const PYTHON_API_URL = 'http://localhost:5000/api/classificar';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

async function getDatabaseConnection() {
    try {
        const db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });
        
        //Espera o banco de dados estar pronto e cria a tabela USUARIOS se não existir
        await db.run(`CREATE TABLE IF NOT EXISTS USUARIOS (id INTEGER PRIMARY KEY, nome TEXT, ra INTEGER, senha TEXT, email TEXT)`);

        console.log('Banco de dados conectado e tabela USUARIOS verificada.');
        return db;
    } catch (error) {
        console.error('Erro ao conectar ou inicializar o banco de dados:', error);
        throw error;
    }
}

app.post('/registro', async (req, res) => {
    const { nome, ra, senha, email } = req.body;

    // 1. Validação de campos obrigatórios
    if (!nome || !ra || !senha || !email) {
        return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios para o registro.' });
    }

    // Garante que o RA seja tratado como número (já é feito no HTML, mas é bom garantir aqui)
    const raNumber = parseInt(ra, 10);
    if (isNaN(raNumber)) {
        return res.status(400).json({ success: false, error: 'O RA deve ser um número válido.' });
    }

    try {
        const db = await getDatabaseConnection();
        
        //Verifica se o nome de usuário, email ou RA já estão cadastrados
        const existingUser = await db.get(
            `SELECT id FROM USUARIOS WHERE nome = ? OR ra = ? OR email = ?`, 
            [nome, raNumber, email]
        );
        
        if (existingUser) {
            // Retorna Conflito (409) se o usuário já existir
            return res.status(409).json({ success: false, error: 'Nome de usuário, RA ou Email já está em uso.' });
        }

        //Inserir novo usuário no BD
        //usei (?, ?, ?, ?) para prevenir SQL Injection
        const result = await db.run(
            `INSERT INTO USUARIOS (nome, ra, senha, email) VALUES (?, ?, ?, ?)`, 
            [nome, raNumber, senha, email]
        );

        // Retorna status 201 (Created)
        res.status(201).json({ success: true, message: 'Registro realizado com sucesso!', userId: result.lastID });
    } catch (error) {
        console.error('Erro durante o registro:', error);
        res.status(500).json({ success: false, error: 'Falha interna do servidor ao registrar.' });
    }
});

app.post('/login', async (req, res) => {

    // O cliente envia 'nome' (usuário) e 'sobrenome' (senha)
    const { email, senha } = req.body; 

    if (!email || !senha) {
        return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const db = await getDatabaseConnection();

        //Busca o usuário digitado no bd na tabela USUARIOS
        const user = await db.get(
            `SELECT id, nome, ra, email FROM USUARIOS WHERE email = ? AND senha = ?`, 
            [email, senha]
        );

        if (user) {
            // Se o usuario existir user vira true Credenciais corretas
            return res.json({ success: true, message: 'Login bem-sucedido!' });
        } else {

            // Credenciais inválidas (401 Unauthorized)
            return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        }

    } catch (error) {
        console.error('Erro durante a operação de login:', error);
        return res.status(500).json({ success: false, error: 'Falha interna do servidor.' });
    }
});

app.post('/classificar-ia', upload.single('imagem'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Nenhuma imagem foi enviada. (Erro 400)' });
    }
    try {

        const form = new FormData();
        form.append('imagem', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        });

        const pythonResponse = await fetch(PYTHON_API_URL, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(), 
        });
        const pythonData = await pythonResponse.json();
        if (!pythonResponse.ok) {
             return res.status(pythonResponse.status).json({ success: false, error: pythonData.error || `Erro na API Python: ${pythonResponse.status}` });
        }

        res.json({ success: true, ...pythonData });

    } catch (error) {
        console.error('Erro no processamento da imagem:', error);
        return res.status(500).json({ success: false, error: 'Falha interna ao processar a imagem.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log(`Endpoints ativos: /registro (POST), /login (POST), /classificar-ia (POST)`);
});
