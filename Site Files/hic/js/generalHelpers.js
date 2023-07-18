// return a string but now it is capitalized
function capitalize(str) {
  const firstLetter = str.charAt(0);
  const firstLetterCap = firstLetter.toUpperCase();
  const remainingLetters = str.slice(1);
  return firstLetterCap + remainingLetters;
}

///////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS                                                                      //
///////////////////////////////////////////////////////////////////////////////////////////

// use to check if a structure is fluid
function structureIsFluid(type) {
  return !Array.isArray(type) && type[0] === "7";
}

// validates a count value
function validateCount(number) {
  return typeof number === "number" && number >= 0 && Number.isInteger(number);
}

// validates that a degree value is in the proper range
function validateDegree(number) {
  return typeof degree === "number" && degree >= 0 && degree <= 1;
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
