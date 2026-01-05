import { AntiDevtoolsConfig } from '../index.mjs';

interface UseAntiDevtoolsOptions extends AntiDevtoolsConfig {
}
declare function useAntiDevtools(options?: UseAntiDevtoolsOptions): void;

export { type UseAntiDevtoolsOptions, useAntiDevtools };
