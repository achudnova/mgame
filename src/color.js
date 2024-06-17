function generateColor() {
  // Generate a random hue between 15 and 60
  const hue = Math.floor(Math.random() * (60 - 15 + 1)) + 15;

  // Generate a random lightness between 40% and 60%
  const lightness = Math.floor(Math.random() * (60 - 40 + 1)) + 40;

  // Return the color as an HSL string
  return `hsl(${hue}, 100%, ${lightness}%)`;
}

module.exports = { generateColor };