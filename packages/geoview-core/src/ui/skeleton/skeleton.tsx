import { Skeleton as MaterialSkeleton, SkeletonProps } from '@mui/material';

/**
 * Create a customized Material UI Skeleton component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton />
 *
 * // Text skeleton with specific dimensions
 * <Skeleton
 *   variant="text"
 *   width={200}
 *   height={20}
 * />
 *
 * // Circular skeleton
 * <Skeleton
 *   variant="circular"
 *   width={40}
 *   height={40}
 * />
 *
 * // Rectangular skeleton with animation
 * <Skeleton
 *   variant="rectangular"
 *   width="100%"
 *   height={118}
 *   animation="wave"
 * />
 * ```
 *
 * @param {SkeletonProps} props - All valid Material-UI Skeleton props
 * @returns {JSX.Element} The Skeleton component
 *
 * @see {@link https://mui.com/material-ui/react-skeleton/}
 */
function SkeletonUI(props: SkeletonProps): JSX.Element {
  return <MaterialSkeleton {...props} />;
}

export const Skeleton = SkeletonUI;
