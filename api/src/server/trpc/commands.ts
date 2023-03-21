import t from "#trpc";

import collectibles from "./commands/collectibles";
import users from "./commands/users";

export const commandsRouter = t.router({
  collectibles,
  users,
});

export type CommandsRouter = typeof commandsRouter;
