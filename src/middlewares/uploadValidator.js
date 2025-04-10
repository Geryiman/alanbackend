import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

export const videoUploadValidator = (req, res, next) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Archivo no recibido' });

  ffmpeg.ffprobe(file.path, (err, metadata) => {
    if (err) return res.status(500).json({ message: 'Error al analizar video' });

    const duration = metadata.format.duration;
    if (duration >  61) {
      return res.status(400).json({ message: 'El video excede 1 minuto de duración' });
    }

    next(); // Video válido
  });
};