const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const videoController = require('../controllers/video.controller');

// Configuración de multer para recibir archivos de video
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Subir video
router.post('/upload', upload.single('video'), videoController.uploadVideo);

// Obtener todos los videos
router.get('/', videoController.getAllVideos);

// Obtener video por ID
router.get('/:id', videoController.getVideoById);

// Eliminar video por ID
router.delete('/:id', videoController.deleteVideo);

module.exports = router;
