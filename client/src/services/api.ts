/**
 * @fileoverview Configured Axios instance for API communication.
 *
 * This module provides a pre-configured Axios instance with:
 * - Base URL pointing to the API server
 * - Automatic JWT token injection via request interceptor
 * - Automatic redirect to login on 401 responses
 *
 * All API calls in the application should use this instance
 * to ensure consistent authentication and error handling.
 *
 * @module services/api
 *
 * @example
 * import api from '../services/api';
 *
 * // GET request
 * const response = await api.get('/budgets');
 *
 * // POST request with data
 * const newBudget = await api.post('/budgets', { name: 'Groceries', amount: 500 });
 *
 * // PUT request
 * await api.put(`/budgets/${id}`, { amount: 600 });
 *
 * // DELETE request
 * await api.delete(`/budgets/${id}`);
 */

import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

/**
 * Pre-configured Axios instance for API requests.
 *
 * Configuration:
 * - baseURL: '/api' (proxied to backend in development)
 * - Content-Type: 'application/json'
 * - Automatic JWT token injection
 * - Automatic 401 handling with redirect to login
 *
 * @constant
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor to automatically add JWT token to all requests.
 *
 * Reads the token from localStorage and adds it to the Authorization header
 * in the format: "Bearer <token>"
 *
 * If no token is present, the request proceeds without authentication.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor for global error handling.
 *
 * Handles 401 Unauthorized responses by:
 * 1. Clearing the stored token
 * 2. Redirecting to the login page
 *
 * This ensures users are automatically logged out when their
 * session expires or token becomes invalid.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
