const express = require('express');
const router = express.Router();
const likeController = require('../controllers/like.controller');

// Dar o quitar like (por device_id)
router.post('/toggle', likeController.toggleLike);

// Obtener total de likes por video
router.get('/count/:video_id', likeController.getLikesCount);

// Verificar si un dispositivo ya dio like a un video
router.get('/check', likeController.userLikedVideo);


module.exports = router;
