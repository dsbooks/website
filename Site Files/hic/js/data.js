///////////////////////////////////////////////////////////////////////////////////////////
// SETUP                                                                                 //
///////////////////////////////////////////////////////////////////////////////////////////
let componentList;
let currentComponent;
let currentSibling;
let currentSubcomponent;
let currentTransformation;

$(() => {
  // register component-related events
  $("#components-dropdown").change(selectComponent);
  $("#add-component-button").click(addComponent);
  $("#delete-component-button").click(deleteComponent);
  $("#transformation-dropdown").change(selectTransformation);
  $("#add-transformation-button").click(addTransformation);
  $("#delete-transformation-button").click(deleteTransformation);
  $(".collapse-trigger").click(toggleDataSection);
});
///////////////////////////////////////////////////////////////////////////////////////////
// COMPONENT FUNCTIONS                                                                   //
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

  currentComponent = componentList.find((v) => v.id == id);
  populateComponentData(currentComponent);
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
    .attr("id", label)
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
  const label = currentComponent.transformations.length + ": past 1a";

  // create a new component and option
  currentComponent.transformations.push(new Transformation());
  $("<option>")
    .attr("value", label)
    .attr("id", label)
    .text(label)
    .appendTo("#transformation-dropdown");

  // select the new component and repopulate based on it
  $(`#transformation-dropdown`).val(label);
  currentTransformation =
    currentComponent.transformations[
      currentComponent.transformations.length - 1
    ];
  populateTransformationData(currentTransformation);
}

// delete the currently selected transformation
function deleteTransformation() {}

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
    repopulateDataFields(componentList);
  });
}

// refresh all data fields based on a component list
function repopulateDataFields(componentList) {
  // clear the component list
  $("#components-dropdown").empty();

  // create a new component list
  componentList.forEach((element) => {
    let label = element.name ? `${element.id}: ${element.name}` : `element.id`;
    $("<option>")
      .attr("value", label)
      .attr("id", `comp-${label}`)
      .text(label)
      .appendTo("#components-dropdown");
  });

  if (componentList.length) {
    currentComponent = componentList[0];
    populateComponentData(currentComponent);
    if (currentComponent.siblings) {
      // create a new sibling list

      currentSibling = currentComponent.siblings[0];
      populateSiblingData(currentSibling);
    }
    if (currentComponent.components) {
      // create a new subcomponent list

      currentSubcomponent = currentComponent.components[0];
      populateSubcomponentData(currentSubcomponent);
    }
    if (currentComponent.transformations) {
      // create a new transformation list
      for (var i = 0; i < currentComponent.transformations.length; i++) {
        let t = currentComponent.transformations[i];
        let label = `${i}: ${capitalize(t.transformationNature)} ${t.type}`;
        $("<option>")
          .attr("value", label)
          .attr("id", `trans-${label}`)
          .text(label)
          .appendTo("#transformation-dropdown");
      }
      currentTransformation = currentComponent.transformations[0];
      populateTransformationData(currentTransformation);
    }
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
// HELPER FUNCTIONS                                                              //
///////////////////////////////////////////////////////////////////////////////////////////
