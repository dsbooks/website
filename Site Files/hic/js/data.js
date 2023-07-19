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
  $("#transformations-dropdown").change(selectTransformation);
  $("#add-transformation-button").click(addTransformation);
  $("#delete-transformation-button").click(deleteTransformation);
  $(".collapse-trigger").click(toggleDataSection);

  // register editing events (the toggle buttons are technically not editing, but whatevs)
  // registration of events for the grid buttons are handled in the grid html files
  $("#trans-type-grid-button").click(toggleOneTypeGrid);
  $("#trans-nature-dropdown").change(changeTransformationNature);
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
  let id = $(this)
    .find("option:selected")
    .text()
    .replace(/(^\d+)(.+$)/i, "$1");

  let found = componentList.find((v) => v.id == id);

  if (found === currentComponent) return;
  currentComponent = found;
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
  $("<option>")
    .attr("value", label)
    .attr("id", "comp-" + label)
    .text(label)
    .appendTo("#components-dropdown");

  // select the new component and repopulate based on it
  $(`#components-dropdown`).val(label);
  currentComponent = componentList[componentList.length - 1];
  populateComponentData(currentComponent);
}

// delete the currently selected component and all sibling/subcomponent references to the component
function deleteComponent() {}

// select a component when clicked on and repopulate data fields based on this component
function selectTransformation() {
  let id = $(this)
    .find("option:selected")
    .text()
    .replace(/(^\d+)(.+$)/i, "$1");

  currentTransformation = currentComponent.transformations[id];
  populateTransformationData(currentTransformation);
}

// add a new, default transformation
function addTransformation() {
  // don't do anything if there isn't a component to add transformations to
  if (!currentComponent) return;

  $("#transformation-data :input").prop("disabled", false);
  const label = `${currentComponent.transformations.length}: Past 1a`;
  const value = `${currentComponent.transformations.length}-Past-1a`;

  // create a new component and option
  currentComponent.transformations.push(new Transformation());
  $("<option>")
    .attr("value", value)
    .attr("id", "trans-" + value)
    .text(label)
    .appendTo("#transformations-dropdown");

  // select the new component and repopulate based on it
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
  currentTransformation.transformationNature = nature.trim().toLowerCase();

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

///////////////////////////////////////////////////////////////////////////////////////////
// LOADING AND SAVING FUNCTIONS                                                          //
///////////////////////////////////////////////////////////////////////////////////////////

// load a json file
function load(fileName) {
  $.getJSON(fileName, function (json) {
    let good = validate(json);
    if (good) {
      componentList = json;
    } else {
      componentList = [];
    }
    populateDataFields(componentList);
  });
}

// refresh all data fields based on a component list
function populateDataFields(componentList) {
  // disable all fields by default in case one data section is no longer valid
  $("#component-data :input").prop("disabled", true);
  $("#sibling-data :input").prop("disabled", true);
  $("#subcomponent-data :input").prop("disabled", true);
  $("#transformation-data :input").prop("disabled", true);

  // clear all dropdown lists
  $("#components-dropdown").empty();
  $("#transformations-dropdown").empty();

  if (componentList.length) {
    // create a new component list
    componentList.forEach((element) => {
      let label = element.name
        ? `${element.id}: ${element.name}`
        : `element.id`;
      let value = element.name ? `${element.id}-${element.name}` : `element.id`;
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
    populateComponentData(currentComponent);
    if (currentComponent.siblings.length) {
      $("#sibling-data :input").prop("disabled", false);
      // create a new sibling list

      currentSibling = currentComponent.siblings[0];
      populateSiblingData(currentSibling);
    }
    if (currentComponent.components.length) {
      $("#subcomponent-data :input").prop("disabled", false);
      // create a new subcomponent list

      currentSubcomponent = currentComponent.components[0];
      populateSubcomponentData(currentSubcomponent);
    }
    if (currentComponent.transformations.length) {
      $("#transformation-data :input").prop("disabled", false);

      // create a new transformation list
      for (var i = 0; i < currentComponent.transformations.length; i++) {
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
    $("#integration-row").hide();
    $("#shared-will-row").hide();
    $("#shared-knowledge-row").hide();
    $("#shared-personality-row").hide();
    $("#component-exchange-row").hide();
  } else {
    $("#integration-row").show();
    $("#shared-will-row").show();
    $("#shared-knowledge-row").show();
    $("#shared-personality-row").show();
    $("#component-exchange-row").show();
    $("#integration-entry").val(comp.integrationSpectrum);
    $("#shared-will-entry").val(comp.sharedWillDegree);
    $("#shared-knowledge-entry").val(comp.sharedKnowledgeDegree);
    $("#shared-personality-entry").val(comp.sharedPersonalityDegree);
    if (comp.componentExchangeAllowed)
      $("#component-exchange-box").prop("checked", true);
  }
  if (!structureIsFluid(comp.type)) {
    $("#fluid-range-row").hide();
  } else {
    $("#fluid-range-row").show();
    $("#fluid-range-entry").val(JSON.stringify(comp.fluidRange));
  }
}

// populate all data fields for a specific sibling
function populateSiblingData(sib) {}

// populate all data fields for a specific subcomponent
function populateSubcomponentData(sub) {}

// populate all data fields for a specific transformation
function populateTransformationData(trans) {
  $("#trans-type-entry").val(JSON.stringify(trans.type));
  let value = capitalize(trans.transformationNature);
  $(`#trans-nature-dropdown option[value=${value}]`).prop("selected", true);
}

// download the data as a json file
function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

///////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS                                                                      //
///////////////////////////////////////////////////////////////////////////////////////////

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
