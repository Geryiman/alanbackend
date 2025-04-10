const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const db = require('../db');
const uploadToCloudflare = require('../services/cloudflare.service');
require('dotenv').config();

ffmpeg.setFfmpegPath(ffmpegPath);

const CLOUDFLARE_ACCOUNT_ID = '452a99fdcee8bd1eda20ba056aa0abd4';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const uploadVideo = async (req, res) => {
  try {
    const file = req.file;
    const filePath = path.resolve(file.path);

    if (!file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    console.log('Validando y subiendo video...');

    // Subir a Cloudflare
    const result = await uploadToCloudflare(filePath);

    if (!result.success) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(500).json({ error: 'Error al subir video a Cloudflare', result });
    }

    const { uid } = result.result;

    // Obtener playback_url desde Cloudflare
    let playback_url = null;
    try {
      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
        { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
      );
      playback_url = response.data.result.playback?.hls || null;
    } catch (err) {
      console.warn('No se pudo obtener playback_url al instante:', err.message);
    }

    // Guardar metadata en base de datos
    await db.execute(
      'INSERT INTO videos (cloudflare_uid, title, description, user_id) VALUES (?, ?, ?, ?)',
      [uid, req.body.title || '', req.body.description || '', req.body.user_id || null]
    );

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return res.status(200).json({
      message: 'Video subido correctamente',
      uid,
      playback_url
    });
  } catch (error) {
    console.error('Error en uploadVideo:', error);
    res.status(500).json({ error: 'Error al subir video', details: error.message });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM videos ORDER BY created_at DESC');

    const videosConPlayback = await Promise.all(rows.map(async (video) => {
      try {
        const response = await axios.get(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${video.cloudflare_uid}`,
          { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
        );
        return {
          ...video,
          playback_url: response.data.result.playback?.hls || null
        };
      } catch (err) {
        console.error(`Error al obtener playback_url para ${video.cloudflare_uid}:`, err.message);
        return { ...video, playback_url: null };
      }
    }));

    res.status(200).json(videosConPlayback);
  } catch (error) {
    console.error('Error al obtener videos:', error);
    res.status(500).json({ error: 'Error al obtener videos' });
  }
};

const getVideoById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM videos WHERE id = ?', [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Video no encontrado' });

    const video = rows[0];

    try {
      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${video.cloudflare_uid}`,
        { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
      );
      video.playback_url = response.data.result.playback?.hls || null;
    } catch (err) {
      console.error(`Error al obtener playback_url para ${video.cloudflare_uid}:`, err.message);
      video.playback_url = null;
    }

    res.status(200).json(video);
  } catch (error) {
    console.error('Error al obtener video por ID:', error);
    res.status(500).json({ error: 'Error al obtener video' });
  }
};

const deleteVideo = async (req, res) => {
  try {
    await db.execute('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Video eliminado' });
  } catch (error) {
    console.error('Error al eliminar video:', error);
    res.status(500).json({ error: 'Error al eliminar video' });
  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo
};
