import { createRequire } from "node:module";
import { DataSource } from "typeorm";

// TypeORM executes this datasource through its CommonJS ts-node launcher.
const load = createRequire(__filename);
const { readApiConfiguration } = load("../config/api-configuration");
const { CreateUsers1736800000000 } = load("../migrations/1736800000000-create-users");
const { AddUserNames1736900000000 } = load("../migrations/1736900000000-add-user-names");
const { User } = load("../users/user.entity");

const configuration = readApiConfiguration();

export default new DataSource({
  ...configuration.database,
  entities: [User],
  migrations: [CreateUsers1736800000000, AddUserNames1736900000000],
  synchronize: false,
});
