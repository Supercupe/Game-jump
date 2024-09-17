import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const db = new pg.Client({
  user: '',
  host: 'localhost',
  database: 'database_name', 
  password: '',
  port: 5432,
});

const createTableIfNotExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100),
      high_score INTEGER DEFAULT 0
    );
  `;

  try {
    await db.query(createTableQuery);
    console.log('Table "users" is ready.');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

db.connect()
  .then(() => {
    console.log('Connected to the database');
    return createTableIfNotExists();
  })
  .catch(err => {
    console.error('Connection error:', err.stack);
  });

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('home.ejs');
});

  app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.get('/guest', (req, res) => {
  res.render('menu.ejs');
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/register', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (checkResult.rows.length > 0) {
      res.send('Email already exists. Try logging in.');
    } else {
      await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
      res.render('menu.ejs');
    }
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).send('An error occurred');
  }
});

app.post('/login', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (password === storedPassword) {
        res.render('menu.ejs');
      } else {
        res.send('Incorrect Password');
      }
    } else {
      res.send('User not found');
    }
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});