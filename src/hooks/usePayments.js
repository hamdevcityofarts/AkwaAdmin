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

// ✅ Hook pour récupérer tous les paiements
export const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/payments');
      const paymentsData = response.data.payments || [];
      
      // ✅ FORMATER LES MONTANTS
      const formattedPayments = paymentsData.map(payment => ({
        ...payment,
        formattedAmount: formatAmount(payment.amount),
        formattedRefundedAmount: payment.refundedAmount ? formatAmount(payment.refundedAmount) : null
      }));
      
      setPayments(formattedPayments);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('❌ Erreur chargement paiements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return { payments, loading, error, refetch: fetchPayments };
};

// ✅ Hook pour récupérer les statistiques
export const usePaymentStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/payments/stats');
      const statsData = response.data.stats;
      
      // ✅ FORMATER LES STATISTIQUES
      if (statsData) {
        statsData.formattedTotalRevenue = formatAmount(statsData.totalRevenue);
        statsData.formattedAverageTransaction = formatAmount(statsData.averageTransaction);
      }
      
      setStats(statsData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('❌ Erreur chargement stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

// ✅ Hook pour récupérer un paiement spécifique
export const usePayment = (id) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayment = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/payments/${id}`);
      const paymentData = response.data.payment;
      
      // ✅ FORMATER LES MONTANTS
      if (paymentData) {
        paymentData.formattedAmount = formatAmount(paymentData.amount);
        paymentData.formattedRefundedAmount = paymentData.refundedAmount ? formatAmount(paymentData.refundedAmount) : null;
      }
      
      setPayment(paymentData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('❌ Erreur chargement paiement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  return { payment, loading, error, refetch: fetchPayment };
};

// ✅ Hook pour traiter un paiement
export const useProcessPayment = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const processPayment = async (paymentData) => {
    try {
      setProcessing(true);
      setError(null);
      const response = await api.post('/payments/process', paymentData);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  return { processPayment, processing, result, error };
};

// ✅ Hook pour effectuer un remboursement
export const useRefundPayment = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const refundPayment = async (paymentId, amount = null, reason = '') => {
    try {
      setProcessing(true);
      setError(null);
      const response = await api.post(`/payments/${paymentId}/refund`, {
        amount,
        reason
      });
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  return { refundPayment, processing, result, error };
};