import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocation, addLocationListener } from '../utils/browser';

/**
 * Custom hook for managing browser location state
 */
export const useLocationState = () => {
  const [location, setLocation] = useState(() => getCurrentLocation());

  const updateLocation = useCallback(() => {
    setLocation(getCurrentLocation());
  }, []);

  useEffect(() => {
    const unsubscribe = addLocationListener(updateLocation);
    return unsubscribe;
  }, [updateLocation]);

  return {
    pathname: location.pathname,
    search: location.search
  };
};
