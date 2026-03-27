import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://backend.grandhotelaeroport.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ FORMATER LES MONTANTS EN XAF
const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF'
  }).format(amount);
};

// ✅ Hook pour récupérer toutes les réservations
export const useReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/reservations');
      const reservationsData = response.data.reservations || [];
      
      // ✅ FORMATER LES MONTANTS
      const formattedReservations = reservationsData.map(reservation => ({
        ...reservation,
        formattedTotalAmount: formatAmount(reservation.totalAmount),
        formattedAcompte: reservation.acompte ? formatAmount(reservation.acompte) : null
      }));
      
      setReservations(formattedReservations);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('❌ Erreur chargement réservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return { reservations, loading, error, refetch: fetchReservations };
};

// ✅ Hook pour récupérer une réservation spécifique
export const useReservation = (id) => {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservation = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/reservations/${id}`);
      const reservationData = response.data.reservation;
      
      // ✅ FORMATER LES MONTANTS
      if (reservationData) {
        reservationData.formattedTotalAmount = formatAmount(reservationData.totalAmount);
        reservationData.formattedAcompte = reservationData.acompte ? formatAmount(reservationData.acompte) : null;
      }
      
      setReservation(reservationData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('❌ Erreur chargement réservation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  return { reservation, loading, error, refetch: fetchReservation };
};

// ✅ Hook pour créer une réservation
export const useCreateReservation = () => {
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createReservation = async (reservationData) => {
    try {
      setCreating(true);
      setError(null);
      const response = await api.post('/reservations', reservationData);
      const resultData = response.data;
      
      // ✅ FORMATER LES MONTANTS DANS LA RÉPONSE
      if (resultData.reservation) {
        resultData.reservation.formattedTotalAmount = formatAmount(resultData.reservation.totalAmount);
        resultData.reservation.formattedAcompte = resultData.reservation.acompte ? formatAmount(resultData.reservation.acompte) : null;
      }
      
      setResult(resultData);
      return resultData;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  return { createReservation, creating, result, error };
};

// ✅ Hook pour mettre à jour une réservation
export const useUpdateReservation = () => {
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const updateReservation = async (id, reservationData) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await api.put(`/reservations/${id}`, reservationData);
      const resultData = response.data;
      
      // ✅ FORMATER LES MONTANTS DANS LA RÉPONSE
      if (resultData.reservation) {
        resultData.reservation.formattedTotalAmount = formatAmount(resultData.reservation.totalAmount);
        resultData.reservation.formattedAcompte = resultData.reservation.acompte ? formatAmount(resultData.reservation.acompte) : null;
      }
      
      setResult(resultData);
      return resultData;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  return { updateReservation, updating, result, error };
};

// ✅ Hook pour annuler une réservation
export const useCancelReservation = () => {
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const cancelReservation = async (id) => {
    try {
      setCancelling(true);
      setError(null);
      const response = await api.put(`/reservations/${id}/cancel`);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setCancelling(false);
    }
  };

  return { cancelReservation, cancelling, result, error };
};

// ✅ Hook pour confirmer une réservation
export const useConfirmReservation = () => {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const confirmReservation = async (id) => {
    try {
      setConfirming(true);
      setError(null);
      const response = await api.put(`/reservations/${id}/confirm`);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  return { confirmReservation, confirming, result, error };
};

// ✅ Hook pour obtenir les statistiques des réservations
export const useReservationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/reservations/stats');
      const statsData = response.data.stats;
      
      // ✅ FORMATER LES STATISTIQUES MONÉTAIRES
      if (statsData) {
        statsData.formattedTotalRevenue = formatAmount(statsData.totalRevenue);
        statsData.formattedAverageReservation = formatAmount(statsData.averageReservation);
      }
      
      setStats(statsData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('❌ Erreur chargement stats réservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};