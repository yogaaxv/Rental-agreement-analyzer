import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 120000, // 2 minutes for large PDFs
});

// Response interceptor — normalize error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (!error.message) {
      error.message = 'An unexpected error occurred. Please try again.';
    }
    return Promise.reject(error);
  }
);

/**
 * Upload a PDF and start analysis.
 * @param {File} file
 * @param {function} onUploadProgress - Axios progress callback
 * @returns {Promise<object>} analysis result
 */
export function uploadAndAnalyze(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient
    .post('/analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((res) => res.data);
}

/**
 * Fetch a completed analysis by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export function getAnalysis(id) {
  return apiClient.get(`/analysis/${id}`).then((res) => res.data);
}

/**
 * Fetch paginated analysis history.
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<object>}
 */
export function getHistory(page = 1, limit = 20) {
  return apiClient
    .get('/history', { params: { page, limit } })
    .then((res) => res.data);
}

/**
 * Delete an analysis by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteAnalysis(id) {
  return apiClient.delete(`/history/${id}`).then((res) => res.data);
}

/**
 * Returns the URL for the PDF report.
 * @param {string} id
 * @returns {string}
 */
export function getReportUrl(id) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${base}/analysis/${id}/report`;
}

/**
 * Returns the URL for the JSON download.
 * @param {string} id
 * @returns {string}
 */
export function getJsonUrl(id) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${base}/analysis/${id}/json`;
}
