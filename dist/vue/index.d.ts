import * as vue from 'vue';
import { AntiDevtoolsConfig, AntiDevtools } from '../index.js';

interface UseAntiDevtoolsOptions extends AntiDevtoolsConfig {
}
declare function useAntiDevtools(options?: UseAntiDevtoolsOptions): {
    devtoolsInstance: vue.Ref<{
        init: () => void;
        destroy: () => void;
    } | null, AntiDevtools | {
        init: () => void;
        destroy: () => void;
    } | null>;
};

export { type UseAntiDevtoolsOptions, useAntiDevtools };
