export type UmlElementId = string;

export type Visibility = "public" | "protected" | "private" | "package";

export type PrimitiveTypeName =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "uuid";

export type UmlTypeReference =
  | {
      kind: "primitive";
      name: PrimitiveTypeName;
    }
  | {
      kind: "classifier";
      classifierId: UmlElementId;
    };

export interface UmlMultiplicity {
  lower: number;
  upper: number | "*";
}

export interface UmlPackage {
  kind: "package";
  id: UmlElementId;
  name: string;
  parentPackageId?: UmlElementId;
}

export interface UmlAttribute {
  kind: "attribute";
  id: UmlElementId;
  name: string;
  visibility: Visibility;
  type: UmlTypeReference;
  multiplicity: UmlMultiplicity;
}

export interface UmlParameter {
  kind: "parameter";
  id: UmlElementId;
  name: string;
  type: UmlTypeReference;
  multiplicity: UmlMultiplicity;
}

export interface UmlOperation {
  kind: "operation";
  id: UmlElementId;
  name: string;
  visibility: Visibility;
  parameters: UmlParameter[];
  returnType?: UmlTypeReference;
}

export interface UmlClass {
  kind: "class";
  id: UmlElementId;
  name: string;
  packageId?: UmlElementId;
  attributes: UmlAttribute[];
  operations: UmlOperation[];
}

export interface UmlEnumerationLiteral {
  kind: "enumeration-literal";
  id: UmlElementId;
  name: string;
}

export interface UmlEnumeration {
  kind: "enumeration";
  id: UmlElementId;
  name: string;
  packageId?: UmlElementId;
  literals: UmlEnumerationLiteral[];
}

export type UmlClassifier = UmlClass | UmlEnumeration;

export type AggregationKind = "none" | "shared" | "composite";

export interface UmlAssociationEnd {
  kind: "association-end";
  id: UmlElementId;
  classifierId: UmlElementId;
  roleName?: string;
  multiplicity: UmlMultiplicity;
  aggregation: AggregationKind;
}

export interface UmlAssociation {
  kind: "association";
  id: UmlElementId;
  name?: string;
  ends: [UmlAssociationEnd, UmlAssociationEnd];
}

export interface UmlGeneralization {
  kind: "generalization";
  id: UmlElementId;
  specificId: UmlElementId;
  generalId: UmlElementId;
}

export interface CanonicalUmlModel {
  packages: UmlPackage[];
  classes: UmlClass[];
  enumerations: UmlEnumeration[];
  associations: UmlAssociation[];
  generalizations: UmlGeneralization[];
}

export interface DiagramNodeLayout {
  elementId: UmlElementId;
  x: number;
  y: number;
}

export interface DiagramLayout {
  nodes: DiagramNodeLayout[];
}

export const primitiveType = (name: PrimitiveTypeName): UmlTypeReference => ({
  kind: "primitive",
  name,
});

export const classifierType = (
  classifierId: UmlElementId,
): UmlTypeReference => ({
  kind: "classifier",
  classifierId,
});

export const multiplicity = (
  lower: number,
  upper: number | "*",
): UmlMultiplicity => ({ lower, upper });

export const emptyCanonicalUmlModel = (): CanonicalUmlModel => ({
  packages: [],
  classes: [],
  enumerations: [],
  associations: [],
  generalizations: [],
});

export const emptyDiagramLayout = (): DiagramLayout => ({ nodes: [] });
