import User from "@/model/User";
import { Deferred } from "@/util/deferred";
import { createRouter, createWebHistory } from "vue-router";
import { userId } from "./auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: () => import("@/components/Home.vue"),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/help",
      name: "Help",
      component: () => import("@/components/Help.vue"),
    },
    {
      name: "NewCollectible",
      path: "/collectible/new",
      component: () => import("@/components/Collectible/New.vue"),
      beforeEnter: (to, from, next) => {
        if (!userId.value) {
          next({ name: "Home" });
        } else {
          next();
        }
      },
    },
    {
      name: "Me",
      path: "/me",
      component: () => import("@/components/Profile.vue"),
      beforeEnter: (to, from, next) => {
        if (!userId.value) {
          next({ name: "Home" });
        } else {
          next();
        }
      },
      props: (route) => {
        return {
          user: Deferred.from(User.get(userId.value!)),
        };
      },
      meta: { doNotTerminateNProgress: true },
    },
    {
      name: "Profile",
      path: "/:handle",
      component: () => import("@/components/Profile.vue"),
      props: (route) => {
        return {
          user: Deferred.from(User.lookup(route.params.handle as string)),
        };
      },
      meta: { doNotTerminateNProgress: true },
    },
  ],
});

export { router };
