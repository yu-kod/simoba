/** Camera-zoom-independent UI sizing utility for all off-field UI components. */
export function createUiScale(cameraZoom: number) {
  return {
    /** Convert intended pixel size to zoom-corrected actual value */
    size: (intended: number) => intended / cameraZoom,
    /** Convert intended font size to zoom-corrected CSS string (e.g. '12px') */
    fontSize: (intended: number) => `${intended / cameraZoom}px`,
    /** Current zoom value */
    zoom: cameraZoom,
  }
}

export type UiScale = ReturnType<typeof createUiScale>
