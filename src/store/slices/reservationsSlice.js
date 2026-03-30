import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import reservationService from '../../services/reservationService';

const API_URL = 'https://api.grandhotelsluxe.com/api';

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

// ✅ Thunk: Récupérer toutes les réservations
export const fetchReservations = createAsyncThunk(
  'reservations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reservations');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

// ✅ Thunk: Récupérer une réservation par ID
export const fetchReservationById = createAsyncThunk(
  'reservations/fetchById',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reservations/${reservationId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Réservation non trouvée');
    }
  }
);

// ✅ Thunk: Créer une réservation
export const createReservation = createAsyncThunk(
  'reservations/create',
  async (reservationData, { rejectWithValue }) => {
    try {
      const response = await api.post('/reservations', reservationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

// ✅ Thunk: Mettre à jour une réservation
export const updateReservation = createAsyncThunk(
  'reservations/update',
  async ({ reservationId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reservations/${reservationId}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

// ✅ Thunk: Confirmer une réservation (Admin)
export const confirmReservation = createAsyncThunk(
  'reservations/confirm',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reservations/${reservationId}/confirm`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la confirmation');
    }
  }
);

// ✅ Thunk: Annuler une réservation
export const cancelReservation = createAsyncThunk(
  'reservations/cancel',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reservations/${reservationId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }
);

// ✅ Thunk: Simuler un paiement pour une réservation
export const mockPaymentForReservation = createAsyncThunk(
  'reservations/mockPayment',
  async ({ reservationId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/mock', { reservationId, amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du paiement');
    }
  }
);

// ✅ Thunk: Traiter un paiement réel pour une réservation
export const processPaymentForReservation = createAsyncThunk(
  'reservations/processPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/process', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du paiement');
    }
  }
);

// ✅ Slice
const reservationsSlice = createSlice({
  name: 'reservations',
  initialState: {
    reservations: [],
    currentReservation: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    successMessage: null,
    // Statistiques
    stats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      totalRevenue: 0,
      formattedTotalRevenue: '0 FCFA'
    }
  },
  reducers: {
    clearCurrentReservation: (state) => {
      state.currentReservation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    // Calculer les statistiques localement
    calculateStats: (state) => {
      const totalRevenue = state.reservations
        .filter(r => r.status === 'confirmed' || r.status === 'completed')
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

      state.stats = {
        total: state.reservations.length,
        pending: state.reservations.filter(r => r.status === 'pending').length,
        confirmed: state.reservations.filter(r => r.status === 'confirmed').length,
        cancelled: state.reservations.filter(r => r.status === 'cancelled').length,
        completed: state.reservations.filter(r => r.status === 'completed').length,
        totalRevenue: totalRevenue,
        formattedTotalRevenue: reservationService.formatAmount(totalRevenue)
      };
    },
    // ✅ FORMATER LES MONTANTS DES RÉSERVATIONS
    formatReservationAmounts: (state) => {
      state.reservations.forEach(reservation => {
        reservation.formattedTotalAmount = reservationService.formatAmount(reservation.totalAmount);
        if (reservation.acompte) {
          reservation.formattedAcompte = reservationService.formatAmount(reservation.acompte);
        }
      });
      if (state.currentReservation) {
        state.currentReservation.formattedTotalAmount = reservationService.formatAmount(state.currentReservation.totalAmount);
        if (state.currentReservation.acompte) {
          state.currentReservation.formattedAcompte = reservationService.formatAmount(state.currentReservation.acompte);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // ========== Fetch all reservations ==========
      .addCase(fetchReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload.reservations || [];
        // ✅ FORMATER LES MONTANTS ET CALCULER STATS
        reservationsSlice.caseReducers.formatReservationAmounts(state);
        reservationsSlice.caseReducers.calculateStats(state);
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ========== Fetch reservation by ID ==========
      .addCase(fetchReservationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentReservation = action.payload.reservation;
        // ✅ FORMATER LES MONTANTS
        if (state.currentReservation) {
          state.currentReservation.formattedTotalAmount = reservationService.formatAmount(state.currentReservation.totalAmount);
          if (state.currentReservation.acompte) {
            state.currentReservation.formattedAcompte = reservationService.formatAmount(state.currentReservation.acompte);
          }
        }
      })
      .addCase(fetchReservationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ========== Create reservation ==========
      .addCase(createReservation.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isProcessing = false;
        const newReservation = action.payload.reservation;
        // ✅ FORMATER LES MONTANTS
        newReservation.formattedTotalAmount = reservationService.formatAmount(newReservation.totalAmount);
        state.reservations.unshift(newReservation);
        state.currentReservation = newReservation;
        state.successMessage = action.payload.message || 'Réservation créée avec succès';
        reservationsSlice.caseReducers.calculateStats(state);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // ========== Update reservation ==========
      .addCase(updateReservation.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.isProcessing = false;
        const updatedReservation = action.payload.reservation;
        // ✅ FORMATER LES MONTANTS
        updatedReservation.formattedTotalAmount = reservationService.formatAmount(updatedReservation.totalAmount);
        const index = state.reservations.findIndex(r => r._id === updatedReservation._id);
        if (index !== -1) {
          state.reservations[index] = updatedReservation;
        }
        state.currentReservation = updatedReservation;
        state.successMessage = action.payload.message || 'Réservation mise à jour';
        reservationsSlice.caseReducers.calculateStats(state);
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // ========== Confirm reservation ==========
      .addCase(confirmReservation.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(confirmReservation.fulfilled, (state, action) => {
        state.isProcessing = false;
        const index = state.reservations.findIndex(r => r._id === action.payload.reservation._id);
        if (index !== -1) {
          state.reservations[index].status = 'confirmed';
        }
        if (state.currentReservation && state.currentReservation._id === action.payload.reservation._id) {
          state.currentReservation.status = 'confirmed';
        }
        state.successMessage = action.payload.message || 'Réservation confirmée';
        reservationsSlice.caseReducers.calculateStats(state);
      })
      .addCase(confirmReservation.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // ========== Cancel reservation ==========
      .addCase(cancelReservation.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.isProcessing = false;
        const index = state.reservations.findIndex(r => r._id === action.payload.reservation?._id);
        if (index !== -1) {
          state.reservations[index].status = 'cancelled';
        }
        if (state.currentReservation && state.currentReservation._id === action.payload.reservation?._id) {
          state.currentReservation.status = 'cancelled';
        }
        state.successMessage = action.payload.message || 'Réservation annulée';
        reservationsSlice.caseReducers.calculateStats(state);
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // ========== Mock payment ==========
      .addCase(mockPaymentForReservation.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(mockPaymentForReservation.fulfilled, (state, action) => {
        state.isProcessing = false;
        // Mettre à jour la réservation avec les infos de paiement
        const index = state.reservations.findIndex(r => r._id === action.payload.reservation.id);
        if (index !== -1) {
          state.reservations[index].status = action.payload.reservation.status;
          state.reservations[index].acompte = action.payload.reservation.acompte;
          // ✅ FORMATER L'ACOMPTE
          state.reservations[index].formattedAcompte = reservationService.formatAmount(action.payload.reservation.acompte);
        }
        state.successMessage = action.payload.message;
      })
      .addCase(mockPaymentForReservation.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // ========== Process payment ==========
      .addCase(processPaymentForReservation.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPaymentForReservation.fulfilled, (state, action) => {
        state.isProcessing = false;
        const index = state.reservations.findIndex(r => r._id === action.payload.reservation.id);
        if (index !== -1) {
          state.reservations[index].status = action.payload.reservation.status;
          state.reservations[index].acompte = action.payload.reservation.acompte;
          // ✅ FORMATER L'ACOMPTE
          state.reservations[index].formattedAcompte = reservationService.formatAmount(action.payload.reservation.acompte);
        }
        state.successMessage = action.payload.message;
      })
      .addCase(processPaymentForReservation.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearCurrentReservation, 
  clearError, 
  clearSuccessMessage,
  calculateStats,
  formatReservationAmounts
} = reservationsSlice.actions;

export default reservationsSlice.reducer;