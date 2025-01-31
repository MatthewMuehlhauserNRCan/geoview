import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDebounceValue } from '@/core/components/common/use-debounce-value';
import { TypeLegendLayer } from '@/core/components/layers/types';

export function useDebounceLayerLegendLayers(delay = 500): TypeLegendLayer[] {
  const legendLayers = useLayerLegendLayers();
  return useDebounceValue(legendLayers, delay);
}
