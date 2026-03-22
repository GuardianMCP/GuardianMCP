import type { User } from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
