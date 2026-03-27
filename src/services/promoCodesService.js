import axios from 'axios';

const API_URL = 'https://backend.grandhotelaeroport.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Intercepteur pour debugger les requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
  return config;
});

// Intercepteur pour debugger les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - Succès:`, response.data);
    return response;
  },
  (error) => {
    console.log(`❌ ${error.config?.url} - Erreur:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getCodesPromo = async () => {
  try {
    console.log('🔄 Récupération des codes promo...');
    const response = await api.get('/codepromo');
    
    // LOG DÉTAILLÉ
    console.log('=== DEBUG API RESPONSE ===');
    console.log('📦 Réponse complète:', response);
    console.log('📊 Response.data:', response.data);
    console.log('🔍 Type de response.data:', typeof response.data);
    console.log('📋 Array?', Array.isArray(response.data));
    
    if (response.data) {
      console.log('🗂️ Clés disponibles:', Object.keys(response.data));
      
      if (Array.isArray(response.data)) {
        console.log('✅ Format: Tableau direct');
        console.log('👤 Premier élément:', response.data[0]);
      } else if (response.data.codesPromo) {
        console.log('✅ Format: { codesPromo: [...] }');
        console.log('👤 Premier élément:', response.data.codesPromo[0]);
      } else {
        console.log('❓ Format inconnu, exploration:');
        // Explorer toutes les propriétés
        for (const key in response.data) {
          console.log(`   ${key}:`, typeof response.data[key], Array.isArray(response.data[key]) ? `[${response.data[key].length} éléments]` : response.data[key]);
        }
      }
    }
    console.log('=== FIN DEBUG ===');
    
    return response;
  } catch (error) {
    console.error('❌ Erreur récupération codes promo:', error);
    throw error;
  }
};

// ✅ CRÉER UN NOUVEAU CODE PROMO
export const createCodePromo = async (codePromoData) => {
  try {
    console.log('📤 Création nouveau code promo:', codePromoData);
    const response = await api.post('/codepromo', codePromoData);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur création code promo:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ METTRE À JOUR UN CODE PROMO
export const updateCodePromo = async (id, codePromoData) => {
  try {
    console.log('📝 Modification code promo:', { id, ...codePromoData });
    const response = await api.put(`/codepromo/${id}`, codePromoData);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur modification code promo:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ SUPPRIMER UN CODE PROMO
export const deleteCodePromo = async (id) => {
  try {
    const response = await api.delete(`/codepromo/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur suppression code promo:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ VÉRIFIER UN CODE PROMO
export const verifyCodePromo = async (code, chambreId, nights) => {
  try {
    const response = await api.post('/codepromo/verify', {
      code,
      chambreId,
      nights
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erreur vérification code promo:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ OBTENIR LES STATISTIQUES
export const getPromoCodeStats = async () => {
  try {
    const response = await api.get('/codepromo/stats');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération statistiques codes promo:', error.response?.data || error.message);
    throw error;
  }
};

// Méthodes utilitaires (non-async)
export const calculateDiscount = (originalPrice, discountType, discountValue) => {
  if (!originalPrice || !discountValue) return 0;

  const price = parseFloat(originalPrice);
  const value = parseFloat(discountValue);

  if (discountType === 'percentage') {
    const percentage = Math.min(value, 100);
    return (price * percentage) / 100;
  } else if (discountType === 'fixed') {
    return Math.min(value, price);
  }

  return 0;
};

export const formatDiscount = (discountType, discountValue) => {
  if (discountType === 'percentage') {
    return `${discountValue}%`;
  } else if (discountType === 'fixed') {
    return formatAmount(discountValue);
  }
  return 'Aucune réduction';
};

export const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF'
  }).format(amount);
};

export const isCodeExpired = (validityDate) => {
  if (!validityDate) return false;
  return new Date(validityDate) < new Date();
};

export const isCodeActive = (promoCode) => {
  if (!promoCode) return false;
  
  const now = new Date();
  const startDate = new Date(promoCode.dateDebut);
  const endDate = new Date(promoCode.dateFin);
  
  return promoCode.statut === 'actif' && 
         now >= startDate && 
         now <= endDate && 
         (!promoCode.utilisationMax || (promoCode.utilisationActuelle || 0) < promoCode.utilisationMax);
};

// Export par défaut pour la compatibilité
const promoCodesService = {
  getCodesPromo,
  createCodePromo,
  updateCodePromo,
  deleteCodePromo,
  verifyCodePromo,
  getPromoCodeStats,
  calculateDiscount,
  formatDiscount,
  formatAmount,
  isCodeExpired,
  isCodeActive
};

export default promoCodesService;