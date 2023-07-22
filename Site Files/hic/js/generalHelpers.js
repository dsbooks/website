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

// traverse through siblings and subcomponents to try and reach everywhere. Afterwards,
// search for parents that might have been missed
function holisticTraverse(
  componentList,
  currentComponent,
  idList,
  visitedList
) {
  // first, be sure to add the current id to the visitedList
  visitedList.push(currentComponent.id);

  // next, traverse all subcomponents
  for (let i = 0; i < currentComponent.components.length; i++) {
    const consideredComponent = currentComponent.components[i];

    if (!visitedList.includes(consideredComponent.id)) {
      const nextComponent = componentList.find(
        (v) => v.id === consideredComponent.id
      );
      visitedList = holisticTraverse(
        componentList,
        nextComponent,
        idList,
        visitedList
      );
    }
  }

  // then, traverse all siblings
  for (let i = 0; i < currentComponent.siblings.length; i++) {
    const consideredComponent = currentComponent.siblings[i];

    if (!visitedList.includes(consideredComponent.id)) {
      const nextComponent = componentList.find(
        (v) => v.id === consideredComponent.id
      );
      visitedList = holisticTraverse(
        componentList,
        nextComponent,
        idList,
        visitedList
      );
    }
  }

  // finally search for parents and perform the traversal through them if they can be found
  for (let i = 0; i < componentList.length; i++) {
    const parent = componentList[i].components.find(
      (v) => v.id === currentComponent.id
    );
    if (!visitedList.includes(componentList[i].id) && parent) {
      visitedList = holisticTraverse(
        componentList,
        componentList[i],
        idList,
        visitedList
      );
    }
  }

  return visitedList;
}
