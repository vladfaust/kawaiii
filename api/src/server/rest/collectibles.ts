import { Router } from "express";

import auth from "./middleware/auth";
import zodError from "./middleware/zodError";

import content from "./collectibles/content";
import metadata from "./collectibles/metadata";
import preview from "./collectibles/preview";
import previewPreview from "./collectibles/previewPreview";

const router: Router = Router()
  .use(auth)
  .use(zodError)

  // The original collectibe token preview.
  .get("/:collectibleId/preview", preview)

  // A low-res preview of the collectible preview.
  .get("/:collectibleId/preview/preview", previewPreview)

  // The collectible metadata.
  .get("/:collectibleId/metadata.json", metadata)

  // The collectible content.
  .use(
    "/:collectibleId/content",
    (req, res, next) => {
      res.locals.collectibleId = req.params.collectibleId;
      next();
    },
    content
  );

export default router;
