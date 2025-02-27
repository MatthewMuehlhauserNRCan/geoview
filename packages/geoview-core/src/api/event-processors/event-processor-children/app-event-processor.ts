import { TypeDisplayLanguage, TypeDisplayTheme } from '@config/types/map-schema-types';
import { IAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { NotificationDetailsType } from '@/core/components';
import { TypeHTMLElement } from '@/core/types/global-types';
import { createGuideObject } from '@/core/utils/utilities';
import { MapViewer } from '@/geo/map/map-viewer';
import { MapEventProcessor } from './map-event-processor';
import { SnackbarType } from '@/core/utils/notifications';
import { logger } from '@/core/utils/logger';
import { api } from '@/app';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class AppEventProcessor extends AbstractEventProcessor {
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  /**
   * Shortcut to get the App state for a given map id
   * @param {string} mapId The mapId
   * @returns {IAppState} The App state.
   */
  protected static getAppState(mapId: string): IAppState {
    // Return the app state
    return super.getState(mapId).appState;
  }

  /**
   * Shortcut to get the App state for a given map id
   * @param {string} mapId - The mapId
   * @returns {IAppState} The App state.
   */
  protected static async getAppStateAsync(mapId: string): Promise<IAppState> {
    // Return the app state
    return (await super.getStateAsync(mapId)).appState;
  }

  /**
   * Shortcut to get the display language for a given map id
   * @param {string} mapId - The mapId
   * @returns {TypeDisplayLanguage} The display language.
   */
  static getDisplayLanguage(mapId: string): TypeDisplayLanguage {
    return this.getAppState(mapId).displayLanguage;
  }

  /**
   * Shortcut to get the display theme for a given map id
   * @param {string} mapId - The mapId
   * @returns {TypeDisplayTheme} The display theme.
   */
  static getDisplayTheme(mapId: string): TypeDisplayTheme {
    return this.getAppState(mapId).displayTheme;
  }

  /**
   * Adds a snackbar message.
   * @param {SnackbarType} type - The type of message.
   * @param {string} message - The message.
   * @param {string} param - Optional param to replace in the string if it is a key
   */
  static addMessage(mapId: string, type: SnackbarType, message: string, param?: string[]): void {
    switch (type) {
      case 'info':
        api.maps[mapId].notifications.showMessage(message, param, false);
        break;
      case 'success':
        api.maps[mapId].notifications.showSuccess(message, param, false);
        break;
      case 'warning':
        api.maps[mapId].notifications.showWarning(message, param, false);
        break;
      case 'error':
        api.maps[mapId].notifications.showError(message, param, false);
        break;
      default:
        break;
    }
  }

  static async addNotification(mapId: string, notif: NotificationDetailsType): Promise<void> {
    // because notification is called before map is created, we use the async
    // version of getAppStateAsync
    const appState = await this.getAppStateAsync(mapId);
    const curNotifications = appState.notifications;
    // if the notification already exist, we increment the count
    const existingNotif = curNotifications.find(
      (item) => item.message === notif.message && item.notificationType === notif.notificationType
    );

    if (!existingNotif) {
      curNotifications.push({ key: notif.key, notificationType: notif.notificationType, message: notif.message, count: 1 });
    } else {
      existingNotif.count += 1;
    }

    this.getAppState(mapId).setterActions.setNotifications(curNotifications);
  }

  static removeNotification(mapId: string, key: string): void {
    // filter out notification
    const notifications = this.getAppState(mapId).notifications.filter((item: NotificationDetailsType) => item.key !== key);
    this.getAppState(mapId).setterActions.setNotifications(notifications);
  }

  static removeAllNotifications(mapId: string): void {
    this.getAppState(mapId).setterActions.setNotifications([]);
  }

  static setAppIsCrosshairActive(mapId: string, isActive: boolean): void {
    this.getAppState(mapId).setterActions.setCrosshairActive(isActive);
  }

  static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): Promise<[void, void]> {
    this.getAppState(mapId).setterActions.setDisplayLanguage(lang);
    // reload the basemap from new language
    const promiseResetBasemap = MapEventProcessor.resetBasemap(mapId);
    // load guide in new language
    const promiseSetGuide = AppEventProcessor.setGuide(mapId);
    // Return promise of both promises to resolve
    return Promise.all([promiseResetBasemap, promiseSetGuide]);
  }

  static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void {
    this.getAppState(mapId).setterActions.setDisplayTheme(theme);
  }

  static setFullscreen(mapId: string, active: boolean, element?: TypeHTMLElement): void {
    this.getAppState(mapId).setterActions.setFullScreenActive(active);
    if (element !== undefined) MapViewer.setFullscreen(active, element);
  }

  static setCircularProgress(mapId: string, active: boolean): void {
    this.getAppState(mapId).setterActions.setCircularProgress(active);
  }

  /**
   * Process the guide .md file and add the object to the store.
   * @param {string} mapId - ID of map to create guide object for.
   */
  static async setGuide(mapId: string): Promise<void> {
    // Start guide loading tracker
    logger.logMarkerStart('map-guide');

    const language = AppEventProcessor.getDisplayLanguage(mapId);
    const guide = await createGuideObject(mapId, language, this.getAppState(mapId).geoviewAssetsURL);
    if (guide !== undefined) this.getAppState(mapId).setterActions.setGuide(guide);

    // Check guide loading tracker
    logger.logMarkerCheck('map-guide', 'for guide to be loaded');
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
