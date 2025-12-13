// services/auth/index.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
//const cors = require('cors');
const app = express();
app.use(express.json({ limit: '1mb' }));
//app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cors({ origin: '*' }));
app.use(helmet());

// Rate limit por seguridad
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Conexión Mongo
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Auth Mongo OK'));

// Esquema Usuario
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Helpers JWT
const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Validadores
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  name: z.string().min(1, 'Nombre requerido'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Registro
app.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, name } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email ya registrado' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });

  const access = signAccess({ sub: user._id.toString(), email });
  const refresh = signRefresh({ sub: user._id.toString() });

  res.status(201).json({ access, refresh, user: { id: user._id, email, name } });
});

// Login
app.post('/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Formato inválido' });

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const access = signAccess({ sub: user._id.toString(), email });
  const refresh = signRefresh({ sub: user._id.toString() });

  res.json({ access, refresh, user: { id: user._id, email, name: user.name } });
});

// Refresh token
app.post('/auth/refresh', (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: 'Refresh token requerido' });
  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const access = signAccess({ sub: payload.sub });
    return res.json({ access });
  } catch {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// Healthcheck
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 4001, () => console.log('Auth service on', process.env.PORT || 4001));
