import { useCallback, useMemo, useState, memo } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box, MoreHorizIcon, Popover, IconButton, Typography } from '@/ui';
import { useMapAttribution } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

// Constants outside component to prevent recreating every render
const POPOVER_POSITIONS = {
  anchorOrigin: {
    vertical: 'top' as const,
    horizontal: 'right' as const,
  },
  transformOrigin: {
    vertical: 'bottom' as const,
    horizontal: 'right' as const,
  },
} as const;

const BOX_STYLES = { padding: '1rem', width: '28.125rem' } as const;

const ICON_BUTTON_BASE_STYLES = {
  width: '30px',
  height: '30px',
  my: '1rem',
  margin: 'auto',
} as const;

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 *
 * @returns {JSX.Element} created attribution element
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Attribution = memo(function Attribution(): JSX.Element {
  // Log
  logger.logTraceRender('components/attribution/attribution');

  // Hooks
  const theme = useTheme();

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  // Store
  const mapAttribution = useMapAttribution();

  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  const buttonStyles = {
    ...ICON_BUTTON_BASE_STYLES,
    color: theme.palette.geoViewColor.bgColor.light[800],
  };

  // Memoize values
  const memoAttributionContent = useMemo(
    () => mapAttribution.map((attribution) => <Typography key={attribution}>{attribution}</Typography>),
    [mapAttribution]
  );

  // Callbacks
  // Popover state expand/collapse
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <>
      <IconButton
        id="attribution"
        onClick={handleOpenPopover}
        className={open ? 'active' : ''}
        tooltipPlacement="top"
        tooltip="mapctrl.attribution.tooltip"
        aria-label="mapctrl.attribution.tooltip"
        sx={buttonStyles}
      >
        <MoreHorizIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        container={mapElem}
        anchorOrigin={POPOVER_POSITIONS.anchorOrigin}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        onClose={handleClosePopover}
      >
        <Box sx={BOX_STYLES}>{memoAttributionContent}</Box>
      </Popover>
    </>
  );
});
