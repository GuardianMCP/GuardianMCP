export const API_URL = '/api/v1';

export const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  INFO: '#6b7280',
};

export const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  INFO: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const SCORE_COLORS = {
  good: '#22c55e',
  warn: '#eab308',
  bad: '#ef4444',
};
