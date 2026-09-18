import {
  classifierType,
  createProjectDocument,
  emptyGenerationProfile,
  multiplicity,
  primitiveType,
  type ProjectDocument,
  UmlCommandBus,
} from "@primer-parcial/uml-domain";

import { createUmlWorkspaceAdapter } from "./uml-workspace-adapter";
import {
  createWorkspaceController,
  type WorkspaceController,
  type WorkspaceIdFactory,
} from "./workspace-controller";

export const FIXTURE_IDS = {
  document: "f0000000-0000-4000-8000-000000000001",
  owner: "f0000000-0000-4000-8000-000000000002",
  package: "f0000000-0000-4000-8000-000000000010",
  userClass: "f0000000-0000-4000-8000-000000000020",
  roleEnum: "f0000000-0000-4000-8000-000000000025",
  adminClass: "f0000000-0000-4000-8000-000000000030",
  emailAttribute: "f0000000-0000-4000-8000-000000000031",
  roleAttribute: "f0000000-0000-4000-8000-000000000032",
  signInOperation: "f0000000-0000-4000-8000-000000000033",
  signInParameter: "f0000000-0000-4000-8000-000000000034",
  superuserAttribute: "f0000000-0000-4000-8000-000000000035",
  adminLiteral: "f0000000-0000-4000-8000-000000000040",
  userLiteral: "f0000000-0000-4000-8000-000000000041",
  managesAssociation: "f0000000-0000-4000-8000-000000000050",
  managesUserEnd: "f0000000-0000-4000-8000-000000000051",
  managesAdminEnd: "f0000000-0000-4000-8000-000000000052",
  definesRoleAssociation: "f0000000-0000-4000-8000-000000000053",
  definesRoleUserEnd: "f0000000-0000-4000-8000-000000000054",
  definesRoleRoleEnd: "f0000000-0000-4000-8000-000000000055",
  generalization: "f0000000-0000-4000-8000-000000000060",
} as const;

export interface RelationsFixtureLayout {
  readonly package: { readonly x: number; readonly y: number };
  readonly userClass: { readonly x: number; readonly y: number };
  readonly roleEnum: { readonly x: number; readonly y: number };
}

export const RELATIONS_FIXTURE_LAYOUT: RelationsFixtureLayout = {
  package: { x: 40, y: 40 },
  userClass: { x: 560, y: 60 },
  roleEnum: { x: 580, y: 320 },
};

export const RELATIONS_FIXTURE_FALLBACK = {
  adminClass: { x: 80, y: 260 },
} as const;

/** Helper de dev/test: monta un controller sobre un documento prefabricado con las mismas APIs publicas del bootstrap productivo. */
export const createWorkspaceSessionFromDocument = (
  document: ProjectDocument,
  idFactory?: WorkspaceIdFactory,
): WorkspaceController =>
  createWorkspaceController({
    adapter: createUmlWorkspaceAdapter(new UmlCommandBus(document)),
    idFactory,
  });

export const createRelationsFixtureDocument = (): ProjectDocument => {
  const base = createProjectDocument({
    name: "Relations verification fixture",
    ownerId: FIXTURE_IDS.owner,
    idFactory: () => FIXTURE_IDS.document,
    clock: () => new Date("2026-09-17T10:00:00.000Z"),
  });

  return {
    ...base,
    uml: {
      packages: [{ kind: "package", id: FIXTURE_IDS.package, name: "Domain" }],
      classes: [
        {
          kind: "class",
          id: FIXTURE_IDS.userClass,
          name: "User",
          packageId: FIXTURE_IDS.package,
          attributes: [
            {
              kind: "attribute",
              id: FIXTURE_IDS.emailAttribute,
              name: "email",
              visibility: "private",
              type: primitiveType("string"),
              multiplicity: multiplicity(1, 1),
            },
            {
              kind: "attribute",
              id: FIXTURE_IDS.roleAttribute,
              name: "role",
              visibility: "private",
              type: classifierType(FIXTURE_IDS.roleEnum),
              multiplicity: multiplicity(1, 1),
            },
          ],
          operations: [
            {
              kind: "operation",
              id: FIXTURE_IDS.signInOperation,
              name: "signIn",
              visibility: "public",
              parameters: [
                {
                  kind: "parameter",
                  id: FIXTURE_IDS.signInParameter,
                  name: "password",
                  type: primitiveType("string"),
                  multiplicity: multiplicity(1, 1),
                },
              ],
              returnType: primitiveType("boolean"),
            },
          ],
        },
        {
          kind: "class",
          id: FIXTURE_IDS.adminClass,
          name: "Admin",
          packageId: FIXTURE_IDS.package,
          attributes: [
            {
              kind: "attribute",
              id: FIXTURE_IDS.superuserAttribute,
              name: "isSuperuser",
              visibility: "private",
              type: primitiveType("boolean"),
              multiplicity: multiplicity(1, 1),
            },
          ],
          operations: [],
        },
      ],
      enumerations: [
        {
          kind: "enumeration",
          id: FIXTURE_IDS.roleEnum,
          name: "Role",
          packageId: FIXTURE_IDS.package,
          literals: [
            { kind: "enumeration-literal", id: FIXTURE_IDS.adminLiteral, name: "ADMIN" },
            { kind: "enumeration-literal", id: FIXTURE_IDS.userLiteral, name: "USER" },
          ],
        },
      ],
      associations: [
        {
          kind: "association",
          id: FIXTURE_IDS.managesAssociation,
          name: "manages",
          ends: [
            {
              kind: "association-end",
              id: FIXTURE_IDS.managesUserEnd,
              classifierId: FIXTURE_IDS.userClass,
              roleName: "manager",
              multiplicity: multiplicity(1, 1),
              aggregation: "shared",
            },
            {
              kind: "association-end",
              id: FIXTURE_IDS.managesAdminEnd,
              classifierId: FIXTURE_IDS.adminClass,
              roleName: "reports",
              multiplicity: multiplicity(0, "*"),
              aggregation: "none",
            },
          ],
        },
        {
          kind: "association",
          id: FIXTURE_IDS.definesRoleAssociation,
          name: "defines",
          ends: [
            {
              kind: "association-end",
              id: FIXTURE_IDS.definesRoleUserEnd,
              classifierId: FIXTURE_IDS.userClass,
              multiplicity: multiplicity(1, 1),
              aggregation: "composite",
            },
            {
              kind: "association-end",
              id: FIXTURE_IDS.definesRoleRoleEnd,
              classifierId: FIXTURE_IDS.roleEnum,
              multiplicity: multiplicity(0, "*"),
              aggregation: "none",
            },
          ],
        },
      ],
      generalizations: [
        {
          kind: "generalization",
          id: FIXTURE_IDS.generalization,
          specificId: FIXTURE_IDS.adminClass,
          generalId: FIXTURE_IDS.userClass,
        },
      ],
    },
    layout: {
      nodes: [
        {
          elementId: FIXTURE_IDS.package,
          x: RELATIONS_FIXTURE_LAYOUT.package.x,
          y: RELATIONS_FIXTURE_LAYOUT.package.y,
        },
        {
          elementId: FIXTURE_IDS.userClass,
          x: RELATIONS_FIXTURE_LAYOUT.userClass.x,
          y: RELATIONS_FIXTURE_LAYOUT.userClass.y,
        },
        {
          elementId: FIXTURE_IDS.roleEnum,
          x: RELATIONS_FIXTURE_LAYOUT.roleEnum.x,
          y: RELATIONS_FIXTURE_LAYOUT.roleEnum.y,
        },
      ],
    },
    generationProfile: emptyGenerationProfile(),
  };
};