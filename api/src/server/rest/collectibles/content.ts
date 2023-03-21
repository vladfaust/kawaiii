import { Router } from "express";

import get from "./content/get";
import preview from "./content/preview";
import previewBlurred from "./content/previewBlurred";
import contentGate from "../middleware/contentGate";

const router: Router = Router()
  .get("/:contentName/", contentGate, get)
  .get("/:contentName/preview", contentGate, preview)
  .get("/:contentName/previewBlurred", previewBlurred);

export default router;
