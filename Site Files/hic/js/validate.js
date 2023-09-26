///////////////////////////////////////////////////////////////////////////////////////////
// MAIN FUNCTIONS                                                                        //
///////////////////////////////////////////////////////////////////////////////////////////

// validate the imported list of components
function validate(data) {
  if (!data || !Array.isArray(data) || !data.length) {
    $("#valid").text("The data is either empty or not an array");
    return false;
  }
  if (!valueCheck(data)) {
    $("#valid").text("The data has invalid values");
    return false;
  }
  if (!consistencyCheck(data)) {
    $("#valid").text("The sibling data is inconsistent");
    return false;
  }
  if (!holisticCheck(data)) {
    $("#valid").text("Some components are disconnected");
    return false;
  }
  if (!cycleCheck(data)) {
    $("#valid").text("There are cyclical subcomponent relationships");
    return false;
  }
  $("#valid").text("The data is valid");
  return true;
}

// type check the entire list of components
function valueCheck(componentList) {
  if (!validateIds(componentList)) {
    return false;
  }
  for (let i = 0; i < componentList.length; i++) {
    if (!componentValueCheck(componentList[i])) {
      return false;
    }
  }
  return true;
}

// type check an individual component
function componentValueCheck(component) {
  // ensure that components and counts are all valid (they are required for other checks)
  if (!Array.isArray(component.components)) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid components entry of ${component.components}`
    );
    return false;
  } else if (!Array.isArray(component.transformations)) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid transformations entry of ${component.transformations}`
    );
    return false;
  } else if (!Array.isArray(component.siblings)) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid siblings entry of ${component.siblings}`
    );
    return false;
  } else if (!hasProperCounts(component)) {
    console.log(
      `Component id ${component.id}, name ${component.name} does not have proper count entries.\nAll four count entries should have integer numbers >= 0`
    );
    return false;
  }
  // handle all special checks
  if (typeof component["groupSummary"] !== "boolean") {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid groupSummary entry of ${component["groupSummary"]}.\nThe groupSummary entry should be either true or false.`
    );
    return false;
  }

  if (!validateType(component, "type")) {
    return false;
  }
  if (!validateFluidRange(component, "fluidRange")) {
    return false;
  }
  if (!validateIntegrationSpectrum(component, "integrationSpectrum")) {
    return false;
  }
  if (!validateIdentity(component, "componentIdentity")) {
    return false;
  }
  if (!validateIdentity(component, "collectiveIdentity")) {
    return false;
  }
  if (
    !validateComponentExchangeAllowed(component, "componentExchangeAllowed")
  ) {
    return false;
  }

  if (!validateDegree(component, "sharedWillDegree")) {
    return false;
  }
  if (!validateDegree(component, "sharedKnowledgeDegree")) {
    return false;
  }
  if (!validateDegree(component, "sharedPersonalityDegree")) {
    return false;
  }
  if (!validatePotentialTransformations(component, "transformations")) {
    return false;
  }
  if (!validateSiblings(component, "siblings")) {
    return false;
  }
  if (!validateSubcomponents(component, "components")) {
    return false;
  }

  return true;
}

// Ensure that data is consistent between siblings;
// note that all sibling entries should have been verified to be valid
// at this point by the valueCheck function, so we don't check for that here
function consistencyCheck(componentList) {
  for (let i = 0; i < componentList.length; i++) {
    let component = componentList[i];

    // make a list of all sibling entries from the component list
    let siblingIds = component.siblings.map((v) => v.id);
    let siblingEntries = componentList.filter((v) => siblingIds.includes(v.id));

    // iterate over all siblings for the current component
    for (let j = 0; j < component.siblings.length; j++) {
      // get the component's view of a specific sibling
      let compPerspective = component.siblings[j];

      // get the sibling's entry from the component list
      let sibling = siblingEntries.find((v) => v.id === compPerspective.id);

      // get the sibling's view of the component it is a sibling of
      let sibPerspective = sibling.siblings.find((v) => v.id === component.id);

      // finally, compare the two views to make sure they are symmetrical
      if (
        !compareSiblings(component, sibling, compPerspective, sibPerspective)
      ) {
        return false;
      }
    }
  }
  return true;
}

// Verify that all components are interconnected in some way
function holisticCheck(componentList) {
  // get a list of all ids
  const idList = componentList.map((v) => v.id);

  // perform the traversal;
  // where the start happens is irrelevant, so just start from the first component in the list
  const visitedList = holisticTraverse(
    componentList,
    componentList[0],
    idList,
    []
  );

  // compare the full list of ids to the largest connected list of components
  if (visitedList.length !== idList.length) {
    const unvisitedIds = idList.filter((v) => !visitedList.includes(v));
    console.log(
      `The intelligence is disconnected. From id 0, the following component ids could not be reached: ${unvisitedIds}`
    );
    return false;
  }
  return true;
}

// traverse through the componentList and make sure that there are no cyclical subcomponent relationships
function cycleCheck(componentList) {
  // need to stop if a cycle is found
  for (let i = 0; i < componentList.length; i++) {
    if (!cycleCheckTraversal(componentList, componentList[i], [])) {
      return false;
    }
  }

  return true;
}

///////////////////////////////////////////////////////////////////////////////////////////
// SPECIFIC ENTRY VALIDATION FUNCTIONS                                                   //
///////////////////////////////////////////////////////////////////////////////////////////

// handle checking the 'type' property specially as it can be either a string or array
function validateType(component, key) {
  // if the type is a single string, check its value
  if (typeof component[key] === "string") {
    if (!validStructureTypes.includes(component[key])) {
      console.log(
        `component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}`
      );
      return false;
    }
  }
  // if the type is an array, make sure it is an array of strings
  else if (Array.isArray(component[key])) {
    // verify that this entry is allowed to be an array, which requires the "groupSummary" property to be true
    if (!component.groupSummary) {
      console.log(
        `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents should only have multiple structure types if they are marked as a Group Summary.`
      );
      return false;
    }
    // while checking if it is an array of strings, verify that each string is also a valid value
    const bad = component[key].filter((v) => {
      if (typeof v !== "string") {
        return true;
      }
      return !validStructureTypes.includes(v);
    });
    if (bad.length) {
      console.log(
        `Component id ${component.id}, name ${component.name} has an invalid ${key} entry. The invalid values are ${bad}`
      );
      return false;
    }
  }
  // if neither of the above cases are true, there is a bad value
  else {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.`
    );
    return false;
  }
  return true;
}

// handle checking the 'fluidRange' property specially as it can be either an array or undefined
function validateFluidRange(component, key) {
  const fluid = structureIsFluid(component.type);
  // make sure that only fluid structures have a fluid range entry
  if (!fluid && component.fluidRange !== undefined) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nNon-fluid (type 7a, 7b, or 7c) components should not have a Fluid Range entry.`
    );
    return false;
  }
  // make sure that fluid entries have a valid array entry
  else if (
    fluid &&
    (!Array.isArray(component.fluidRange) || component.fluidRange.length < 2)
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nFluid (type 7a, 7b, or 7c) components should have a valid list of types with at least two entries.`
    );
    return false;
  }
  // finally, make sure that the fluidRange entries are valid types (and none are fluid types)
  else if (fluid) {
    const bad = component.fluidRange.filter((v) => {
      return !validStructureTypes.includes(v) || structureIsFluid(v);
    });
    if (bad.length) {
      console.log(
        `Component id ${component.id}, name ${component.name} has an invalid ${key} entry. The invalid values are ${bad}`
      );
      return false;
    }
  }
  return true;
}

// handle checking the 'integrationSpectrum' property specially as it can be either a number or undefined
function validateIntegrationSpectrum(component, key) {
  if (
    !component.components.length &&
    component[key] !== undefined &&
    !component.groupSummary
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents without subcomponents should not have an Integration Spectrum entry unless marked as a Group Summary (be certain that at least some component types being summarized have unlisted subcomponents).`
    );
    return false;
  } else if (
    component.components.length &&
    (typeof component[key] !== "number" ||
      component[key] < 0 ||
      component[key] > 1)
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents with subcomponents must have an Integration Spectrum entry with a value between 0 and 1.`
    );
    return false;
  } else if (
    component.groupSummary &&
    typeof component[key] !== "undefined" &&
    (typeof component[key] !== "number" ||
      component[key] < 0 ||
      component[key] > 1)
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents marked as a Group Summary subcomponents must have an Integration Spectrum entry with a value between 0 and 1 or else no entry at all.`
    );
    return false;
  }
  return true;
}

// handle checking the 'identity' properties specially as they are required and must have a range between 0 and 1
function validateIdentity(component, key) {
  if (
    typeof component[key] !== "number" ||
    component[key] < 0 ||
    component[key] > 1
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\n${key} entries must have a value between 0 and 1.`
    );
    return false;
  }
  return true;
}

// handle checking the 'componentExchangeAllowed' property specially as it can be either a boolean or undefined
function validateComponentExchangeAllowed(component, key) {
  const total = sumCounts(component);
  if (typeof component[key] !== "undefined" && total <= 1) {
    // insufficient count for exchange to be an option
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${component.key} entry of ${component[key]}.\nComponents should not have a componentsExchangeAllowed entry if they have a total count less than 2.`
    );
    return false;
  } else if (
    !component.components.length &&
    component[key] !== undefined &&
    !component.groupSummary
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents without subcomponents should not have a Component Exchange entry unless marked as a Group Summary (be certain that at least some component types being summarized have unlisted subcomponents).`
    );
    return false;
  } else if (
    component.components.length &&
    total > 1 &&
    typeof component[key] !== "boolean"
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents with subcomponents and multiple instances must have a Component Exchange entry marked as true or false.`
    );
    return false;
  } else if (
    component.groupSummary &&
    typeof component[key] !== "undefined" &&
    typeof component[key] !== "boolean"
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents marked as a Group Summary subcomponents must have a Component Exchange entry with a true or false value or else no entry at all.`
    );
    return false;
  }
  return true;
}

// handle checking the 'Degree' properties specially as they can be either a number or undefined
function validateDegree(component, key) {
  const total = sumCounts(component);
  if (typeof component[key] !== "undefined" && total <= 1) {
    // insufficient count for exchange to be an option
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${component.key} entry of ${component[key]}.\nComponents should not have a ${key} entry if they have a total count less than 2.`
    );
    return false;
  } else if (
    total > 1 &&
    (typeof component[key] !== "number" ||
      component[key] < 0 ||
      component[key] > 1)
  ) {
    console.log(
      `Component id ${component.id}, name ${component.name} has an invalid ${key} entry of ${component[key]}.\nComponents with multiple instances must have a ${key} entry marked bewteen 0 and 1.`
    );
    return false;
  }
  return true;
}

///////////////////////////////////////////////////////////////////////////////////////////
// COMPOSITE ENTRY VALIDATION FUNCTIONS (AND ID CHECKING)                                //
///////////////////////////////////////////////////////////////////////////////////////////

// this function makes sure that all ids are valid and that there are not duplicate ids
function validateIds(componentList) {
  // first check for invalid ids
  for (let i = 0; i < componentList.length; i++) {
    if (
      typeof componentList[i].id !== "number" ||
      !Number.isInteger(componentList[i].id) ||
      componentList[i].id < 0
    ) {
      console.log(
        `Component id ${componentList[i].id}, name ${componentList[i].name} has an invalid id.\nAll ids must be an integer number >= 0.`
      );
      return false;
    }
    if (Array.isArray(componentList[i].siblings)) {
      if (
        !validateSubIds(componentList[i], componentList[i].siblings, "siblings")
      ) {
        return false;
      }
    }
    if (Array.isArray(componentList[i].components)) {
      if (
        !validateSubIds(
          componentList[i],
          componentList[i].components,
          "components"
        )
      ) {
        return false;
      }
    }
  }
  // then check for duplicate ids
  for (let i = 0; i < componentList.length - 1; i++) {
    for (let j = i + 1; j < componentList.length; j++) {
      if (componentList[i].id === componentList[j].id) {
        console.log(
          `Duplicate ids detected for id ${componentList[i].id}; ${componentList[i].name} and ${componentList[j].name} have the same id.`
        );
        return false;
      }
    }
  }
  // finally make sure that no sibling/components lists have ids that are not in the main components list
  const validIds = componentList.map((v) => v.id);
  for (let i = 0; i < componentList.length; i++) {
    if (
      !validateSubIdReferences(
        componentList[i],
        validIds,
        componentList[i].siblings
      )
    ) {
      return false;
    }
    if (
      !validateSubIdReferences(
        componentList[i],
        validIds,
        componentList[i].components
      )
    ) {
      return false;
    }
  }

  return true;
}

// make sure that all potential transformation entries are valid
function validatePotentialTransformations(component, key) {
  for (let i = 0; i < component[key].length; i++) {
    if (!validStructureTypes.includes(component[key][i].type)) {
      console.log(
        `component id ${component.id}, name ${component.name} has an invalid type for a transformation entry. ${component[key][i].type} is not a valid structure type.`
      );
      return false;
    }
    if (
      !validTransformationNatures.includes(
        component[key][i].transformationNature
      )
    ) {
      console.log(
        `component id ${component.id}, name ${component.name} has an invalid Transformation Nature for a transformation entry. ${component[key][i].transformationNature} is not a valid structure type.`
      );
      return false;
    }
  }
  return true;
}

// make sure that all sibling entries are valid; no need to check ids at this point as other checks handle that
function validateSiblings(component, key) {
  for (let i = 0; i < component[key].length; i++) {
    let sibling = component[key][i];
    // validate transfer properties first
    if (!validTransferTypes.includes(sibling.siblingAssimilationDirection)) {
      console.log(
        `component id ${component.id}, name ${component.name} has an invalid assimilation direction for sibling ${sibling.id}.`
      );
      return false;
    }
    if (
      !validTransferTypes.includes(sibling.siblingComponentExchangeDirection)
    ) {
      console.log(
        `component id ${component.id}, name ${component.name} has an invalid component exchange direction for sibling ${sibling.id}.`
      );
      return false;
    }
    // validate all connection types next
    if (!validateConnection(component, sibling, "siblingWillUpConnection")) {
      return false;
    }
    if (!validateConnection(component, sibling, "siblingWillDownConnection")) {
      return false;
    }
    if (
      !validateConnection(component, sibling, "siblingKnowledgeUpConnection")
    ) {
      return false;
    }
    if (
      !validateConnection(component, sibling, "siblingKnowledgeDownConnection")
    ) {
      return false;
    }
    if (
      !validateConnection(component, sibling, "siblingPersonalityUpConnection")
    ) {
      return false;
    }
    if (
      !validateConnection(
        component,
        sibling,
        "siblingPersonalityDownConnection"
      )
    ) {
      return false;
    }
    // validate all connection degrees last
    if (
      !validateConnectionDegree(
        component,
        sibling,
        "siblingWillUpDegree",
        "siblingWillUpConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        sibling,
        "siblingWillDownDegree",
        "siblingWillDownConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        sibling,
        "siblingKnowledgeUpDegree",
        "siblingKnowledgeUpConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        sibling,
        "siblingKnowledgeDownDegree",
        "siblingKnowledgeDownConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        sibling,
        "siblingPersonalityUpDegree",
        "siblingPersonalityUpConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        sibling,
        "siblingPersonalityDownDegree",
        "siblingPersonalityDownConnection"
      )
    ) {
      return false;
    }
  }
  return true;
}

// make sure that all subcomponent entries are valid; no need to check ids at this point as other checks handle that
function validateSubcomponents(component, key) {
  for (let i = 0; i < component[key].length; i++) {
    let subComp = component[key][i];
    // validate structure nature first
    if (!validStructureNatures.includes(subComp.structureNature)) {
      console.log(
        `component id ${component.id}, name ${component.name} has an invalid Structure Nature for subcomponent ${subComp.id}.`
      );
      return false;
    }
    // validate all connection types next
    if (!validateConnection(component, subComp, "parentWillUpConnection")) {
      return false;
    }
    if (!validateConnection(component, subComp, "parentWillDownConnection")) {
      return false;
    }
    if (
      !validateConnection(component, subComp, "parentKnowledgeUpConnection")
    ) {
      return false;
    }
    if (
      !validateConnection(component, subComp, "parentKnowledgeDownConnection")
    ) {
      return false;
    }
    if (
      !validateConnection(component, subComp, "parentPersonalityUpConnection")
    ) {
      return false;
    }
    if (
      !validateConnection(component, subComp, "parentPersonalityDownConnection")
    ) {
      return false;
    }
    // validate all connection degrees last
    if (
      !validateConnectionDegree(
        component,
        subComp,
        "parentWillUpDegree",
        "parentWillUpConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        subComp,
        "parentWillDownDegree",
        "parentWillDownConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        subComp,
        "parentKnowledgeUpDegree",
        "parentKnowledgeUpConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        subComp,
        "parentKnowledgeDownDegree",
        "parentKnowledgeDownConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        subComp,
        "parentPersonalityUpDegree",
        "parentPersonalityUpConnection"
      )
    ) {
      return false;
    }
    if (
      !validateConnectionDegree(
        component,
        subComp,
        "parentPersonalityDownDegree",
        "parentPersonalityDownConnection"
      )
    ) {
      return false;
    }
  }
  return true;
}

///////////////////////////////////////////////////////////////////////////////////////////
// SIBLING CONSISTENCY FUNCTIONS                                                         //
///////////////////////////////////////////////////////////////////////////////////////////

// compare two siblings and make certain that their relationship is symmetric;
// note that siblings do not necessarily need to share parents, so don't check for that
function compareSiblings(a, b, aView, bView) {
  // compare transfer directions
  if (
    !compareTransferDirections(
      a,
      b,
      aView,
      bView,
      "siblingAssimilationDirection"
    )
  ) {
    return false;
  }
  if (
    !compareTransferDirections(
      a,
      b,
      aView,
      bView,
      "siblingComponentExchangeDirection"
    )
  ) {
    return false;
  }

  // next compare connection types
  if (
    !compareConnectionTypes(
      a,
      b,
      aView,
      bView,
      "siblingWillUpConnection",
      "siblingWillDownConnection"
    )
  ) {
    return false;
  }
  if (
    !compareConnectionTypes(
      a,
      b,
      aView,
      bView,
      "siblingKnowledgeUpConnection",
      "siblingKnowledgeDownConnection"
    )
  ) {
    return false;
  }
  if (
    !compareConnectionTypes(
      a,
      b,
      aView,
      bView,
      "siblingPersonalityUpConnection",
      "siblingPersonalityDownConnection"
    )
  ) {
    return false;
  }
  // compare connection degrees
  if (
    !compareConnectionDegrees(
      a,
      b,
      aView,
      bView,
      "siblingWillUpDegree",
      "siblingWillDownDegree"
    )
  ) {
    return false;
  }
  if (
    !compareConnectionDegrees(
      a,
      b,
      aView,
      bView,
      "siblingKnowledgeUpDegree",
      "siblingKnowledgeDownDegree"
    )
  ) {
    return false;
  }
  if (
    !compareConnectionDegrees(
      a,
      b,
      aView,
      bView,
      "siblingPersonalityUpDegree",
      "siblingPersonalityDownDegree"
    )
  ) {
    return false;
  }

  return true;
}

// compare transfer directions between siblings
function compareTransferDirections(a, b, aView, bView, transferKey) {
  if (
    (aView[transferKey] === "none" && bView[transferKey] === "none") ||
    (aView[transferKey] === "open" && bView[transferKey] === "open") ||
    (aView[transferKey] === "up" && bView[transferKey] === "down") ||
    (aView[transferKey] === "down" && bView[transferKey] === "up")
  ) {
    return true;
  }

  console.log(
    `Component id ${a.id} and component id ${b.id} have inconsistent ${transferKey} values of ${aView[transferKey]} and ${bView[transferKey]} respectively.\nEither both must be "none", both must be "open", or one must be "up" and the other "down".`
  );
  return false;
}

// compare connection types between siblings
function compareConnectionTypes(a, b, aView, bView, conKey1, conKey2) {
  if (
    (aView[conKey1] === "none" && bView[conKey2] === "none") ||
    (aView[conKey1] === "open" && bView[conKey2] === "open") ||
    (aView[conKey1] === "on-demand" && bView[conKey2] === "on-demand") ||
    (aView[conKey1] === "on-demand-d" && bView[conKey2] === "on-demand-u") ||
    (aView[conKey1] === "on-demand-u" && bView[conKey2] === "on-demand-d")
  ) {
    return true;
  }

  console.log(
    `Component id ${a.id} and component id ${b.id} have inconsistent ${conKey1} and ${conKey2} values of ${aView[conKey1]} and ${bView[conKey2]} respectively.\nEither both must be "none", both must be "open", both must be "on-demand", or one must be "on-demand-d" and the other "on-demand-u".`
  );
  return false;
}

// compare connection degrees between siblings
function compareConnectionDegrees(a, b, aView, bView, conKey1, conKey2) {
  if (aView[conKey1] === bView[conKey2]) {
    return true;
  }

  console.log(
    `Component id ${a.id} and component id ${b.id} have inconsistent ${conKey1} and ${conKey2} values of ${aView[conKey1]} and ${bView[conKey2]} respectively.\nThese two values must be identical.`
  );
  return false;
}

///////////////////////////////////////////////////////////////////////////////////////////
// COMPONENT NETWORK HOLISTIC AND CYCLIC CHECK FUNCTIONS                                 //
///////////////////////////////////////////////////////////////////////////////////////////

// traverse through a component's subcomponents and make sure that there are no cyclical subcomponent relationships;
// return false if a cycle is found (bad) and true if no cycle is found
function cycleCheckTraversal(componentList, component, path) {
  const newPath = path.map((v) => v);
  newPath.push(component.id);

  // traverse all subcomponents
  for (let i = 0; i < component.components.length; i++) {
    const nextComponent = componentList.find(
      (v) => v.id === component.components[i].id
    );
    if (path.includes(nextComponent.id)) {
      newPath.push(nextComponent.id);
      const cycle = newPath.slice(newPath.indexOf(nextComponent.id));
      console.log(
        `The intelligence has cyclic subcomponents. The following id cycle was discovered: ${cycle}`
      );
      return false;
    } else if (!cycleCheckTraversal(componentList, nextComponent, newPath)) {
      return false;
    }
  }

  return true;
}

///////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS                                                                      //
///////////////////////////////////////////////////////////////////////////////////////////

// checks if the count entries are valid
function hasProperCounts(component) {
  if (
    !validateCount(component.originalCount) ||
    !validateCount(component.assimilatedCount) ||
    !validateCount(component.generatedCount) ||
    !validateCount(component.otherCount)
  ) {
    return false;
  }
  return true;
}

// make sure that all sibling and components lists have valid id numbers
function validateSubIds(component, list, type) {
  for (let i = 0; i < list.length; i++) {
    if (
      typeof list[i].id !== "number" ||
      !Number.isInteger(list[i].id) ||
      list[i].id < 0
    ) {
      console.log(
        `Component id ${component.id}, name ${component.name} has an invalid id in its ${type} list.\nAll ids must be an integer number >= 0. The invalid id is ${list[i].id}`
      );
      return false;
    }
  }
  return true;
}

// make sure that sub arrays do not reference ids that don't exist
function validateSubIdReferences(component, validIds, list) {
  if (Array.isArray(list)) {
    let referencedIds = list.map((v) => v.id);
    for (let j = 0; j < referencedIds.length; j++) {
      if (!validIds.includes(referencedIds[j])) {
        console.log(
          `Invalid id detected for id ${component.id}, name ${component.name} inside of the siblings entry. The id ${referencedIds[j]} does not refer to any component.`
        );
        return false;
      }
    }
  }
  return true;
}

// validate a connection type and print an error message if it is bad
function validateConnection(component, connectionComponent, connection) {
  if (!validConnectionTypes.includes(connectionComponent[connection])) {
    console.log(
      `component id ${component.id}, name ${component.name} has an invalid ${connection} for other component id of ${connectionComponent.id}.`
    );
    return false;
  }
  return true;
}

// validate a connection degree and print an error message if it is bad;
// both connectionDegree and connectionType are keys, not actual values
function validateConnectionDegree(
  component,
  connectionComponent,
  connectionDegree,
  connectionType
) {
  const degree = connectionComponent[connectionDegree];
  if (!validateDegreeNumber(degree)) {
    console.log(
      `component id ${component.id}, name ${component.name} has an invalid ${connectionDegree} for other component id of ${connectionComponent.id}.\nThe degree is ${degree}, but it must be a number between 0 and 1.`
    );
    return false;
  }
  if (
    !validateConnectionDegreeCombo(
      component,
      connectionComponent,
      connectionDegree,
      connectionType
    )
  ) {
    return false;
  }
  return true;
}

// validates a count value
function validateCount(number) {
  return typeof number === "number" && number >= 0 && Number.isInteger(number);
}

// validates that a degree value is in the proper range
function validateDegreeNumber(degree) {
  return typeof degree === "number" && degree >= 0 && degree <= 1;
}

// validates that a particular connection type has a valid degree number for that type;
// both connectionDegree and connectionType are keys, not actual values
function validateConnectionDegreeCombo(
  component,
  connectionComponent,
  connectionDegree,
  connectionType
) {
  const degree = connectionComponent[connectionDegree];
  const type = connectionComponent[connectionType];
  if (type === "none" && degree !== 0) {
    console.log(
      `component id ${component.id}, name ${component.name} has an invalid ${connectionDegree} for other component id of ${connectionComponent.id}.\nThe degree is ${degree}, but the connection type is ${type}, which must have a degree of 0.`
    );
    return false;
  } else if (type !== "none" && degree === 0) {
    console.log(
      `component id ${component.id}, name ${component.name} has an invalid ${connectionDegree} for other component id of ${connectionComponent.id}.\nThe degree is ${degree}, but the connection type is ${type}, which must have a degree greater than 0.`
    );
    return false;
  }
  return true;
}
