import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { IconButton, ZoomInIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

/**
 * Create a zoom in button
 *
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/zoom-in');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useMapZoom();
  const { setZoom } = useMapStoreActions();

  return (
    <IconButton
      id="zoomIn"
      tooltip={t('mapnav.zoomIn') as string}
      tooltipPlacement="left"
      onClick={() => setZoom(zoom + 0.5)}
      sx={sxClasses.navButton}
    >
      <ZoomInIcon />
    </IconButton>
  );
}
