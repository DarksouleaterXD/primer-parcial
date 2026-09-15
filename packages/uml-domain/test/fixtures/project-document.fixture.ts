import {
  type ProjectDocument,
  classifierType,
  multiplicity,
  primitiveType,
} from "../../src/index.js";

export const ids = {
  document: "00000000-0000-4000-8000-000000000001",
  owner: "00000000-0000-4000-8000-000000000002",
  packageDomain: "00000000-0000-4000-8000-000000000003",
  userClass: "00000000-0000-4000-8000-000000000004",
  adminClass: "00000000-0000-4000-8000-000000000005",
  roleEnum: "00000000-0000-4000-8000-000000000006",
  emailAttribute: "00000000-0000-4000-8000-000000000007",
  roleAttribute: "00000000-0000-4000-8000-000000000008",
  renameOperation: "00000000-0000-4000-8000-000000000009",
  renameParameter: "00000000-0000-4000-8000-000000000010",
  roleLiteralAdmin: "00000000-0000-4000-8000-000000000011",
  roleLiteralUser: "00000000-0000-4000-8000-000000000012",
  association: "00000000-0000-4000-8000-000000000013",
  associationUserEnd: "00000000-0000-4000-8000-000000000014",
  associationRoleEnd: "00000000-0000-4000-8000-000000000015",
  generalization: "00000000-0000-4000-8000-000000000016",
} as const;

export const createValidProjectDocumentFixture = (): ProjectDocument => ({
  schemaVersion: 1,
  id: ids.document,
  name: "Modelo de cuentas",
  ownerId: ids.owner,
  revision: 3,
  createdAt: "2026-09-14T12:00:00.000Z",
  updatedAt: "2026-09-14T12:30:00.000Z",
  uml: {
    packages: [
      {
        kind: "package",
        id: ids.packageDomain,
        name: "Domain",
      },
    ],
    classes: [
      {
        kind: "class",
        id: ids.userClass,
        name: "User",
        packageId: ids.packageDomain,
        attributes: [
          {
            kind: "attribute",
            id: ids.emailAttribute,
            name: "email",
            visibility: "private",
            type: primitiveType("string"),
            multiplicity: multiplicity(1, 1),
          },
          {
            kind: "attribute",
            id: ids.roleAttribute,
            name: "role",
            visibility: "private",
            type: classifierType(ids.roleEnum),
            multiplicity: multiplicity(1, 1),
          },
        ],
        operations: [
          {
            kind: "operation",
            id: ids.renameOperation,
            name: "rename",
            visibility: "public",
            parameters: [
              {
                kind: "parameter",
                id: ids.renameParameter,
                name: "name",
                type: primitiveType("string"),
                multiplicity: multiplicity(1, 1),
              },
            ],
          },
        ],
      },
      {
        kind: "class",
        id: ids.adminClass,
        name: "Admin",
        packageId: ids.packageDomain,
        attributes: [],
        operations: [],
      },
    ],
    enumerations: [
      {
        kind: "enumeration",
        id: ids.roleEnum,
        name: "Role",
        packageId: ids.packageDomain,
        literals: [
          {
            kind: "enumeration-literal",
            id: ids.roleLiteralAdmin,
            name: "ADMIN",
          },
          {
            kind: "enumeration-literal",
            id: ids.roleLiteralUser,
            name: "USER",
          },
        ],
      },
    ],
    associations: [
      {
        kind: "association",
        id: ids.association,
        name: "userRole",
        ends: [
          {
            kind: "association-end",
            id: ids.associationUserEnd,
            classifierId: ids.userClass,
            roleName: "users",
            multiplicity: multiplicity(0, "*"),
            aggregation: "none",
          },
          {
            kind: "association-end",
            id: ids.associationRoleEnd,
            classifierId: ids.roleEnum,
            roleName: "role",
            multiplicity: multiplicity(1, 1),
            aggregation: "shared",
          },
        ],
      },
    ],
    generalizations: [
      {
        kind: "generalization",
        id: ids.generalization,
        specificId: ids.adminClass,
        generalId: ids.userClass,
      },
    ],
  },
  layout: {
    nodes: [
      { elementId: ids.packageDomain, x: 40, y: 40 },
      { elementId: ids.userClass, x: 120, y: 90 },
      { elementId: ids.adminClass, x: 420, y: 90 },
      { elementId: ids.roleEnum, x: 120, y: 360 },
    ],
  },
  generationProfile: {
    classes: [
      {
        classId: ids.userClass,
        entity: true,
        auditable: true,
        readOnly: false,
        searchable: true,
        crud: true,
      },
    ],
    attributes: [
      {
        attributeId: ids.emailAttribute,
        required: true,
        unique: true,
        sortable: true,
      },
    ],
    defaultSort: [
      {
        classId: ids.userClass,
        attributeId: ids.emailAttribute,
        direction: "asc",
      },
    ],
  },
});
