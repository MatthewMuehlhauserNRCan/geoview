import { memo, useCallback, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { ArrowUpIcon, IconButton } from '@/ui';

import { useMapRotation, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

/**
 * Map Information Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const MapInfoRotationButton = memo(function MapInfoRotationButton(): JSX.Element {
  logger.logTraceRender('components/map-info/map-info-rotation-button');

  // Hooks
  const theme = useTheme();

  // State
  const iconRef = useRef(null);

  // Store
  const mapRotation = useMapRotation();
  const { setRotation } = useMapStoreActions();

  const buttonStyles = {
    width: '30px',
    height: '30px',
    my: '1rem',
    color: theme.palette.geoViewColor.bgColor.light[800],
  };
  const iconStyles = {
    transform: `rotate(${mapRotation}rad)`,
    transition: 'transform 0.3s ease-in-out',
  };

  // Callbacks
  const handleRotationReset = useCallback(
    (): void => {
      setRotation(0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // State setters are stable, no need for dependencies
  );

  return (
    <IconButton
      tooltipPlacement="top"
      tooltip="mapctrl.rotation.resetRotation"
      aria-label="mapctrl.rotation.resetRotation"
      onClick={handleRotationReset}
      sx={buttonStyles}
    >
      <ArrowUpIcon ref={iconRef} style={iconStyles} />
    </IconButton>
  );
});
