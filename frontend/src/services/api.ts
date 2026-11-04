import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export interface OverviewStats {
  total_games: number;
  total_global_sales: number;
  avg_sales: number;
  num_platforms: number;
  num_genres: number;
  num_publishers: number;
  year_range: [number, number];
  has_ratings: boolean;
}

export interface Game {
  Name: string;
  Platform: string;
  Genre: string;
  Publisher: string;
  Year: number;
  Global_Sales: number;
  NA_Sales?: number;
  EU_Sales?: number;
  JP_Sales?: number;
  Other_Sales?: number;
  Critic_Score?: number;
  User_Score?: number;
  Developer?: string;
  Rating?: string;
}

export interface PredictionResult {
  input: { genre: string; platform: string; publisher: string; year: number };
  predictions: {
    NA_Sales?: number;
    EU_Sales?: number;
    JP_Sales?: number;
    Other_Sales?: number;
    Global_Sales?: number;
    _regional_sum?: number;
    _discrepancy_note?: string;
  };
  disclaimer: string;
}

export interface ScenarioPrediction {
  label: string;
  input: { genre: string; platform: string; publisher: string; year: number };
  predictions: PredictionResult['predictions'] | null;
  error?: string[];
}

// Health
export const checkHealth = () => api.get('/health');

// Overview
export const fetchOverview = () => api.get('/overview');

// Market
export const fetchGenres = (params?: Record<string, string>) => api.get('/market/genres', { params });
export const fetchPlatforms = (params?: Record<string, string>) => api.get('/market/platforms', { params });
export const fetchRegions = (params?: Record<string, string>) => api.get('/market/regions', { params });
export const fetchTrends = (params?: Record<string, string>) => api.get('/market/trends', { params });
export const fetchInsights = (params?: Record<string, string>) => api.get('/market/insights', { params });
export const fetchFilterOptions = () => api.get('/market/filters');

// Games
export const fetchGames = (params?: Record<string, string | number>) => api.get('/games', { params });
export const compareGames = (names: string[]) => api.get('/games/compare', { params: { names } });

// Simulator
export const fetchSimulatorOptions = () => api.get('/simulator/options');
export const predictSales = (data: { genre: string; platform: string; publisher: string; year: number }) =>
  api.post('/simulator/predict', data);
export const compareScenarios = (scenarios: Array<{ genre: string; platform: string; publisher: string; year: number; label: string }>) =>
  api.post('/simulator/compare', { scenarios });

// Model
export const fetchModelMetrics = () => api.get('/model/metrics');
export const fetchFeatureImportance = () => api.get('/model/feature-importance');

// Recommendations
export const fetchRecommendations = (params?: { genre?: string; platform?: string }) =>
  api.get('/recommendations', { params });

export default api;

