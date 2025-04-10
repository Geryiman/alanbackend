const express = require('express');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user.routes');
const videoRoutes = require('./routes/video.routes');
const authRoutes = require('./routes/auth.routes');
const likeRoutes = require('./routes/like.routes');
const commentRoutes = require('./routes/comment.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);


app.get('/', (req, res) => {
  res.send('Bienvenido a la API de TikTok App');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
