
import { onMounted, onUnmounted, ref } from 'vue';
import { AntiDevtools, AntiDevtoolsConfig } from '../core/devtools';

export interface UseAntiDevtoolsOptions extends AntiDevtoolsConfig { }

export function useAntiDevtools(options: UseAntiDevtoolsOptions = {}) {
    const devtoolsInstance = ref<AntiDevtools | null>(null);

    onMounted(() => {
        devtoolsInstance.value = new AntiDevtools(options);
    });

    onUnmounted(() => {
        if (devtoolsInstance.value) {
            devtoolsInstance.value.destroy();
            devtoolsInstance.value = null;
        }
    });

    return {
        devtoolsInstance
    };
}
