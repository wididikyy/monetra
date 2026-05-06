import { useAppStore } from '@/store/use-app-store';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

export function useNetworkStatus() {
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const isOnline = useAppStore((s) => s.isOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    // Check immediately
    NetInfo.fetch().then((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    return unsubscribe;
  }, [setIsOnline]);

  return { isOnline };
}
