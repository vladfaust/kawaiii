import config from "@/config";
import { toHex } from "@/util";
import { computed } from "vue";
import Collectible from "../Collectible";

export default class Content {
  readonly collectible: Collectible;
  readonly type: "img";
  readonly name: string;
  readonly size: number;
  readonly gated: boolean;
  readonly unlocked = computed(
    () => !this.gated || this.collectible.collected.value
  );

  constructor(
    collectible: Collectible,
    name: string,
    size: number,
    gated: boolean
  ) {
    this.collectible = collectible;
    this.type = "img";
    this.name = name;
    this.size = size;
    this.gated = gated;
  }

  get previewBlurredUrl() {
    return new URL(
      config.restUrl +
        "/collectibles/" +
        toHex(this.collectible.id) +
        "/content/" +
        this.name +
        "/previewBlurred"
    );
  }

  get previewUrl() {
    return new URL(
      config.restUrl +
        "/collectibles/" +
        toHex(this.collectible.id) +
        "/content/" +
        this.name +
        "/preview"
    );
  }

  get url() {
    return new URL(
      config.restUrl +
        "/collectibles/" +
        toHex(this.collectible.id) +
        "/content/" +
        this.name
    );
  }
}
