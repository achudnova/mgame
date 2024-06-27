const getRandomIn = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
  getRandomIn,
};

/**
 * Funktion berechet eine zufällige Ganzzahl im bereich zwischen min und max
 * Die Funktion getRandomIn wird als Teil eines Objekts exportiert.
 * Das ermöglicht es, diese Funktion in anderen Dateien zu importieren und zu verwenden.
 */
// Diese Funktion ist nützlich, wenn man beispielsweise eine zufällige Position
// oder einen zufälligen Wert innerhalb eines bestimmten Bereichs benötigt.