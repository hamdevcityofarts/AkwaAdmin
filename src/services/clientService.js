import axios from 'axios';

const API_URL = 'https://backend.grandhotelaeroport.com/api' + '/utilisateurs';

const api = axios.create({  
  baseURL: API_URL,
  timeout: 10000,
});

// Intercepteur pour l'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const clientService = {
  // Récupérer uniquement les clients
  async getAllClients() {
    try {
      console.log('🔄 [CLIENT SERVICE] Récupération des clients...');
      const response = await api.get('/');
      // Filtrer pour ne garder que les clients
      const clients = response.data.filter(user => user.role === 'client');
      console.log('✅ [CLIENT SERVICE] Clients récupérés:', clients.length);
      return { ...response, data: clients };
    } catch (error) {
      console.error('💥 [CLIENT SERVICE] Erreur:', error);
      throw error;
    }
  },

  async getClientById(id) {
    try {
      const response = await api.get(`/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération client:', error);
      throw error;
    }
  },

  async createClient(clientData) {
    try {
      // S'assurer que le rôle est bien "client"
      const dataToSend = { ...clientData, role: 'client' };
      const response = await api.post('/', dataToSend);
      return response;
    } catch (error) {
      console.error('❌ Erreur création client:', error);
      throw error;
    }
  },

  async updateClient(id, clientData) {
    try {
      const response = await api.put(`/${id}`, clientData);
      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour client:', error);
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      const response = await api.delete(`/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur suppression client:', error);
      throw error;
    }
  },
};

export default clientService;