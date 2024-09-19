import express from 'express';
import pg from 'pg';
import path from 'path';
import url from 'url';
import bcrypt from 'bcrypt';
import session from 'express-session';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

const app = express();
const port = 3000;

app.use(session({
  secret: '',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = new pg.Client({
  user: '',
  host: 'localhost',
  database: 'database_name',
  password: '',
  port: 5432,
});

db.connect()
  .then(() => {
    console.log('Connected to the database');
    return db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100),
        high_score INTEGER DEFAULT 0
      );
    `);
  })
  .then(() => console.log('Table "users" is ready.'))
  .catch(err => console.error('Database error:', err.stack));

app.get('/', (req, res) => res.render('home.ejs'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => res.render('login.ejs'));
app.get('/register', (req, res) => res.render('register.ejs'));
app.get('/play', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/menu', async (req, res) => {
  if (!req.session.email) return res.redirect('/login');

  try {
    const result = await db.query('SELECT high_score FROM users WHERE email = $1', [req.session.email]);
    const highScore = result.rows[0]?.high_score || 0;
    res.render('menu', { highScore });
  } catch (err) {
    console.error('Error fetching high score:', err);
    res.status(500).send('An error occurred');
  }
});

app.post('/register', async (req, res) => {
  const { username: email, password } = req.body;

  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length) return res.send('Email already exists. Try logging in.');

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);

    req.session.email = email;
    res.render('menu.ejs', { highScore: 0 });
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).send('An error occurred');
  }
});

app.post('/login', async (req, res) => {
  const { username: email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (!result.rows.length) return res.send('User not found');

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.email = email;
      res.render('menu.ejs', { highScore: user.high_score });
    } else {
      res.send('Incorrect Password');
    }
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).send('An error occurred');
  }
});

app.post('/update-score', async (req, res) => {
  const { highScore } = req.body;
  const email = req.session.email;

  if (!email) return res.status(401).send('User not logged in');

  try {
    const result = await db.query('SELECT high_score FROM users WHERE email = $1', [email]);
    const currentHighScore = result.rows[0]?.high_score || 0;

    if (parseInt(highScore) > currentHighScore) {
      await db.query('UPDATE users SET high_score = $1 WHERE email = $2', [highScore, email]);
      res.send('Score updated successfully');
    } else {
      res.send('Score not high enough to update');
    }
  } catch (err) {
    console.error('Error updating score:', err);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
