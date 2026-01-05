
import { useEffect, useRef } from 'react';
import { AntiDevtools, AntiDevtoolsConfig } from '../core/devtools';

export interface UseAntiDevtoolsOptions extends AntiDevtoolsConfig { }

export function useAntiDevtools(options: UseAntiDevtoolsOptions = {}) {
    const devtoolsRef = useRef<AntiDevtools | null>(null);

    useEffect(() => {
        // Initialize DevTools protection
        devtoolsRef.current = new AntiDevtools(options);

        return () => {
            // Cleanup
            if (devtoolsRef.current) {
                devtoolsRef.current.destroy();
                devtoolsRef.current = null;
            }
        };
    }, []); // Run once on mount
}
