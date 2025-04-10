const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const getUploadUrl = async () => {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      throw new Error('❌ Faltan variables de entorno: CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN');
    }

    const uniqueName = `video-${Date.now()}`;
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        requireSignedURLs: false,
        maxDurationSeconds: 300,
        meta: { name: uniqueName }
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.result;
  } catch (error) {
    console.error('❌ Error al obtener URL de subida:', error.response?.data || error.message);
    throw error;
  }
};

const uploadToCloudflare = async (filePath) => {
  try {
    const { uploadURL, uid } = await getUploadUrl();

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), path.basename(filePath));

    const response = await axios.post(uploadURL, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    fs.unlinkSync(filePath); // Borra el archivo temporal después de subir

    return {
      success: true,
      result: {
        uid,
        ...response.data
      }
    };
  } catch (error) {
    console.error('❌ Error al subir video a Cloudflare:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = uploadToCloudflare;
