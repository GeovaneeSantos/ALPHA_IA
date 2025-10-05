
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';

const app = express(); // Cria a aplicação Express
const PORT = 3000; // Porta onde o servidor irá rodar
const DB_FILE = './bancoSite.db'; // Nome do arquivo do banco de dados SQLite


app.use(cors()); //permite que o html acesse o servidor
app.use(express.json());  // Middleware para interpretar JSON no corpo das requisições

// Função para conectar ao banco de dados SQLite
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
//Endereço da função getDatabaseConnection, será usada nos endpoints
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
// Endpoint de login, metodo POST no /login
app.post('/login', async (req, res) => {

    // O cliente envia 'nome' (usuário) e 'sobrenome' (senha)
    const { nome, senha } = req.body; 

    if (!nome || !senha) {
        return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const db = await getDatabaseConnection();

        //Busca o usuário digitado no bd na tabela USUARIOS
        const user = await db.get(
            `SELECT id, nome, ra, email FROM USUARIOS WHERE nome = ? AND senha = ?`, 
            [nome, senha]
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

//Inicia o servidor Node.js
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log('Endpoints ativos: /login (POST) e /registro (POST)');
});
