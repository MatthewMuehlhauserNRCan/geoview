import { memo, useState, ReactNode, useMemo, useCallback } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { TypeGuideObject, useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './guide-style';
import { LayerListEntry, Layout } from '@/core/components/common';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TABS } from '@/core/utils/constant';

interface GuideListItem extends LayerListEntry {
  content: string | ReactNode;
}

interface GuideType {
  fullWidth?: boolean;
}

/**
 * Guide component to display help content
 *
 * @returns {JSX.Element} the guide (help) component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Guide = memo(function GuidePanel({ fullWidth }: GuideType): JSX.Element {
  logger.logTraceRender('components/guide/guide');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('navigationControls');
  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);

  // Store
  const guide = useAppGuide();
  const mapId = useGeoViewMapId();

  // Calbacks & Memoize values
  /**
   * Creates a markdown component with the given content
   */
  const createMarkdownComponent = useCallback((content: string) => <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>, []);

  /**
   * Get Layer list with markdown content.
   */
  const getListOfGuides = useCallback((): GuideListItem[] => {
    logger.logTraceUseCallback('GUIDE - getListOfGuides');

    if (!guide) return [];

    return Object.keys(guide).map((item: string) => {
      let { content } = guide[item];

      // Appends the subsection content to the section content
      if (guide[item].children) {
        Object.entries(guide[item].children as TypeGuideObject).forEach(([, child]) => {
          content += `\n${child.content}`;

          // Appends sub subsection content
          if (child.children) {
            Object.values(child.children).forEach((grandChild) => {
              content += `\n${grandChild.content}`;
            });
          }
        });
      }

      return {
        layerName: guide[item].heading,
        layerPath: item,
        layerStatus: 'loaded',
        queryStatus: 'processed',
        content: createMarkdownComponent(content),
        layerUniqueId: `${mapId}-${TABS.GUIDE}-${item ?? ''}`,
      };
    });
  }, [guide, mapId, createMarkdownComponent]);

  /**
   * Memo version of layer list with markdown content
   */
  const layersList = useMemo(() => getListOfGuides(), [getListOfGuides]);

  /**
   * Handle Guide layer list.
   * @param {LayerListEntry} layer geoview layer.
   */
  const handleGuideItemClick = useCallback(
    (layer: LayerListEntry): void => {
      logger.logTraceUseCallback('GUIDE - handleGuideItemClick', layer);

      const index: number = layersList.findIndex((item) => item.layerName === layer.layerName);
      setGuideItemIndex(index);
      setSelectedLayerPath(layer.layerPath);
    },
    [layersList]
  );

  const ariaLabel = t('guide.title');
  return (
    <Box sx={sxClasses.guideContainer}>
      <Layout
        selectedLayerPath={selectedLayerPath || ''}
        layerList={layersList}
        onLayerListClicked={handleGuideItemClick}
        fullWidth={fullWidth}
        aria-label={ariaLabel}
      >
        <Box sx={sxClasses.rightPanelContainer} aria-label={ariaLabel} className="guidebox-container">
          <Box className="guideBox">{layersList[guideItemIndex]?.content}</Box>
        </Box>
      </Layout>
    </Box>
  );
});
