import config from "@/config";
import { userId } from "@/modules/auth";
import { trpc } from "@/services/api";
import { Deferred } from "@/util/deferred";
import { markRaw, ref } from "vue";

export default class User {
  static idMap = new Map<string, Deferred<User>>();
  static handleMap = new Map<string, Deferred<User | null>>();

  readonly isMeFollowing = ref(false);
  readonly followersCount = ref(0);
  readonly collectorsCount = ref(0);
  readonly likesReceived = ref(0);

  static async lookup(handle: string): Promise<User | null> {
    if (this.handleMap.has(handle)) {
      return this.handleMap.get(handle)!.promise;
    } else {
      const promise = trpc.commands.users.lookup
        .query({ handle })
        .then((res) => {
          if (res) {
            return this.fromData(res);
          } else {
            return null;
          }
        });
      this.handleMap.set(handle, Deferred.from(promise));
      return promise;
    }
  }

  static async find(handle: string): Promise<User> {
    const found = await this.lookup(handle);
    if (!found) throw new Error("User not found");
    return found;
  }

  static async get(id: string): Promise<User> {
    if (this.idMap.has(id)) {
      return this.idMap.get(id)!.promise;
    } else {
      const promise = trpc.commands.users.get
        .query({ id })
        .then((res) => this.fromData(res));
      this.idMap.set(id, Deferred.from(promise));
      return promise;
    }
  }

  private static fromData(data: {
    id: string;
    handle: string | null;
    verified: boolean;
    name: string | null;
    bio: string | null;
    pfpVersion: number;
    bgpVersion: number;
  }): User {
    return markRaw(
      new User(
        data.id,
        data.handle ?? "",
        data.verified,
        data.name ?? "",
        data.bio ?? "",
        data.pfpVersion,
        data.bgpVersion
      )
    );
  }

  private constructor(
    readonly id: string,
    readonly handle: string,
    readonly verified: boolean,
    readonly name: string,
    readonly bio: string,
    readonly pfpVersion: number,
    readonly bgpVersion: number
  ) {
    trpc.commands.users.getLikesToCount
      .query({ userId: this.id })
      .then((res) => {
        this.likesReceived.value = res;
      });

    this.fetchFollowers();
    this.fetchCollectors();
  }

  async fetchFollowers() {
    const promises = [];

    promises.push(
      trpc.commands.users.getFollowersCount
        .query({ followeeId: this.id })
        .then((res) => {
          this.followersCount.value = res;
        })
    );

    if (userId.value && userId.value !== this.id) {
      promises.push(
        trpc.commands.users.isFollowing
          .query({ followeeId: this.id })
          .then((res) => {
            this.isMeFollowing.value = res;
          })
      );
    }

    return Promise.all(promises);
  }

  async fetchCollectors() {
    this.collectorsCount.value =
      await trpc.commands.users.getCollectorsCount.query({
        userId: this.id,
      });
  }

  get bgpUrl(): URL {
    return new URL(
      config.restUrl + "/users/" + this.id + "/bgp?v=" + this.bgpVersion
    );
  }

  get pfpUrl(): URL {
    return new URL(
      config.restUrl + "/users/" + this.id + "/pfp?v=" + this.pfpVersion
    );
  }
}
