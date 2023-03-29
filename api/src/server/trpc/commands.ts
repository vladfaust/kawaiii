import t from "#trpc";

import collectibles from "./commands/collectibles";
import ethPrice from "./commands/ethPrice";
import users from "./commands/users";

export const commandsRouter = t.router({
  collectibles,
  ethPrice,
  users,
});

export type CommandsRouter = typeof commandsRouter;
