// services/profile/index.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
//const cors = require('cors');
const app = express();
app.set("trust proxy", 1); 
app.use(express.json({ limit: '2mb' })); // base64 puede crecer
//app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cors({ origin: '*' }));
app.use(helmet());

// Conexión Mongo
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Profile Mongo OK'));

// Middleware auth
const auth = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sin token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Esquema Perfil con 2dsphere
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, index: true, required: true },
  nombre: { type: String, required: true },
  fechaNacimiento: { type: Date, required: true },
  fechaActual: { type: Date, required: true },
  fotoBase64: { type: String }, // considerar migrar a URL en producción
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere', required: true }, // [lng, lat]
  },
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

// Validación de entrada
const profileSchemaZ = z.object({
  nombre: z.string().min(1),
  fechaNacimiento: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida'),
  fotoBase64: z.string().optional(),
  geo: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
  }),
});

// Crear perfil (una vez por usuario)
app.post('/profiles', auth, async (req, res) => {
  const parsed = profileSchemaZ.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  //const exists = await Profile.findOne({ userId: req.user.sub });
  //if (exists) return res.status(409).json({ error: 'Perfil ya existe. Use actualización.' });

  const { nombre, fechaNacimiento, fotoBase64, geo } = parsed.data;
  const profile = await Profile.create({
    userId: req.user.sub,
    nombre,
    fechaNacimiento: new Date(fechaNacimiento),
    fechaActual: new Date(),
    fotoBase64,
    geo,
  });
  return res.status(201).json(profile);
});

// Obtener todos los perfiles
app.get('/profiles', auth, async (req, res) => {
  try {
    const profiles = await Profile.find().limit(100); // límite de seguridad
    res.json(profiles);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener perfiles' });
  }
});

// Obtener mi perfil
app.get('/profiles/me', auth, async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user.sub });
  if (!profile) return res.status(404).json({ error: 'No existe perfil' });
  return res.json(profile);
});

// Actualizar mi perfil (upsert)
app.put('/profiles/me', auth, async (req, res) => {
  const parsed = profileSchemaZ.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const update = { ...parsed.data, fechaActual: new Date() };
  const profile = await Profile.findOneAndUpdate(
    { userId: req.user.sub },
    update,
    { new: true, upsert: true }
  );
  return res.json(profile);
});

// Búsqueda cercana (ejemplo de geo)
app.get('/profiles/near', auth, async (req, res) => {
  const { lng, lat, km = 5 } = req.query;
  const dist = Number(km) / 6378.1; // radio de la Tierra en km para $centerSphere
  const profiles = await Profile.find({
    geo: {
      $geoWithin: {
        $centerSphere: [[Number(lng), Number(lat)], dist],
      },
    },
  }).limit(50);
  return res.json(profiles);
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
//@app.use(cors({ origin: '*' }));
app.listen(process.env.PORT || 4002, () => console.log('Profile service on', process.env.PORT || 4002));
