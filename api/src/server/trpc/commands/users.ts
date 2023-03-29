import { t } from "#trpc";

import feed from "./users/feed";
import follow from "./users/follow";
import get from "./users/get";
import getBgpUploadUrl from "./users/getBgpUploadUrl";
import getCollectorsCount from "./users/getCollectorsCount";
import getFollowees from "./users/getFollowees";
import getFolloweesCount from "./users/getFolloweesCount";
import getFollowersCount from "./users/getFollowersCount";
import getLikesToCount from "./users/getLikesToCount";
import getPfpUploadUrl from "./users/getPfpUploadUrl";
import getValue from "./users/getValue";
import isFollowing from "./users/isFollowing";
import lookup from "./users/lookup";
import unfollow from "./users/unfollow";
import update from "./users/update";

export default t.router({
  feed,
  follow,
  get,
  getBgpUploadUrl,
  getCollectorsCount,
  getFollowees,
  getFolloweesCount,
  getFollowersCount,
  getLikesToCount,
  getPfpUploadUrl,
  getValue,
  isFollowing,
  lookup,
  unfollow,
  update,
});
