import type { UmlElementId } from "../model/types.js";

export interface ClassGenerationProfile {
  classId: UmlElementId;
  entity?: boolean;
  auditable?: boolean;
  readOnly?: boolean;
  searchable?: boolean;
  crud?: boolean;
}

export interface AttributeGenerationProfile {
  attributeId: UmlElementId;
  required?: boolean;
  unique?: boolean;
  sortable?: boolean;
}

export interface DefaultSortProfile {
  classId: UmlElementId;
  attributeId: UmlElementId;
  direction: "asc" | "desc";
}

export interface GenerationProfile {
  classes: ClassGenerationProfile[];
  attributes: AttributeGenerationProfile[];
  defaultSort: DefaultSortProfile[];
}

export const emptyGenerationProfile = (): GenerationProfile => ({
  classes: [],
  attributes: [],
  defaultSort: [],
});
