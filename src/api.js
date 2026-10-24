import axios from 'axios';

// Si existe la variable de entorno (producción), la usa. Si no, usa el proxy relativo (desarrollo).
const baseURL = import.meta.env.VITE_API_URL || 'http://167.172.159.222:8010/api/v1';

const api = axios.create({
  baseURL: baseURL,
});

export default api;