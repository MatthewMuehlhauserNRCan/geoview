import { useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/';
import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useFooterPanelHeight } from '@/core/components/common';
import { CONTAINER_TYPE } from '@/core/utils/constant';

interface LegendType {
  fullWidth?: boolean;
  containerType?: 'appBar' | 'footerBar';
}

// Constant style outside of render (styles)
const styles = {
  noLayersContainer: {
    padding: '2rem',
    margin: '2rem',
    width: '100%',
    textAlign: 'center',
  },
  layerBox: {
    paddingRight: '0.65rem',
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
} as const;

// Constant style outside of render (responsive widths)
const responsiveWidths = {
  full: { xs: '100%' },
  responsive: {
    xs: '100%',
    sm: '50%',
    md: '33.33%',
    lg: '25%',
    xl: '25%',
  },
} as const;

export function Legend({ fullWidth, containerType = 'footerBar' }: LegendType): JSX.Element {
  logger.logTraceRender('components/legend/legend');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);
  const [formattedLegendLayerList, setFormattedLegendLayersList] = useState<TypeLegendLayer[][]>([]);

  // Store
  const mapId = useGeoViewMapId();
  const orderedLayerInfo = useMapOrderedLayerInfo();
  const layersList = useLayerLegendLayers();

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef } = useFooterPanelHeight({ footerPanelTab: 'legend' });

  // Memoize breakpoint values
  const breakpoints = useMemo(
    () => ({
      sm: theme.breakpoints.values.sm,
      md: theme.breakpoints.values.md,
      lg: theme.breakpoints.values.lg,
    }),
    [theme.breakpoints.values.sm, theme.breakpoints.values.md, theme.breakpoints.values.lg]
  );

  /**
   * Get the size of list based on window size.
   */
  const getLegendLayerListSize = useCallback(() => {
    if (containerType === CONTAINER_TYPE.APP_BAR) return 1;

    const { innerWidth } = window;
    if (innerWidth < breakpoints.sm) return 1;
    if (innerWidth < breakpoints.md) return 2;
    if (innerWidth < breakpoints.lg) return 3;
    return 4;
  }, [breakpoints, containerType]);

  /**
   * Transform the list of the legends into subsets of lists.
   * it will return subsets of lists with pattern:- [[0,4,8],[1,5,9],[2,6],[3,7] ]
   * This way we can layout the legends into column wraps.
   * @param {TypeLegendLayer} layers array of layers.
   * @returns List of array of layers
   */
  const updateLegendLayerListByWindowSize = useCallback(
    (layers: TypeLegendLayer[]): void => {
      const arrSize = getLegendLayerListSize();
      const list = Array.from({ length: arrSize }, () => []) as Array<TypeLegendLayer[]>;

      layers.forEach((layer, index) => {
        list[index % arrSize].push(layer);
      });

      setFormattedLegendLayersList(list);
    },
    [getLegendLayerListSize]
  );

  // Handle initial layer setup
  useEffect(() => {
    logger.logTraceUseEffect('LEGEND - layer setup', orderedLayerInfo.length, orderedLayerInfo, layersList);
    setLegendLayers(layersList);
    updateLegendLayerListByWindowSize(layersList);
  }, [orderedLayerInfo, layersList, updateLegendLayerListByWindowSize]);

  // Handle window resize
  useEffect(() => {
    logger.logTraceUseEffect('LEGEND - window resize', legendLayers);

    // update subsets of list when window size updated.
    const formatLegendLayerList = (): void => {
      logger.logTraceCore('LEGEND - window resize event');

      updateLegendLayerListByWindowSize(legendLayers);
    };
    window.addEventListener('resize', formatLegendLayerList);

    return () => window.removeEventListener('resize', formatLegendLayerList);
  }, [legendLayers, updateLegendLayerListByWindowSize]);

  // Memoize the rendered content based on whether there are legend layers
  const content = useMemo(() => {
    if (!legendLayers.length) {
      return (
        <Box sx={styles.noLayersContainer}>
          <Typography variant="h3" gutterBottom sx={sxClasses.legendInstructionsTitle}>
            {t('legend.noLayersAdded')}
          </Typography>
          <Typography component="p" sx={sxClasses.legendInstructionsBody}>
            {t('legend.noLayersAddedDescription')}
          </Typography>
        </Box>
      );
    }

    return formattedLegendLayerList.map((layers, idx) => (
      <Box key={`${idx.toString()}`} width={fullWidth ? responsiveWidths.full : responsiveWidths.responsive} sx={styles.layerBox}>
        {layers.map((layer) => (
          <LegendLayer layer={layer} key={layer.layerPath} />
        ))}
      </Box>
    ));
  }, [legendLayers, formattedLegendLayerList, fullWidth, sxClasses, t]);

  return (
    <Box sx={sxClasses.container} {...(!fullWidth && { ref: leftPanelRef })} id={`${mapId}-${containerType}-legendContainer`}>
      <Box sx={styles.flexContainer}>{content}</Box>
    </Box>
  );
}
