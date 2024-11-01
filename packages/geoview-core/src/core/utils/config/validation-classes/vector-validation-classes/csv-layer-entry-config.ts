import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { CONST_LAYER_ENTRY_TYPES } from '@/geo/map/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class CsvLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceCSVInitialConfig;

  // character separating values in csv file
  valueSeparator? = ',';

  /**
   * The class constructor.
   * @param {CsvLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: CsvLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type CSV when the metadataAccessPath is undefined.`
      );
    }
    // Default value for this.entryType is vector
    if (this.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the CSV layer to it
    // and place the layerId at the end of it.
    // Value for this.source.format can only be CSV.
    if (!this.source) this.source = { format: 'CSV', separator: ',' };
    if (!this.source.format) this.source.format = 'CSV';
    if (!this.source.separator) this.source.separator = ',';
    if (!this.source.dataAccessPath) {
      let accessPath = this.geoviewLayerConfig.metadataAccessPath!;
      accessPath = accessPath!.split('/').length > 1 ? accessPath!.split('/').slice(0, -1).join('/') : './';
      this.source.dataAccessPath = accessPath;
    }
    if (
      !(this.source.dataAccessPath!.startsWith('blob') && !this.source.dataAccessPath!.endsWith('/')) &&
      !this.source.dataAccessPath!.toUpperCase().endsWith('.CSV')
    ) {
      this.source.dataAccessPath! = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath!}${this.layerId}`
        : `${this.source.dataAccessPath!}/${this.layerId}`;
    }
    if (!this.source.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LNGLAT;
  }
}
