/**
 * Shared "team member" avatar color logic.
 *
 * A user's `avatar_color` is persisted in the database at creation (see
 * backend `App\Models\User::AVATAR_COLOR_POOL`), so the same person renders
 * with the same avatar everywhere in the app — rather than each page
 * deriving a look from its own local color array + name, which drifts as
 * soon as two pages define slightly different arrays.
 */

const FALLBACK_AVATAR_COLORS = ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Builds the 5-color gradient boring-avatars' "beam" variant expects from a
 * single persisted accent color, by varying lightness around it. The same
 * input hex always produces the same array.
 */
export function getUserAvatarColors(color?: string | null): string[] {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return FALLBACK_AVATAR_COLORS;
  }
  const [h, s, l] = hexToHsl(color);
  const clamp = (v: number) => Math.min(0.92, Math.max(0.12, v));
  return [-0.22, -0.1, 0, 0.14, 0.28].map((delta) => hslToHex(h, s, clamp(l + delta)));
}

export function avatarColorsFor(user?: { avatar_color?: string | null } | null): string[] {
  return getUserAvatarColors(user?.avatar_color);
}
