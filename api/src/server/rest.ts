import { Router } from "express";

import authRouter from "./rest/auth";
import collectibles from "./rest/collectibles";
import users from "./rest/users";

const router: Router = Router()
  .use("/auth", authRouter)
  .use("/collectibles", collectibles)
  .use("/users", users);

export default router;
