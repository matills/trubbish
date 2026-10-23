/**
 * Movimiento reducido = preferencia del sistema o el interruptor de Ajustes
 * (que se refleja en <html data-motion>). Se lee en el momento de animar, así
 * los átomos no dependen de ningún store.
 */
export function isReducedMotion(): boolean {
  if (typeof document === 'undefined') return true
  if (document.documentElement.dataset['motion'] === 'reduced') return true
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
