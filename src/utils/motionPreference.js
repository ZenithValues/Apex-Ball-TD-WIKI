import { normalizeAnimSpeed } from './uxSettings';

// A visitor's operating-system and in-site motion choices both take precedence
// over automatic animation. A particular carousel can offer an explicit Play
// button without silently changing these global preferences.
export function motionIsAllowed(settings = {}, systemReduced = false) {
  return !systemReduced && settings.reducedMotion !== true && normalizeAnimSpeed(settings.animSpeed) > 0;
}
