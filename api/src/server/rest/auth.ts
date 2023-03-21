import { Router } from "express";

import create from "./auth/create";
import delete_ from "./auth/delete";
import get from "./auth/get";

const router: Router = Router()
  .post("/", create)
  .get("/", get)
  .delete("/", delete_);

export default router;
