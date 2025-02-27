import { useState, useEffect, CSSProperties, useLayoutEffect, ReactNode, useCallback, useRef } from 'react';

import { useTheme } from '@mui/material/styles';
import { Slider as MaterialSlider } from '@mui/material';
import { Mark } from '@mui/base';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './slider-style';
import { generateId } from '@/core/utils/utilities';

/**
 * Properties for the Slider
 */
type SliderProps = {
  sliderId?: string;

  // Important props: min, max, value
  min: number;
  max: number;
  value: Array<number> | number;

  // custom slider classes and styles
  className?: string;
  style?: CSSProperties;

  // custom onChange callback
  onChange?: (value: number | number[], activeThumb: number) => void;
  onChangeCommitted?: (value: number | number[]) => void;
  onValueLabelFormat?: (value: number, index: number) => string;
  onValueDisplayAriaLabel?: (value: number, index: number) => string;

  // MUI optional props
  disabled?: boolean;
  marks?: Mark[];
  orientation?: 'vertical' | 'horizontal';
  step?: number | null;
  size?: 'small' | 'medium';
  track?: 'inverted' | 'normal' | false;
  ariaLabelledby?: string;
  valueLabelFormat?: string | ((value: number, index: number) => ReactNode);
  valueLabelDisplay?: 'auto' | 'on';

  // optional map id to link the slider to
  // TODO: Refactor - No mapId inside a ui component in ui folder.
  mapId?: string;
};

/**
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
export function Slider(props: SliderProps): JSX.Element {
  const {
    value: parentValue,
    min,
    max,
    marks,
    valueLabelDisplay,
    onChange,
    onChangeCommitted,
    onValueLabelFormat,
    onValueDisplayAriaLabel,
    ...properties
  } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const sliderRef = useRef<HTMLDivElement>(null);

  const containerId = `${properties.mapId}-${properties?.sliderId ?? generateId()}` || '';
  const valueLabelDisplayOption = valueLabelDisplay === undefined ? 'on' : 'auto';

  // internal state
  const [value, setValue] = useState<number[] | number>(parentValue);
  const [activeThumb, setActiveThumb] = useState<number>(-1);

  // If spreading the label using an offset
  if (Array.isArray(value) && value.length >= 2 && (!properties.orientation || properties.orientation === 'horizontal')) {
    // Dynamically add a class name to the className properties
    properties.className = properties.className ? `${properties.className} MuiSlider-labelSpread` : 'MuiSlider-labelSpread';
  }

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], newActiveThumb: number): void => {
    // Update the internal state
    setActiveThumb(newActiveThumb);
    setValue(newValue);
    event.preventDefault();

    // Callback
    onChange?.(newValue, activeThumb);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]): void => {
    // Callback
    onChangeCommitted?.(newValue);
  };

  // Focus on slider handle
  const focusSlider = useCallback(() => {
    if (sliderRef.current) {
      // Find the hidden input element and focus it
      const input = sliderRef.current.querySelectorAll('input[type="range"]');
      if (input[0]) {
        (input[0] as HTMLElement).focus();
      }
    }
  }, []);

  // GV There is a bug with focus on slider element. When the arrow key is pressed, the event trigger value change
  // GV for the slider then the slider value is updated. This causes the slider to lose focus.
  // GV The solution is to manually focus the slider element when the arrow key is pressed.
  // GV This is a workaround until the issue is fixed in the Material UI library.
  // GV When there is 2 handles, the focus on the second handle is lost and the focus is back to first handle
  // TODO: https://github.com/Canadian-Geospatial-Platform/geoview/issues/2560
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        focusSlider();
      }
    },
    [focusSlider]
  );

  useEffect(() => {
    // Focus the slider when the component mounts
    focusSlider();
  }, [focusSlider]);

  /**
   * Checks if two HTML elements overlap, considering the slider's orientation and adding padding.
   *
   * @param {HTMLElement} el1 - The first element to check for overlap.
   * @param {HTMLElement} el2 - The second element to check for overlap.
   * @param {string} [orientation='horizontal'] - The orientation of the slider ('horizontal' or 'vertical').
   * @returns {boolean} True if the elements overlap, false otherwise.
   */
  const checkOverlap = useCallback((el1: HTMLElement, el2: HTMLElement, orientation: string): boolean => {
    if (!el1 || !el2) return false;
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const padding = 50;

    return orientation === 'vertical'
      ? !(rect1.bottom + padding < rect2.top || rect1.top > rect2.bottom + padding)
      : !(rect1.right + padding < rect2.left || rect1.left > rect2.right + padding);
  }, []);

  /**
   * Removes overlapping labels in a slider component.
   *
   * @description
   * This function identifies and hides overlapping labels in a slider component.
   * It works for both horizontal and vertical sliders, starting from both ends
   * and moving towards the center. The function ensures that the maximum number
   * of labels are visible without overlap.
   *
   * The process includes:
   * 1. Identifying the slider container and its orientation.
   * 2. Resetting all labels to visible state.
   * 3. Iterating through labels from both ends, hiding those that overlap.
   * 4. Special handling for the middle label in case of an odd number of labels.
   *
   * @see checkOverlap - The helper function used to determine if two labels overlap.
   */
  const removeLabelOverlap = useCallback((): void => {
    // Log
    logger.logTraceCore('UI.SLIDER - removeLabelOverlap');

    // get slider container
    const container = document.getElementById(containerId);
    if (!container) return;

    // get slider labels
    const markers = container.getElementsByClassName('MuiSlider-markLabel');
    const markerArray = Array.from(markers) as HTMLElement[];

    // Get orientation from the container
    const orientation = container.classList.contains('MuiSlider-vertical') ? 'vertical' : 'horizontal';

    // Reset all labels
    markerArray.forEach((marker) => marker.classList.remove('MuiSlider-markLabel-overlap'));

    let left = 0;
    let right = markerArray.length - 1;
    let lastVisibleLeft = 0;
    let lastVisibleRight = markerArray.length - 1;

    while (left < right) {
      // Check from left
      if (left === 0 || !checkOverlap(markerArray[lastVisibleLeft], markerArray[left], orientation)) {
        lastVisibleLeft = left;
      } else {
        markerArray[left].classList.add('MuiSlider-markLabel-overlap');
      }

      // Check from right
      if (right === markerArray.length - 1 || !checkOverlap(markerArray[right], markerArray[lastVisibleRight], orientation)) {
        lastVisibleRight = right;
      } else {
        markerArray[right].classList.add('MuiSlider-markLabel-overlap');
      }

      left++;
      right--;
    }

    // Handle middle element if odd number of markers
    // TODO: there is still issue when previous to middle interfere with lst in Ontario ring of fire (time slider config- small screen)
    if (left === right) {
      const middleElement = markerArray[left];
      const overlapWithLeft = checkOverlap(markerArray[lastVisibleLeft], middleElement, orientation);
      const overlapWithRight = checkOverlap(middleElement, markerArray[lastVisibleRight], orientation);

      if (!overlapWithLeft && !overlapWithRight) {
        lastVisibleLeft = left;
      } else {
        middleElement.classList.add('MuiSlider-markLabel-overlap');
      }
    }
  }, [checkOverlap, containerId]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.SLIDER - parent value', parentValue);

    // Update it internally when the parent has updated the value
    setValue(parentValue);
  }, [parentValue]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.SLIDER - window resize');

    window.addEventListener('resize', removeLabelOverlap);

    return () => {
      window.removeEventListener('resize', removeLabelOverlap);
    };
  }, [removeLabelOverlap]);

  // Add this new effect to handle slider value changes
  useLayoutEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.SLIDER - remove overlap on value change');

    removeLabelOverlap();
  }, [value, removeLabelOverlap]);

  return (
    <MaterialSlider
      {...properties}
      id={containerId}
      sx={sxClasses.slider}
      ref={sliderRef}
      value={value}
      min={min}
      max={max}
      marks={marks}
      disableSwap
      valueLabelDisplay={valueLabelDisplayOption}
      valueLabelFormat={onValueLabelFormat}
      getAriaLabel={(): string => 'To implement with translation'}
      getAriaValueText={onValueDisplayAriaLabel}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      onKeyDown={handleKeyDown}
    />
  );
}
