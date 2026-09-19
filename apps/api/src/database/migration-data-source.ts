import { createRequire } from "node:module";
import { DataSource } from "typeorm";

// TypeORM executes this datasource through its CommonJS ts-node launcher.
const load = createRequire(__filename);
const { readApiConfiguration } = load("../config/api-configuration");
const { CreateUsers1736800000000 } = load("../migrations/1736800000000-create-users");
const { AddUserNames1736900000000 } = load("../migrations/1736900000000-add-user-names");
const { CreateUmlProjects1737000000000 } = load("../migrations/1737000000000-create-uml-projects");
const { User } = load("../users/user.entity");
const { UmlProjectEntity } = load("../projects/uml-project.entity");

const configuration = readApiConfiguration();

export default new DataSource({
  ...configuration.database,
  entities: [User, UmlProjectEntity],
  migrations: [CreateUsers1736800000000, AddUserNames1736900000000, CreateUmlProjects1737000000000],
  synchronize: false,
});
