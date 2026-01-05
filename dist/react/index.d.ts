import { AntiDevtoolsConfig } from '../index.js';

interface UseAntiDevtoolsOptions extends AntiDevtoolsConfig {
}
declare function useAntiDevtools(options?: UseAntiDevtoolsOptions): void;

export { type UseAntiDevtoolsOptions, useAntiDevtools };
