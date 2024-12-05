import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the layers right panel
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  categoryTitle: {
    textAlign: 'left',
    fontWeight: '600',
    fontSize: theme.palette.geoViewFontSize.lg,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  layerDetails: {
    padding: '20px',
    width: '100%',
  },
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsGrid: {
    width: '100%',
    '& .MuiGrid-container': {
      '&:first-of-type': {
        fontWeight: 'bold',
        borderTop: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`,
        borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`,
      },
      '& .MuiGrid-item': {
        padding: '3px 6px',

        '&:first-of-type': {
          width: '80px',
        },
        '&:nth-of-type(2)': {
          flexGrow: 1,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
      },
    },
  },
  tableIconLabel: {
    color: theme.palette.geoViewColor.textColor.main,
    fontSize: theme.palette.geoViewFontSize.default,
    marginLeft: 20,
    alignSelf: 'center',
    whiteSpace: 'nowrap',
  },
  wmsImage: {
    maxWidth: '100%',
    height: 'auto',
  },
});
