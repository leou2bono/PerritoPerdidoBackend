# Usa una imagen oficial de Node.js
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto (ejemplo: 4001 para auth)
EXPOSE 4001

# Comando de inicio
CMD ["npm", "start"]
