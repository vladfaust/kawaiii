import { Router } from "express";

import bgp from "./users/bgp";
import pfp from "./users/pfp";

const router: Router = Router()
  .get("/:userId/bgp", bgp)
  .get("/:userId/pfp", pfp);

export default router;
