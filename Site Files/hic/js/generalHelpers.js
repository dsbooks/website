///////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS                                                                      //
///////////////////////////////////////////////////////////////////////////////////////////

// return a string but now it is capitalized
function capitalize(str) {
  const firstLetter = str.charAt(0);
  const firstLetterCap = firstLetter.toUpperCase();
  const remainingLetters = str.slice(1);
  return firstLetterCap + remainingLetters;
}

// use to check if a structure is fluid
function structureIsFluid(type) {
  return !Array.isArray(type) && type[0] === "7";
}

// sums the counts of a component together
function sumCounts(component) {
  return (
    component.originalCount +
    component.assimilatedCount +
    component.generatedCount +
    component.otherCount
  );
}

// removes punctuation and whitespace from a string and replaces it with "-"
function cleanupName(string) {
  return string
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, "")
    .replace(/\s/g, "-");
}
