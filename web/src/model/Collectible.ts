import config from "@/config";
import { trpc } from "@/services/api";
import { account } from "@/services/eth";
import { balanceOfCollectible } from "@/services/eth/collectible";
import { toHex, toUint8Array } from "@/util";
import { Deferred } from "@/util/deferred";
import { Buffer, bufferToUint8Array } from "@/util/prisma";
import { BigNumber } from "ethers";
import { computed, markRaw, ref, Ref, watch } from "vue";
import Content from "./Collectible/Content";
import User from "./User";

export default class Collectible {
  static idMap = new Map<string, Deferred<Collectible>>();

  readonly likes = ref(0);
  readonly likedByMe = ref(false);
  readonly totalSupply: Ref<BigNumber> = ref(BigNumber.from(0));
  readonly balance: Ref<BigNumber> = ref(BigNumber.from(0));
  readonly collected = computed(() => this.balance.value.gt(0));
  readonly capReached = computed(() =>
    this.totalSupply.value.gte(this.editions)
  );
  readonly totalValue = computed(() =>
    this.totalSupply.value.mul(this.mintPrice)
  );

  private _content: Content[];

  static async get(id: Uint8Array): Promise<Collectible> {
    if (this.idMap.has(toHex(id))) {
      return this.idMap.get(toHex(id))!.promise;
    } else {
      const promise = trpc.commands.collectibles.get
        .query({ id: toHex(id) })
        .then((data) => Collectible.fromBackend(data));
      this.idMap.set(toHex(id), Deferred.from(promise));
      return promise;
    }
  }

  static fromBackend(data: {
    id: string;
    Creator: { id: string };
    name: string;
    description: string | null;
    mintPrice: Buffer;
    editions: number;
    royalty: number;
    createdAt: string;
    Content: {
      type: "Image";
      name: string;
      size: number;
      gated: boolean;
    }[];
  }) {
    const collectible = markRaw(
      new Collectible(
        toUint8Array(data.id),
        Deferred.from(User.get(data.Creator.id)),
        data.name,
        data.description,
        BigNumber.from(bufferToUint8Array(data.mintPrice)),
        data.editions,
        data.royalty,
        new Date(data.createdAt),
        []
      )
    );

    collectible._content = data.Content.map((content) =>
      markRaw(
        new Content(collectible, content.name, content.size, content.gated)
      )
    );

    return collectible;
  }

  get content() {
    return this._content;
  }

  get photosLength() {
    return this._content.length;
  }

  get previewUrl() {
    return new URL(
      config.restUrl + "/collectibles/" + toHex(this.id) + "/preview"
    );
  }

  get previewPreviewUrl() {
    return new URL(
      config.restUrl + "/collectibles/" + toHex(this.id) + "/preview/preview"
    );
  }

  get comments() {
    return 0;
  }

  async fetchLikes() {
    trpc.commands.collectibles.getLikesCount
      .query({
        collectibleId: toHex(this.id),
      })
      .then((data) => {
        this.likes.value = data;
      });

    trpc.commands.collectibles.isLikedByMe
      .query({
        collectibleId: toHex(this.id),
      })
      .then((data) => {
        this.likedByMe.value = data;
      });
  }

  async fetchBalance() {
    if (!account.value) return;

    this.balance.value = await balanceOfCollectible(
      this.id,
      toUint8Array(account.value)
    );
  }

  async fetchTotalSupply() {
    this.totalSupply.value = await trpc.commands.collectibles.getEditions
      .query({
        collectibleId: toHex(this.id),
      })
      .then((data) => BigNumber.from(bufferToUint8Array(data)));
  }

  private constructor(
    readonly id: Uint8Array,
    readonly creator: Deferred<User>,
    readonly name: string,
    readonly description: string | null,
    readonly mintPrice: BigNumber,
    readonly editions: number,
    readonly royalty: number,
    readonly createdAt: Date,
    content: Content[]
  ) {
    this.id = id;
    this.creator = creator;
    this.name = name;
    this.description = description;
    this.mintPrice = mintPrice;
    this.editions = editions;
    this.royalty = royalty;
    this.createdAt = createdAt;
    this._content = content;

    this.fetchTotalSupply();
    this.fetchLikes();

    // OPTIMIZE: It is not garbage collected?
    watch(
      () => account.value,
      () => {
        this.fetchBalance();
      },
      {
        immediate: true,
      }
    );
  }
}
