const db = require('../db');

// Dar o quitar like basado en user_id
exports.toggleLike = async (req, res) => {
  const { video_id, user_id } = req.body;

  if (!video_id || !user_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const [existing] = await db.query(
      'SELECT * FROM likes WHERE video_id = ? AND user_id = ?',
      [video_id, user_id]
    );

    if (existing.length > 0) {
      await db.query(
        'DELETE FROM likes WHERE video_id = ? AND user_id = ?',
        [video_id, user_id]
      );
      return res.json({ liked: false });
    } else {
      await db.query(
        'INSERT INTO likes (video_id, user_id) VALUES (?, ?)',
        [video_id, user_id]
      );
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar like' });
  }
};

// Contador de likes por video
exports.getLikesCount = async (req, res) => {
  const { video_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM likes WHERE video_id = ?',
      [video_id]
    );
    res.json({ likes: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al contar likes' });
  }
};

// Verificar si el usuario ya dio like
exports.userLikedVideo = async (req, res) => {
  const { video_id, user_id } = req.query;

  if (!video_id || !user_id) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM likes WHERE video_id = ? AND user_id = ?',
      [video_id, user_id]
    );
    res.json({ liked: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar like' });
  }
};
