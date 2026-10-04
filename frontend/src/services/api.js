import axios from 'axios';

// Support both local dev proxy and production public App Runner URL
const rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

// Normalize API_BASE_URL so requests consistently hit the /api router
export const API_BASE_URL = rawBaseUrl
  ? (rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`)
  : '/api';

// Derive public OpenAPI docs URL from API base URL (e.g. https://xxx.awsapprunner.com/docs)
export const getDocsUrl = () => {
  if (rawBaseUrl) {
    const rootOrigin = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
    return `${rootOrigin}/docs`;
  }
  return '/docs';
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Helper to serialize array params like service=EC2&service=S3
const buildParams = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  
  if (Array.isArray(filters.services)) {
    filters.services.forEach(s => params.append('service', s));
  } else if (filters.services) {
    params.append('service', filters.services);
  }

  if (Array.isArray(filters.regions)) {
    filters.regions.forEach(r => params.append('region', r));
  } else if (filters.regions) {
    params.append('region', filters.regions);
  }

  if (Array.isArray(filters.environments)) {
    filters.environments.forEach(e => params.append('environment', e));
  }

  if (Array.isArray(filters.projects)) {
    filters.projects.forEach(p => params.append('project', p));
  }

  return params;
};

export const fetchDashboard = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await apiClient.get('/dashboard', { params });
  return response.data;
};

export const fetchCosts = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await apiClient.get('/costs', { params });
  return response.data;
};

export const fetchUsage = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await apiClient.get('/usage', { params });
  return response.data;
};

export const fetchServices = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await apiClient.get('/services', { params });
  return response.data;
};

export const fetchRegions = async (filters = {}) => {
  const params = buildParams(filters);
  const response = await apiClient.get('/regions', { params });
  return response.data;
};

export const generateReport = async (reportPayload) => {
  const response = await apiClient.post('/reports/generate', reportPayload);
  return response.data;
};

export const getReportPdfUrl = (filters = {}) => {
  const params = buildParams(filters);
  return `${API_BASE_URL}/reports/download/pdf?${params.toString()}`;
};

export const getReportCsvUrl = (filters = {}) => {
  const params = buildParams(filters);
  return `${API_BASE_URL}/reports/download/csv?${params.toString()}`;
};

export const fetchAwsStatus = async () => {
  const response = await apiClient.get('/aws/status');
  return response.data;
};

export const testAwsConnection = async (configPayload) => {
  const response = await apiClient.post('/aws/test-connection', configPayload);
  return response.data;
};

export const saveAwsConfig = async (configPayload) => {
  const response = await apiClient.post('/aws/save-config', configPayload);
  return response.data;
};

export const clearBackendCache = async () => {
  const response = await apiClient.post('/aws/cache/clear');
  return response.data;
};

export const switchDataSourceMode = async (mode) => {
  const response = await apiClient.post('/aws/mode', { mode });
  return response.data;
};

export const fetchHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
