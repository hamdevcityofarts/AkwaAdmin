import axios from 'axios';

const API_URL = 'https://api.grandhotelsluxe.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
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

const roomService = {
  // ✅ NOUVELLE MÉTHODE : Création avec URLs Cloudinary
  async createRoom(roomData) {
    try {
      console.log('📤 Envoi données chambre (URLs Cloudinary):', roomData);
      
      const response = await api.post('/chambres', roomData, {
        headers: {
          'Content-Type': 'application/json', // ✅ Plus multipart/form-data
        },
      });
      
      console.log('✅ Réponse création chambre:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erreur création chambre:', error.response?.data || error.message);
      throw error;
    }
  },

  // ✅ NOUVELLE MÉTHODE : Mise à jour avec URLs Cloudinary
  async updateRoom(id, roomData) {
    try {
      console.log('📤 Envoi données modification (URLs Cloudinary):', roomData);
      
      const response = await api.put(`/chambres/${id}`, roomData, {
        headers: {
          'Content-Type': 'application/json', // ✅ Plus multipart/form-data
        },
      });
      
      console.log('✅ Réponse modification chambre:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erreur modification chambre:', error.response?.data || error.message);
      throw error;
    }
  },

  // ✅ CONSERVER LES AUTRES MÉTHODES (inchangées)
  async getAllRooms() {
    try {
      const response = await api.get('/chambres');
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getRoomById(id) {
    try {
      const response = await api.get(`/chambres/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async deleteRoom(id) {
    try {
      const response = await api.delete(`/chambres/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ❌ SUPPRIMER les méthodes d'upload (déplacées vers cloudinaryService)
  // async uploadRoomImage() {...}
  // async uploadMultipleRoomImages() {...}
  // async deleteRoomImage() {...}

  generateDefaultImages(roomType, roomName) {
    const imageCollections = {
      standard: ['1566664482983-ccf19b83f6c0', '1586023493607-b0a0e59cb41e'],
      superior: ['1564078516393-c71ca5295b6c', '1586105251260-482500eaae4e'],
      deluxe: ['1590490396147-69e04c41c09d', '1568495248632-6f6c5a3b9d60'],
      family: ['1578683010233-3961fc51e0a6', '1590490363607-169912429829'],
      suite: ['1595576508833-50ded48d3426', '1568495248636-6c5a3b9d6b0c'],
      executive: ['1595576508833-50ded48d3426', '1568495248636-6c5a3b9d6b0c'],
      presidential: ['1595576508834-50ded48d3427', '1568495248637-6c5a3b9d6b0d']
    };

    const baseUrl = 'https://images.unsplash.com/photo-';
    const collection = imageCollections[roomType] || imageCollections.standard;
    
    return collection.map((photoId, index) => ({
      url: `${baseUrl}${photoId}?w=800&h=600&fit=crop&auto=format`,
      alt: `${roomName} - Image ${index + 1}`,
      isPrimary: index === 0,
      order: index
    }));
  },

  formatPrice(price) {
    if (!price && price !== 0) return '0 FCFA';
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericPrice) + ' FCFA';
  },

  getCurrencySymbol() {
    return 'FCFA';
  },

  applyExactPrice(price) {
    return {
      originalPrice: price,
      discountedPrice: price,
      discountPercentage: 0,
      hasDiscount: false
    };
  },

  validatePrice(roomData) {
    const price = parseFloat(roomData.price);
    
    if (roomData.discountedPrice && roomData.discountedPrice !== price) {
      console.warn('⚠️ Prix corrigé - suppression de la réduction automatique');
      return {
        ...roomData,
        price: price,
        discountedPrice: price,
        discountPercentage: 0,
        hasDiscount: false
      };
    }
    
    return roomData;
  }
};

export default roomService;