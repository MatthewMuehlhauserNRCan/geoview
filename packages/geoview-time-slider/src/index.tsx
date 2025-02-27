import { TypeJsonObject, toJsonObject, Cast, AnySchemaObject } from 'geoview-core/src/core/types/global-types';
import { TimeDimension, DateMgt } from 'geoview-core/src/core/utils/date-mgt';
import { TypeTabs } from 'geoview-core/src/ui/tabs/tabs';
import { TimeSliderIcon } from 'geoview-core/src/ui';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';
import { TimeSliderEventProcessor } from 'geoview-core/src/api/event-processors/event-processor-children/time-slider-event-processor';

import { TimeSliderPanel } from './time-slider-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-time-slider-panel.json';
import { SliderProps } from './time-slider-types';

export interface SliderFilterProps {
  title: string;
  description: string;
  range: string[];
  defaultValue: string;
  minAndMax: number[];
  field: string;
  singleHandle: boolean;
  values: number[];
  filtering: boolean;
  delay: number;
  locked: boolean;
  reversed: boolean;
}

/**
 * Time slider plugin
 */
class TimeSliderPlugin extends FooterPlugin {
  /**
   * Return the schema that is defined for this package
   *
   * @returns {AnySchemaObject} returns the schema for this package
   */
  override schema(): AnySchemaObject {
    return schema;
  }

  /**
   * Return the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  override defaultConfig(): TypeJsonObject {
    return toJsonObject(defaultConfig);
  }

  /**
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      timeSlider: {
        title: 'Time Slider',
        panel: {
          noLayers: 'No layers with temporal data',
        },
        slider: {
          unlockRight: 'Unlock right handle',
          unlockLeft: 'Unlock left handle',
          lockRight: 'Lock right handle',
          lockLeft: 'Lock left handle',
          disableFilter: 'Disable Filtering',
          enableFilter: 'Enable Filtering',
          pauseAnimation: 'Pause animation',
          playAnimation: 'Play animation',
          back: 'Back',
          forward: 'Forward',
          changeDirection: 'Change animation direction',
          timeDelay: 'Animation delay',
          stepValue: 'Step value',
          hour: 'Hour',
          day: 'Day',
          week: 'Week',
          month: 'Month',
          year: 'Year',
          temporalField: 'Temporal Field: ',
        },
      },
    },
    fr: {
      timeSlider: {
        title: 'Curseur Temporel',
        panel: {
          noLayers: 'Pas de couches avec des données temporelles',
        },
        slider: {
          unlockRight: 'Déverrouiller la poignée droite',
          unlockLeft: 'Déverrouiller la poignée gauche',
          lockRight: 'Verrouiller la poignée droite',
          lockLeft: 'Verrouiller la poignée gauche',
          disableFilter: 'Désactiver le filtrage',
          enableFilter: 'Activer le filtrage',
          pauseAnimation: `Pause de l'animation`,
          playAnimation: `Jouer l'animation`,
          back: 'Retour',
          forward: 'En avant',
          changeDirection: `Changer la direction de l'animation`,
          timeDelay: `Délai d'animation`,
          stepValue: 'Valeur du saut',
          hour: 'Heure',
          day: 'Jour',
          week: 'Semaine',
          month: 'Mois',
          year: 'Année',
          temporalField: 'Champ temporel: ',
        },
      },
    },
  });

  /**
   * Overrides the creation of the content properties of this TimeSlider Footer Plugin.
   * @returns {TypeTabs} The TypeTabs for the TimeSlider Footer Plugin
   */
  override onCreateContentProps(): TypeTabs {
    // Set custom time dimension if applicable
    this.configObj.sliders.forEach((obj: SliderProps) => {
      if (obj.temporalDimension) {
        const timeDimension: TimeDimension = {
          field: obj.temporalDimension.field,
          default: obj.temporalDimension.default,
          unitSymbol: obj.temporalDimension.unitSymbol,
          nearestValues: obj.temporalDimension.nearestValues,
          range: DateMgt.createRangeOGC(obj.temporalDimension.range as unknown as string),
          singleHandle: obj.temporalDimension.singleHandle,
          displayPattern: obj.temporalDimension.displayPattern,
        };

        // TODO: Check concurrency between plugin creation and setting temporal dimensions
        // TO.DOCONT: I doubt that this (and few lines below) is a good place to set the temporal dimension on layers that might be
        // TO.DOCONT: loading their metadata (and setting their own temporal dimension) at the same time as the plugin gets created.
        // TO.DOCONT: Whichever call comes last will be overriding the setTemporalDimension set by the other concurrent task.
        // TO.DOCONT: Fortunately, the time-slider plugin gets initialized 'late' as it's currently part of a footer, so they, most of the time,
        // TO.DOCONT: always overwrite the config from the layer metadata which is probably what we want here.
        // TP.DOCONT: It's risky, because if the Plugin gets created before the layer metadata is fully fetched and read,
        // TO.DOCONT: the later will override the plugin settings (can be tested by adding fake delays).
        // TO.DOCONT: If this Plugin has temporal dimension settings, for various layers, those should be set in synch with the layers
        // TO.DOCONT: using event listeners, not at Plugin creation.
        this.mapViewer().layer.getGeoviewLayerHybrid(obj.layerPaths[0])?.setTemporalDimension(obj.layerPaths[0], timeDimension);
      }

      // Set override default value under time dimension if applicable
      if (obj.defaultValue) {
        const layerPath = obj.layerPaths[0];
        const timeDimension = this.mapViewer().layer.getGeoviewLayerHybrid(layerPath)?.getTemporalDimension(layerPath);

        if (timeDimension) {
          this.mapViewer()
            .layer.getGeoviewLayerHybrid(layerPath)
            ?.setTemporalDimension(layerPath, {
              ...timeDimension,
              default: obj.defaultValue,
            });
        }
      }
    });

    return {
      id: 'time-slider',
      value: this.value!,
      label: 'timeSlider.title',
      icon: <TimeSliderIcon />,
      content: <TimeSliderPanel mapId={this.pluginProps.mapId} configObj={this.configObj} />,
    };
  }

  /**
   * Overrides the addition of the TimeSlider Footer Plugin to make sure to set the time slider configs in the store and apply filters.
   */
  override onAdd(): void {
    // If map layers are all 'loaded' already
    if (this.mapViewer().mapLayersLoaded) {
      // Layers are already 'loaded', initialize the time slider plugin
      this.initTimeSliderPlugin();
    } else {
      // Wait for the layers to be 'loaded' so that their 'layerTemporalDimension' information is set ('techhnically, it's 'processed', but putting 'loaded' to better support layers migration)
      this.mapViewer().onMapLayersLoaded(() => {
        // Initialize the time slider plugin once all layers are 'loaded'
        this.initTimeSliderPlugin();
      });
    }

    // Call parent
    super.onAdd();
  }

  /**
   * Initializes the Time Slider Plugin once the layers are all 'processed'.
   */
  initTimeSliderPlugin(): void {
    // Now the layerTemporalDimension should be good on the layers
    const orderedLayerPaths = this.mapViewer().layer.getLayerEntryConfigIds();
    const initialTimeSliderLayerPaths = this.#filterTimeSliderLayers(orderedLayerPaths);
    if (initialTimeSliderLayerPaths) {
      initialTimeSliderLayerPaths.forEach((layerPath) => {
        // Get the config
        const layerConfig = this.mapViewer().layer.getLayerEntryConfig(layerPath);

        // Check and add time slider layer when needed
        TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.pluginProps.mapId, layerConfig);
      });
    }
  }

  /**
   * Filters an array of legend layers to get usable time slider layer paths
   *
   * @param {string} mapId The id of the map
   * @param {TypeLegendLayer[]} legendLayers Array of legend layers to filter
   * @returns {string[]} A list of usable layer paths
   * @private
   */
  #filterTimeSliderLayers(layerPaths: string[]): string[] {
    const filteredLayerPaths = layerPaths.filter((layerPath) => {
      // Return the temporal dimension for the layer if any
      return this.mapViewer().layer.getGeoviewLayerHybrid(layerPath)?.getTemporalDimension(layerPath);
    });
    return filteredLayerPaths;
  }
}

export default TimeSliderPlugin;

// Keep a reference to the Time Slider Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['time-slider'] = Cast<TimeSliderPlugin>(TimeSliderPlugin);
