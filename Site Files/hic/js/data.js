///////////////////////////////////////////////////////////////////////////////////////////
// SETUP                                                                                 //
///////////////////////////////////////////////////////////////////////////////////////////
let componentList;
let currentComponent = null;
let currentSibling = null;
let currentSubcomponent = null;
let currentTransformation = null;

$(() => {
  // register non-editing events
  $("#components-dropdown").change(selectComponent);
  $("#add-component-button").click(addComponent);
  $("#delete-component-button").click(deleteComponent);
  $("#subcomponents-dropdown").change(selectSubcomponent);
  $("#add-subcomponent-button").click(addSubcomponent);
  $("#delete-subcomponent-button").click(deleteSubcomponent);

  // TODO: for both sibling and component delete, the holistic check will be required

  $("#transformations-dropdown").change(selectTransformation);
  $("#add-transformation-button").click(addTransformation);
  $("#delete-transformation-button").click(deleteTransformation);
  $(".collapse-trigger").click(toggleDataSection);

  // register editing events (the toggle buttons are technically not editing, but whatevs)
  // registration of events for the grid buttons are handled in the grid html files
  $("input[type='text']").keydown(function (e) {
    if (e.key === "Enter") $(this).blur();
  });
  $("#trans-type-grid-button").click(toggleOneTypeGrid);
  $("#trans-nature-dropdown").change(changeTransformationNature);
  $("#sub-id-dropdown").change(changeSubcomponentId);
  $("#sub-nature-dropdown").change(changeSubcomponentNature);
  $(".connection-dropdown").change(changeSubConnectionType);
  $(".spectrum-entry").change(changeGenericSpectrumEntry);
});

///////////////////////////////////////////////////////////////////////////////////////////
// COMPONENT FUNCTIONS (NON-EDITING)                                                     //
///////////////////////////////////////////////////////////////////////////////////////////

// collapse or uncollapse a data section
function toggleDataSection() {
  const id = $(this).attr("id");
  if (id === "component-collapse") $("#component-data").toggle();
  if (id === "sibling-collapse") $("#sibling-data").toggle();
  if (id === "subcomponent-collapse") $("#subcomponent-data").toggle();
  if (id === "transformation-collapse") $("#transformation-data").toggle();
}

// select a component when clicked on and repopulate data fields based on this component
function selectComponent() {
  const id = $(this)
    .find("option:selected")
    .text()
    .replace(/(^\d+)(.+$)/i, "$1");

  const found = componentList.find((v) => v.id == id);

  if (found === currentComponent) return;
  currentComponent = found;
  currentSubcomponent = null;
  currentSibling = null;
  currentTransformation = null;
  populateDataFields(componentList);
}

// add a new, empty component
function addComponent() {
  // make the new label be one more than the current highest index number
  const label =
    componentList.reduce(function (prev, current) {
      return prev.id > current.id ? prev : current;
    }).id + 1;

  // create a new component and option
  componentList.push(new Component(label));

  // select the new component and repopulate based on it
  currentComponent = componentList[componentList.length - 1];
  populateDataFields(componentList);
}

// delete the currently selected component and all sibling/subcomponent references to the component
function deleteComponent() {
  // TODO: implement the deleteComponent function
}

// select a transformation when clicked on and repopulate data fields based on this transformation
function selectTransformation() {
  let id = $(this)
    .find("option:selected")
    .text()
    .replace(/(^\d+)(.+$)/i, "$1");

  currentTransformation = currentComponent.transformations[id];
  populateTransformationData(currentTransformation);
}

// add a new, default-valued transformation
function addTransformation() {
  // don't do anything if there isn't a component to add transformations to
  if (!currentComponent) return;

  $("#transformation-data :input").prop("disabled", false);
  const label = `${currentComponent.transformations.length}: Past 1a`;
  const value = `${currentComponent.transformations.length}-Past-1a`;

  // create a new transformation and option
  currentComponent.transformations.push(new Transformation());
  $("<option>")
    .attr("value", value)
    .attr("id", "trans-" + value)
    .text(label)
    .appendTo("#transformations-dropdown");

  // select the new transformation and repopulate based on it
  $(`#transformations-dropdown`).val(value);
  currentTransformation =
    currentComponent.transformations[
      currentComponent.transformations.length - 1
    ];

  populateTransformationData(currentTransformation);
}

// delete the currently selected transformation
function deleteTransformation() {
  let index = currentComponent.transformations.indexOf(currentTransformation);

  currentComponent.transformations.splice(index, 1);

  // if the number of transformations is now 0, then clear the currentTransformation data
  if (currentComponent.transformations.length === 0) {
    currentTransformation = null;
    clearTransformationEntries();
    $("#transformations-dropdown").empty();
  }
  // otherwise, keep the same index unless the index is now past the end, in which case go back by 1
  else if (index === currentComponent.transformations.length) {
    index--;
    currentTransformation = currentComponent.transformations[index];
  } else {
    currentTransformation = currentComponent.transformations[index];
  }
  populateDataFields(componentList);
  if (currentTransformation) {
    let value = `${index}-${capitalize(
      currentTransformation.transformationNature
    )}-${currentTransformation.type}`;

    $(`#transformations-dropdown option[value=${value}]`).prop(
      "selected",
      true
    );
    populateTransformationData(currentTransformation);
  }
}

// select a subcomponent when clicked on and repopulate data fields based on this subcomponent
function selectSubcomponent() {
  let id = $(this)
    .find("option:selected")
    .text()
    .replace(/(^\d+)(.+$)/i, "$1");

  currentSubcomponent = currentComponent.components.find((v) => v.id == id);

  populateSubcomponentData(currentSubcomponent);
}

// add a new, default subcomponent
function addSubcomponent() {
  // don't do anything if there isn't a component to add transformations to
  if (!currentComponent) return;

  // also return if every other component is already a subcomponent of this component
  if (currentComponent.components.length === componentList.length - 1) {
    console.log("There are no components that are not already subcomponents.");
    return;
  }

  // try to find valid subcomponents that won't cause cycles to occur if added. If one is found,
  // make the first be the default id. Otherwise, print an error message and don't do anything
  const checkComponentList = componentList.filter((v) => {
    return (
      !currentComponent.components.find((sv) => sv.id === v.id) &&
      !(v.id === currentComponent.id)
    );
  });

  const foundComponent = findValidSubcomponents(
    componentList,
    checkComponentList
  )[0];
  if (!foundComponent) {
    console.log(
      "There are no valid components that are not already subcomponents. Adding one of the remaining components would introduce a cyclical subcomponent dependency."
    );
    return;
  }

  $("#subcomponent-data :input").prop("disabled", false);

  const label = `${foundComponent.id}: ${foundComponent.name}`;
  const value = `${foundComponent.id}-${cleanupName(foundComponent.name)}`;

  // create a new subcomponent and option
  currentComponent.components.push(new Subcomponent(foundComponent.id));
  $("<option>")
    .attr("value", value)
    .attr("id", "sub-" + value)
    .text(label)
    .appendTo("#subcomponents-dropdown");

  // select the new subcomponent and repopulate based on it
  $(`#subcomponents-dropdown`).val(value);
  currentSubcomponent =
    currentComponent.components[currentComponent.components.length - 1];

  populateSubcomponentData(currentSubcomponent);
}

// delete the currently selected subcomponent
function deleteSubcomponent() {
  let index = currentComponent.components.indexOf(currentSubcomponent);

  const backupSubList = currentComponent.components.map((v) => v);

  currentComponent.components.splice(index, 1);

  // if the removal would separate some components from the overall intelligence, then undo it
  if (!dataHolisticCheck(componentList)) {
    currentComponent.components = backupSubList;
    return;
  }
  // if the number of transformations is now 0, then clear the currentTransformation data
  if (currentComponent.components.length === 0) {
    currentSubcomponent = null;
    clearSubcomponentEntries();
    $("#subcomponents-dropdown").empty();
  }
  // otherwise, keep the same index unless the index is now past the end, in which case go back by 1
  else if (index === currentComponent.components.length) {
    index--;
    currentSubcomponent = currentComponent.components[index];
  } else {
    currentSubcomponent = currentComponent.components[index];
  }

  populateDataFields(componentList);
  if (currentSubcomponent) {
    const value = `${currentSubcomponent.id}-${cleanupName(
      componentList.find((v) => v.id === currentSubcomponent.id).name
    )}`;

    $(`#subcomponents-dropdown option[value=${value}]`).prop("selected", true);
  }
  populateSubcomponentData(currentSubcomponent);
}

///////////////////////////////////////////////////////////////////////////////////////////
// COMPONENT FUNCTIONS (EDITING)                                                         //
///////////////////////////////////////////////////////////////////////////////////////////

// toggle the one type grid on and off, and close other grids if they are open
function toggleOneTypeGrid() {
  $("#comp-type-grid").hide();
  $("#fluid-type-grid").hide();
  if ($("#one-type-grid").is(":visible")) {
    $("#one-type-grid").hide();
  } else {
    $("#one-type-grid").show();
    let top = calculateGridPosition(
      "#one-type-grid-box",
      "#trans-type-grid-button"
    );
    $("#one-type-grid-box").css("top", top);
  }
}

// handle changing the type of a transformation
function handleTransTypeChange() {
  const id = $(this).attr("id");

  // make sure that only the clicked box is checked (and unchecking is impossible)
  $("#one-type-grid-box input").prop("checked", false);
  $(this).prop("checked", true);

  // update the value
  const val = id.slice(id.lastIndexOf("-") + 1);
  $("#trans-type-entry").val(JSON.stringify(val));
  currentTransformation.type = val;

  // update the dropdown list
  const currentId = $("#transformations-dropdown")
    .find("option:selected")
    .attr("id");

  const index = currentId.slice("trans-".length).replace(/(^\d+)(.+$)/i, "$1");
  const value = `${index}-${capitalize(
    currentTransformation.transformationNature
  )}-${currentTransformation.type}`;
  const label = `${index}: ${capitalize(
    currentTransformation.transformationNature
  )} ${currentTransformation.type}`;
  $(`#${currentId}`)
    .attr("value", value)
    .attr("id", "trans-" + value)
    .text(label);
}

// change the transformation nature of a transformation
function changeTransformationNature() {
  // first change the nature in memory
  const nature = $(this).find("option:selected").text().trim();
  currentTransformation.transformationNature = nature.toLowerCase();

  // then edit the label for the dropdown list
  const currentId = $("#transformations-dropdown")
    .find("option:selected")
    .attr("id");

  const index = currentId.slice("trans-".length).replace(/(^\d+)(.+$)/i, "$1");
  const value = `${index}-${capitalize(
    currentTransformation.transformationNature
  )}-${currentTransformation.type}`;
  const label = `${index}: ${capitalize(
    currentTransformation.transformationNature
  )} ${currentTransformation.type}`;
  $(`#${currentId}`)
    .attr("value", value)
    .attr("id", "trans-" + value)
    .text(label);
}

// change the subcomponent id
function changeSubcomponentId() {
  // first change the id in memory
  const id = $(this)
    .find("option:selected")
    .text()
    .replace(/(^\d+)(.+$)/i, "$1");
  currentSubcomponent.id = Number(id);

  // then edit the label for the dropdown list
  const currentId = $("#subcomponents-dropdown")
    .find("option:selected")
    .attr("id");

  const foundComponent = componentList.find((v) => v.id == id);
  const label = `${id}: ${foundComponent.name}`;
  const value = `${id}-${cleanupName(foundComponent.name)}`;
  $(`#${currentId}`)
    .attr("value", value)
    .attr("id", "sub-" + value)
    .text(label);

  handleSubcomponentSection();
}

// change a subcomponent's nature
function changeSubcomponentNature() {
  const nature = $(this).find("option:selected").text().trim();
  currentSubcomponent.structureNature = getStructureNature(nature);
}

// change any subcomponent connection type
function changeSubConnectionType() {
  const elementId = $(this).attr("id");
  const conType = getConType($(this).find("option:selected").text().trim());
  if (elementId === "sub-wup-con-dropdown")
    currentSubcomponent.parentWillUpConnection = conType;
  if (elementId === "sub-wdown-con-dropdown")
    currentSubcomponent.parentWillDownConnection = conType;
  if (elementId === "sub-kup-con-dropdown")
    currentSubcomponent.parentKnowledgeUpConnection = conType;
  if (elementId === "sub-kdown-con-dropdown")
    currentSubcomponent.parentKnowledgeDownConnection = conType;
  if (elementId === "sub-pup-con-dropdown")
    currentSubcomponent.parentPersonalityUpConnection = conType;
  if (elementId === "sub-pdown-con-dropdown")
    currentSubcomponent.parentPersonalityDownConnection = conType;
}

// change any non-sibling spectrum entry
function changeGenericSpectrumEntry() {
  const elementId = $(this).attr("id");
  const value = Math.max(0, Math.min(1, Number($(this).val())));

  $(this).val(value);

  // handle component spectrum entry changes first
  if (elementId === "component-identity-entry")
    currentComponent.componentIdentity = value;
  if (elementId === "collective-identity-entry")
    currentComponent.collectiveIdentity = value;
  if (elementId === "integration-entry")
    currentComponent.integrationSpectrum = value;
  if (elementId === "shared-will-entry")
    currentComponent.sharedWillDegree = value;
  if (elementId === "component-knowledge-entry")
    currentComponent.sharedKnowledgeDegree = value;
  if (elementId === "component-personality-entry")
    currentComponent.sharedPersonalityDegree = value;

  // handle subcomponent spectrum entry changes next
  if (elementId === "sub-wup-degree-entry")
    currentSubcomponent.parentWillUpDegree = value;
  if (elementId === "sub-wdown-degree-entry")
    currentSubcomponent.parentWillDownDegree = value;
  if (elementId === "sub-kup-degree-entry")
    currentSubcomponent.parentKnowledgeUpDegree = value;
  if (elementId === "sub-kdown-degree-entry")
    currentSubcomponent.parentKnowledgeDownDegree = value;
  if (elementId === "sub-pup-degree-entry")
    currentSubcomponent.parentPersonalityUpDegree = value;
  if (elementId === "sub-pdown-degree-entry")
    currentSubcomponent.parentPersonalityDownDegree = value;
}

///////////////////////////////////////////////////////////////////////////////////////////
// LOADING AND SAVING FUNCTIONS                                                          //
///////////////////////////////////////////////////////////////////////////////////////////

// load a json file
function load(fileName) {
  $.getJSON(fileName, function (json) {
    console.log(fileName);
    let good = validate(json);
    if (good) {
      componentList = json;
    } else {
      componentList = [];
    }
    populateDataFields(componentList);
  });
}

// refresh all data fields based on a component list;
function populateDataFields(componentList) {
  // disable all fields by default in case one data section is no longer valid
  $("#component-data :input").prop("disabled", true);
  $("#sibling-data :input").prop("disabled", true);
  $("#subcomponent-data :input").prop("disabled", true);
  $("#transformation-data :input").prop("disabled", true);

  // clear all dropdown lists
  $("#components-dropdown").empty();
  $("#siblings-dropdown").empty();
  $("#subcomponents-dropdown").empty();
  $("#transformations-dropdown").empty();

  if (componentList.length) {
    // create a new component list
    handleComponentSection();

    if (currentComponent.siblings.length) {
      handleSiblingSection();
    }
    if (currentComponent.components.length) {
      handleSubcomponentSection();
    }
    if (currentComponent.transformations.length) {
      handleTransformationSection();
    }
  } else {
    clearComponentEntries();
    clearSiblingEntries();
    clearSubcomponentEntries();
    clearTransformationEntries();
  }
}

// populate all data fields for a specific component
function populateComponentData(comp) {
  if (comp.name) $("#name-entry").val(comp.name);
  if (comp.groupSummary) $("#group-summary-box").prop("checked", true);
  $("#type-entry").val(JSON.stringify(comp.type));
  $("#component-identity-entry").val(comp.componentIdentity);
  $("#collective-identity-entry").val(comp.collectiveIdentity);
  $("#original-count-entry").val(comp.originalCount);
  $("#generated-count-entry").val(comp.generatedCount);
  $("#assimilated-count-entry").val(comp.assimilatedCount);
  $("#other-count-entry").val(comp.otherCount);
  if (sumCounts(comp) <= 1) {
    $("#shared-will-row").hide();
    $("#shared-knowledge-row").hide();
    $("#shared-personality-row").hide();
    $("#component-exchange-row").hide();
  } else {
    $("#shared-will-row").show();
    $("#shared-knowledge-row").show();
    $("#shared-personality-row").show();
    $("#component-exchange-row").show();
    $("#shared-will-entry").val(comp.sharedWillDegree);
    $("#shared-knowledge-entry").val(comp.sharedKnowledgeDegree);
    $("#shared-personality-entry").val(comp.sharedPersonalityDegree);
    if (comp.componentExchangeAllowed)
      $("#component-exchange-box").prop("checked", true);
  }
  if (comp.components.length) {
    $("#integration-row").show();
    $("#integration-entry").val(comp.integrationSpectrum);
  } else {
    $("#integration-row").hide();
  }
  if (!structureIsFluid(comp.type)) {
    $("#fluid-range-row").hide();
  } else {
    $("#fluid-range-row").show();
    $("#fluid-range-entry").val(JSON.stringify(comp.fluidRange));
  }
}

// populate all data fields for a specific sibling
function populateSiblingData(sib) {
  // make sure that the options are created
  constructConnectionOptionsForSiblings();

  const fullCurrentSibling = componentList.find((v) => v.id === sib.id);

  // need the id entry to be a dropdown list consisting of all valid (not-yet-used) components
  const foundComponents = componentList.filter(
    (v) => !currentComponent.siblings.find((sv) => sv.id === v.id)
  );

  // be sure to add the current sibling to the list
  if (!foundComponents.includes(fullCurrentSibling)) {
    foundComponents.unshift(fullCurrentSibling);
  }
  foundComponents.sort((a, b) => Number(a.id) - Number(b.id));

  // finally, make the dropdown list
  $("#sib-id-dropdown").empty();
  foundComponents.forEach((element) => {
    let label = `${element.id}: ${element.name}`;
    let value = `${element.id}-${cleanupName(element.name)}`;
    $("<option>")
      .attr("value", value)
      .attr("id", `sib-${value}`)
      .text(label)
      .appendTo("#sib-id-dropdown");
  });
  // and select the current subcomponent id from the list
  let value = `${sib.id}-${cleanupName(fullCurrentSibling.name)}`;
  $(`#sib-id-dropdown option[value=${value}]`).prop("selected", true);

  // populate all other dropdown lists
  value = capitalize(sib.siblingAssimilationDirection);
  $(`#sib-assim-dir-dropdown option[value=${value}]`).prop("selected", true);
  value = capitalize(sib.siblingComponentExchangeDirection);
  $(`#sib-xchng-dir-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sib.siblingWillUpConnection);
  $(`#sib-wup-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sib.siblingWillDownConnection);
  $(`#sib-wdown-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sib.siblingKnowledgeUpConnection);
  $(`#sib-kup-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sib.siblingKnowledgeDownConnection);
  $(`#sib-kdown-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sib.siblingPersonalityUpConnection);
  $(`#sib-pup-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sib.siblingPersonalityDownConnection);
  $(`#sib-pdown-con-dropdown option[value=${value}]`).prop("selected", true);

  // populate all degree entries
  $("#sib-wup-degree-entry").val(sib.siblingWillUpDegree);
  $("#sib-wdown-degree-entry").val(sib.siblingWillDownDegree);
  $("#sib-kup-degree-entry").val(sib.siblingKnowledgeUpDegree);
  $("#sib-kdown-degree-entry").val(sib.siblingKnowledgeDownDegree);
  $("#sib-pup-degree-entry").val(sib.siblingPersonalityUpDegree);
  $("#sib-pdown-degree-entry").val(sib.siblingPersonalityDownDegree);
}

// populate all data fields for a specific subcomponent
function populateSubcomponentData(sub) {
  // make sure that the options are created
  constructConnectionOptionsForSubcomponents();

  const fullCurrentSubcomponent = componentList.find((v) => v.id === sub.id);
  // need the id entry to be a dropdown list consisting of all valid (not-yet-used) components
  const foundComponents = findValidSubcomponents(
    componentList,
    componentList.filter((v) => {
      return (
        !currentComponent.components.find((sv) => sv.id === v.id) &&
        !(v.id === currentComponent.id)
      );
    })
  );
  // be sure to add the current subcomponent to the list
  if (!foundComponents.includes(fullCurrentSubcomponent)) {
    foundComponents.unshift(fullCurrentSubcomponent);
  }
  foundComponents.sort((a, b) => Number(a.id) - Number(b.id));

  // finally, make the dropdown list
  $("#sub-id-dropdown").empty();
  foundComponents.forEach((element) => {
    let label = `${element.id}: ${element.name}`;
    let value = `${element.id}-${cleanupName(element.name)}`;
    $("<option>")
      .attr("value", value)
      .attr("id", `sub-${value}`)
      .text(label)
      .appendTo("#sub-id-dropdown");
  });
  // and select the current subcomponent id from the list
  let value = `${sub.id}-${cleanupName(fullCurrentSubcomponent.name)}`;
  $(`#sub-id-dropdown option[value=${value}]`).prop("selected", true);

  // populate all other dropdown lists
  value = getConnDropdownValue(sub.parentWillUpConnection);
  $(`#sub-wup-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sub.parentWillDownConnection);
  $(`#sub-wdown-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sub.parentKnowledgeUpConnection);
  $(`#sub-kup-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sub.parentKnowledgeDownConnection);
  $(`#sub-kdown-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sub.parentPersonalityUpConnection);
  $(`#sub-pup-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getConnDropdownValue(sub.parentPersonalityDownConnection);
  $(`#sub-pdown-con-dropdown option[value=${value}]`).prop("selected", true);
  value = getStructureNatureDropdownValue(sub.structureNature);
  $(`#sub-nature-dropdown option[value=${value}]`).prop("selected", true);

  // populate all degree entries
  $("#sub-wup-degree-entry").val(sub.parentWillUpDegree);
  $("#sub-wdown-degree-entry").val(sub.parentWillDownDegree);
  $("#sub-kup-degree-entry").val(sub.parentKnowledgeUpDegree);
  $("#sub-kdown-degree-entry").val(sub.parentKnowledgeDownDegree);
  $("#sub-pup-degree-entry").val(sub.parentPersonalityUpDegree);
  $("#sub-pdown-degree-entry").val(sub.parentPersonalityDownDegree);
}

// populate all data fields for a specific transformation
function populateTransformationData(trans) {
  $("#trans-type-entry").val(JSON.stringify(trans.type));
  let value = capitalize(trans.transformationNature);
  $(`#trans-nature-dropdown option[value=${value}]`).prop("selected", true);
}

// manage loading the component section;
function handleComponentSection() {
  componentList.forEach((element) => {
    let label = `${element.id}: ${element.name}`;
    let value = `${element.id}-${cleanupName(element.name)}`;
    $("<option>")
      .attr("value", value)
      .attr("id", `comp-${value}`)
      .text(label)
      .appendTo("#components-dropdown");
  });

  $("#component-data :input").prop("disabled", false);
  if (!currentComponent) {
    currentComponent = componentList[0];
  }

  let value = `${currentComponent.id}-${cleanupName(currentComponent.name)}`;
  $(`#components-dropdown option[value=${value}]`).prop("selected", true);

  populateComponentData(currentComponent);
}

// manage loading the sibling section
function handleSiblingSection() {
  $("#siblings-dropdown").empty();
  $("#sibling-data :input").prop("disabled", false);

  // create a new sibling list after sorting the siblings
  currentComponent.siblings.sort((a, b) => Number(a.id) - Number(b.id));
  for (let i = 0; i < currentComponent.siblings.length; i++) {
    let s = currentComponent.siblings[i];
    let matchingComp = componentList.find((v) => v.id === s.id);
    let label = `${matchingComp.id}: ${matchingComp.name}`;
    let value = `${matchingComp.id}-${cleanupName(matchingComp.name)}`;
    $("<option>")
      .attr("value", value)
      .attr("id", `sib-${value}`)
      .text(label)
      .appendTo("#siblings-dropdown");
  }
  if (!currentSibling) {
    currentSibling = currentComponent.siblings[0];
  }

  const value = `${currentSibling.id}-${cleanupName(
    componentList.find((v) => v.id == currentSibling.id).name
  )}`;
  $(`#siblings-dropdown option[value=${value}]`).prop("selected", true);
  populateSiblingData(currentSibling);
}

// manage loading the subcomponent section
function handleSubcomponentSection() {
  $("#subcomponents-dropdown").empty();
  $("#subcomponent-data :input").prop("disabled", false);

  // create a new subcomponent list after sorting the subcomponents
  currentComponent.components.sort((a, b) => Number(a.id) - Number(b.id));
  for (let i = 0; i < currentComponent.components.length; i++) {
    let s = currentComponent.components[i];
    let matchingComp = componentList.find((v) => v.id === s.id);
    let label = `${matchingComp.id}: ${matchingComp.name}`;
    let value = `${matchingComp.id}-${cleanupName(matchingComp.name)}`;
    $("<option>")
      .attr("value", value)
      .attr("id", `sub-${value}`)
      .text(label)
      .appendTo("#subcomponents-dropdown");
  }
  if (!currentSubcomponent) {
    currentSubcomponent = currentComponent.components[0];
  }

  const value = `${currentSubcomponent.id}-${cleanupName(
    componentList.find((v) => v.id == currentSubcomponent.id).name
  )}`;
  $(`#subcomponents-dropdown option[value=${value}]`).prop("selected", true);

  populateSubcomponentData(currentSubcomponent);
}

// manage loading the transformation section
function handleTransformationSection() {
  $("#transformations-dropdown").empty();
  $("#transformation-data :input").prop("disabled", false);

  // create a new transformation list
  for (let i = 0; i < currentComponent.transformations.length; i++) {
    let t = currentComponent.transformations[i];
    let label = `${i}: ${capitalize(t.transformationNature)} ${t.type}`;
    let value = `${i}-${capitalize(t.transformationNature)}-${t.type}`;
    $("<option>")
      .attr("value", value)
      .attr("id", `trans-${value}`)
      .text(label)
      .appendTo("#transformations-dropdown");
  }
  if (!currentTransformation) {
    currentTransformation = currentComponent.transformations[0];
  }
  populateTransformationData(currentTransformation);
}

// download the data as a json file
function download(content, fileName, contentType) {
  let a = document.createElement("a");
  let file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

///////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS                                                                      //
///////////////////////////////////////////////////////////////////////////////////////////

// construct all options for connection types for subcomponents
function constructConnectionOptionsForSubcomponents() {
  // call the "constructor" function for every connection type
  constructConnectionOptionsForId("#sub-wup-con-dropdown");
  constructConnectionOptionsForId("#sub-wdown-con-dropdown");
  constructConnectionOptionsForId("#sub-kup-con-dropdown");
  constructConnectionOptionsForId("#sub-kdown-con-dropdown");
  constructConnectionOptionsForId("#sub-pup-con-dropdown");
  constructConnectionOptionsForId("#sub-pdown-con-dropdown");
}

// construct all options for connection types for siblings
function constructConnectionOptionsForSiblings() {
  constructConnectionOptionsForId("#sib-wup-con-dropdown");
  constructConnectionOptionsForId("#sib-wdown-con-dropdown");
  constructConnectionOptionsForId("#sib-kup-con-dropdown");
  constructConnectionOptionsForId("#sib-kdown-con-dropdown");
  constructConnectionOptionsForId("#sib-pup-con-dropdown");
  constructConnectionOptionsForId("#sib-pdown-con-dropdown");
}

// actually create specific options for a specific id
function constructConnectionOptionsForId(id) {
  $(id).empty();
  const idBase = id.slice(0, id.lastIndexOf("-"));
  $("<option>")
    .attr("value", "None")
    .text("None")
    .attr("id", `${idBase}-none`)
    .appendTo(id);
  $("<option>")
    .attr("value", "Open")
    .text("Open")
    .attr("id", `${idBase}-open`)
    .appendTo(id);
  $("<option>")
    .attr("value", "On-Demand")
    .text("On-Demand")
    .attr("id", `${idBase}-od`)
    .appendTo(id);
  $("<option>")
    .attr("value", "On-Demand-Up")
    .text("On-Demand U")
    .attr("id", `${idBase}-odu`)
    .appendTo(id);
  $("<option>")
    .attr("value", "On-Demand-Down")
    .text("On-Demand D")
    .attr("id", `${idBase}-odd`)
    .appendTo(id);
  $("<option>")
    .attr("value", "Variable")
    .text("Variable")
    .attr("id", `${idBase}-variable`)
    .appendTo(id);
}

// clear all component entries
function clearComponentEntries() {}

// clear all sibling entries
function clearSiblingEntries() {}

// clear all subcomonent entries
function clearSubcomponentEntries() {}

// clear all transformation entries
function clearTransformationEntries() {
  $("#trans-type-entry").val("");
  $("#trans-nature-dropdown option[value=Past]").prop("selected", true);
}

// calculate where the initial position of a grid box should be when it appears
function calculateGridPosition(boxId, buttonId) {
  let boxHeight = $(boxId).height();
  return Math.max(
    2,
    Math.min(
      $(buttonId).offset().top - boxHeight / 2,
      window.innerHeight - boxHeight - 4
    )
  );
}

// search for valid subcomponents by checking for potential cycles;
// return all valid subcomponents found
function findValidSubcomponents(componentList, checkComponentList) {
  const validComponents = [];
  for (let i = 0; i < checkComponentList.length; i++) {
    if (
      !testForCyclesTraversal(componentList, checkComponentList[i], [
        checkComponentList[i].id,
      ])
    ) {
      validComponents.push(checkComponentList[i]);
    }
  }

  return validComponents;
}

// traverse through a component's subcomponents and make sure that there are no cyclical subcomponent relationships;
// return true if a cycle is found (bad) and false if no cycle is found;
// this is basically the cycle check but without error messages
function testForCyclesTraversal(componentList, component, path) {
  const newPath = path.map((v) => v);
  newPath.push(component.id);

  // traverse all subcomponents
  for (let i = 0; i < component.components.length; i++) {
    const nextComponent = componentList.find(
      (v) => v.id === component.components[i].id
    );
    if (path.includes(nextComponent.id)) {
      return true;
    } else if (!testForCyclesTraversal(componentList, nextComponent, newPath)) {
      return true;
    }
  }

  return false;
}

// return the value of a connection dropdown option given the stored data value
function getConnDropdownValue(connection) {
  if (connection === "on-demand") return "On-Demand";
  if (connection === "on-demand-u") return "On-Demand-Up";
  if (connection === "on-demand-d") return "On-Demand-Down";
  return capitalize(connection);
}

// return the value of a connection dropdown option given the stored data value
function getStructureNatureDropdownValue(nature) {
  if (nature === "effectively permanent") return "Effectively-Permanent";
  if (nature === "semi-permanent") return "Semi-Permanent";
  if (nature === "effectively semi-permanent")
    return "Effectively-Semi-Permanent";
  return capitalize(nature);
}

// get a structure value into a valid structure nature string
function getStructureNature(nature) {
  if (nature === "Effectively Permanent") return "effectively permanent";
  if (nature === "Semi-Permanent") return "semi-permanent";
  if (nature === "Effectively Semi-Permanent")
    return "effectively semi-permanent";
  return nature.toLowerCase();
}

// get a connection type from a text value
function getConType(connection) {
  return connection.toLowerCase().replace(" ", "-");
}

// Verify that all components are interconnected in some way
function dataHolisticCheck(componentList) {
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
      `Cannot remove subcomponent without disconnecting other components from the overall intelligence. If this subcomponent is removed, then from id 0, the following component ids would not be reachable: ${unvisitedIds}`
    );
    return false;
  }
  return true;
}
