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
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

function sendRecoveryEmail(to, token) {
  console.log(`Simulando envío de correo a ${to} con token: ${token}`);
}


/*async function sendRecoveryEmail(to, token) {
  // Configura tu transporte SMTP (ejemplo con Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'leonardo.pavez@gmail.com', // tu correo
      pass: 'Bonobono2123%', // tu contraseña o app password
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: 'Recuperación de clave',
    text: `Usa este token para resetear tu clave: ${token}`,
    html: `<p>Usa este token para resetear tu clave:</p><b>${token}</b>`,
  };

  await transporter.sendMail(mailOptions);
}*/


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

// Solicitar recuperación de clave (envía email con link o código)
app.post('/auth/recover', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Aquí generas un token temporal o código de recuperación
    const recoveryToken = crypto.randomUUID(); 
    user.recoveryToken = recoveryToken;
    await user.save();

    // Enviar email con link o código (ejemplo)
    await sendRecoveryEmail(email, recoveryToken);

    res.json({ message: 'Correo de recuperación enviado' });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Error en recuperación' });
  }
});

// Resetear clave con token
app.post('/auth/reset', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({ recoveryToken: token });
    if (!user) return res.status(400).json({ error: 'Token inválido' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.recoveryToken = null;
    await user.save();

    res.json({ message: 'Clave actualizada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al resetear clave' });
  }
});


// Healthcheck
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 4001, () => console.log('Auth service on', process.env.PORT || 4001));
