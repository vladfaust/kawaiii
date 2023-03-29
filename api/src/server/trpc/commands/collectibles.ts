import { t } from "#trpc";

import create from "./collectibles/create";
import get from "./collectibles/get";
import getEditions from "./collectibles/getEditions";
import getLikesCount from "./collectibles/getLikesCount";
import indexCollected from "./collectibles/indexCollected";
import isLikedByMe from "./collectibles/isLikedByMe";
import like from "./collectibles/like";
import listByCreator from "./collectibles/listByCreator";
import listLiked from "./collectibles/listLiked";
import unlike from "./collectibles/unlike";

export default t.router({
  create,
  get,
  getEditions,
  getLikesCount,
  indexCollected,
  isLikedByMe,
  like,
  listByCreator,
  listLiked,
  unlike,
});
