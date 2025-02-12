// Diese Funktion wandelt eine Farbe von HSL (Hue, Saturation, Lightness) in RGB (Red, Green, Blue) um.
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Diese Funktion wandelt RGB-Werte in eine einzelne Ganzzahl um.
function rgbToNumber(r, g, b) {
  return (r << 16) + (g << 8) + b;
}

function generateColor() {
  // Generate a random hue between 15 and 60
  const minHue = 0;
  const maxHue = 360;
  const hue = Math.floor(Math.random() * (maxHue - minHue + 1)) + minHue;

  // Generate a random lightness between 40% and 60%
  const minLight = 30;
  const maxLight = 50;
  const lightness = Math.floor(Math.random() * (maxLight - minLight + 1)) + minLight;

  // Return the color as an HSL string
  // return `hsl(${hue}, 100%, ${lightness}%)`;
  const rgb = hslToRgb(hue / 360, 1, lightness / 100);
  return rgbToNumber(rgb[0], rgb[1], rgb[2]);
}

module.exports = { generateColor };
