// Below are the classes and constructors for components, siblings, subcomponents, and transformations
class Component {
  constructor(id) {
    this.id = id;
    this.name = "unnamed";
    this.type = "1a";
    this.groupSummary = false;
    this.componentIdentity = 1;
    this.collectiveIdentity = 0;
    this.originalCount = 1;
    this.assimilatedCount = 0;
    this.generatedCount = 0;
    this.otherCount = 0;
    this.transformations = [];
    this.siblings = [];
    this.components = [];
  }
}

class Subcomponent {
  constructor(id) {
    this.id = id;
    this.structureNature = "permanent";
    this.parentWillUpConnection = "none";
    this.parentWillDownConnection = "none";
    this.parentWillUpDegree = 0;
    this.parentWillDownDegree = 0;
    this.parentKnowledgeUpConnection = "none";
    this.parentKnowledgeDownConnection = "none";
    this.parentKnowledgeUpDegree = 0;
    this.parentKnowledgeDownDegree = 0;
    this.parentPersonalityUpConnection = "none";
    this.parentPersonalityDownConnection = "none";
    this.parentPersonalityUpDegree = 0;
    this.parentPersonalityDownDegree = 0;
  }
}

class Sibling {}

class Transformation {
  constructor(type = "1a", nature = "past") {
    this.type = type;
    this.transformationNature = nature;
  }
}

// below are all valid values for various fields in components
const validStructureTypes = [
  "1a",
  "1b",
  "1c",
  "1d",
  "1e",
  "2a",
  "2b",
  "2c",
  "2d",
  "2e",
  "3a",
  "3b",
  "3c",
  "3d",
  "3e",
  "4a",
  "4b",
  "4c",
  "4d",
  "5a",
  "5b",
  "5c",
  "5d",
  "6a",
  "6b",
  "6c",
  "7a",
  "7b",
  "7c",
  "8",
];

const validConnectionTypes = [
  "open",
  "on-demand",
  "on-demand-u",
  "on-demand-d",
  "none",
  "variable",
];
const validTransferTypes = ["up", "down", "both", "none"];
const validTransformationNatures = ["reversible", "future", "past"];
const validStructureNatures = [
  "permanent",
  "effectively permanent",
  "semi-permanent",
  "effectively semi-permanent",
  "reversible",
  "ephemeral",
];
