import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import paymentService from '../../services/paymentService';

const API_URL = 'https://backend.grandhotelaeroport.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Intercepteur pour token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Thunk: Récupérer tous les paiements
export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

// ✅ Thunk: Récupérer un paiement par ID
export const fetchPaymentById = createAsyncThunk(
  'payments/fetchById',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Paiement non trouvé');
    }
  }
);

// ✅ Thunk: Traiter un paiement
export const processPayment = createAsyncThunk(
  'payments/process',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/process', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de traitement');
    }
  }
);

// ✅ Thunk: Simulation paiement
export const mockPayment = createAsyncThunk(
  'payments/mock',
  async ({ reservationId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/mock', { reservationId, amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur simulation');
    }
  }
);

// ✅ Thunk: Remboursement
export const refundPayment = createAsyncThunk(
  'payments/refund',
  async ({ paymentId, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, { amount, reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur remboursement');
    }
  }
);

// ✅ Thunk: Statistiques
export const fetchPaymentStats = createAsyncThunk(
  'payments/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur stats');
    }
  }
);

// ✅ Slice
const paymentSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    currentPayment: null,
    stats: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    successMessage: null
  },
  reducers: {
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    // ✅ FORMATER LES MONTANTS DES PAIEMENTS
    formatPaymentAmounts: (state) => {
      state.payments.forEach(payment => {
        payment.formattedAmount = paymentService.formatAmount(payment.amount);
        if (payment.refundedAmount) {
          payment.formattedRefundedAmount = paymentService.formatAmount(payment.refundedAmount);
        }
      });
      if (state.currentPayment) {
        state.currentPayment.formattedAmount = paymentService.formatAmount(state.currentPayment.amount);
        if (state.currentPayment.refundedAmount) {
          state.currentPayment.formattedRefundedAmount = paymentService.formatAmount(state.currentPayment.refundedAmount);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all payments
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload.payments || [];
        // ✅ FORMATER LES MONTANTS
        paymentSlice.caseReducers.formatPaymentAmounts(state);
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch payment by ID
      .addCase(fetchPaymentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPayment = action.payload.payment;
        // ✅ FORMATER LES MONTANTS
        if (state.currentPayment) {
          state.currentPayment.formattedAmount = paymentService.formatAmount(state.currentPayment.amount);
          if (state.currentPayment.refundedAmount) {
            state.currentPayment.formattedRefundedAmount = paymentService.formatAmount(state.currentPayment.refundedAmount);
          }
        }
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Process payment
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        const newPayment = action.payload.payment;
        // ✅ FORMATER LES MONTANTS
        newPayment.formattedAmount = paymentService.formatAmount(newPayment.amount);
        state.payments.unshift(newPayment);
        state.successMessage = action.payload.message;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Mock payment
      .addCase(mockPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(mockPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        const newPayment = action.payload.payment;
        // ✅ FORMATER LES MONTANTS
        newPayment.formattedAmount = paymentService.formatAmount(newPayment.amount);
        state.payments.unshift(newPayment);
        state.successMessage = action.payload.message;
      })
      .addCase(mockPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Refund
      .addCase(refundPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        // Mettre à jour le paiement dans la liste
        const index = state.payments.findIndex(p => p._id === action.payload.originalPayment.id);
        if (index !== -1) {
          state.payments[index].status = action.payload.originalPayment.status;
          state.payments[index].refundedAmount = action.payload.originalPayment.refundedAmount;
          // ✅ FORMATER LES MONTANTS
          state.payments[index].formattedRefundedAmount = paymentService.formatAmount(action.payload.originalPayment.refundedAmount);
        }
        state.successMessage = action.payload.message;
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Stats
      .addCase(fetchPaymentStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
        // ✅ FORMATER LES STATISTIQUES
        if (state.stats) {
          state.stats.formattedTotalRevenue = paymentService.formatAmount(state.stats.totalRevenue);
          state.stats.formattedAverageTransaction = paymentService.formatAmount(state.stats.averageTransaction);
        }
      })
      .addCase(fetchPaymentStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentPayment, clearError, clearSuccessMessage, formatPaymentAmounts } = paymentSlice.actions;
export default paymentSlice.reducer;