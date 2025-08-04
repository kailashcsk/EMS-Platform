import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import APIService from '../services/api';

export const useAPI = () => {
  const { getAuthToken } = useAuth();
  
  return useMemo(() => new APIService(getAuthToken), [getAuthToken]);
};