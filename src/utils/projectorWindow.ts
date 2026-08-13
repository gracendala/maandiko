/**
 * Utility to open dedicated Projector Windows (ProPresenter / OBS style)
 * Opens a clean, frameless pop-out window without browser tabs, address bars or margins.
 */
export function openProjectorWindow(screenId: string = 'audience'): Window | null {
  const url = `/projection?screen=${encodeURIComponent(screenId)}`;

  // Dimensions & window positioning for second screen
  const width = Math.min(window.screen.width || 1920, 1920);
  const height = Math.min(window.screen.height || 1080, 1080);

  let left = window.screen.width || 1920;
  let top = 0;

  if (window.screen && (window.screen as any).availLeft !== undefined && (window.screen as any).availLeft > 0) {
    left = (window.screen as any).availLeft;
  }

  const windowFeatures = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'popup=yes',
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'directories=no',
    'scrollbars=no',
    'resizable=yes'
  ].join(',');

  const windowName = `MaAndiko_Projector_${screenId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  let win: Window | null = null;
  try {
    win = window.open(url, windowName, windowFeatures);
  } catch (e) {
    console.warn("Pop-up direct opening prevented, attempting fallback...", e);
  }

  // Fallback if popup blocker or window.open failed
  if (!win) {
    win = window.open(url, '_blank');
  }

  if (win) {
    try {
      win.focus();
    } catch {
      // ignore focus restriction
    }
  }
  return win;
}
