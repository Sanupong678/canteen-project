// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import LayoutAdmin from "@/components/LayoutAdmin.vue";
import Login from "@/pages/login.vue";
import LayoutUser from "@/components/LayoutUser.vue";
import IndexAdmin from "~/pages/admin/index.vue";
import IndexUser from "~/pages/user/index.vue";
import Management from "~/pages/admin/management.vue";
import C5 from "~/pages/admin/canteen/c5.vue";
import D1 from "~/pages/admin/canteen/d1.vue";
import E1 from "~/pages/admin/canteen/e1.vue";
import E2 from "~/pages/admin/canteen/e2.vue";
import Msquare from "~/pages/admin/canteen/Msquare.vue";
import RuemRim from "~/pages/admin/canteen/RuemRim.vue";
import S2 from "~/pages/admin/canteen/s2.vue";
import Epark from "~/pages/admin/canteen/epark.vue";
import Leave from "~/pages/user/leave.vue";
import Leave from "~/pages/admin/leave.vue";
import C5 from "~/pages/admin/canteen/c5.vue";
import Repair from "~/pages/user/repair.vue";
import Paymentadmin from "~/pages/admin/paymentadmin.vue";
import PaymentUser from "~/pages/user/paymentuser.vue";
import Repair from "~/pages/admin/repair.vue";

const routes = [
  // หน้า Login
  {
    path: "/",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: "/leave",
    name: "Leave",
    component: Leave,
    meta: { requiresAuth: true, role: 'user' }
  },
  // หน้า Admin
  {
    path: "/admin",
    component: LayoutAdmin,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: "",
        name: "indexAdmin",
        component: IndexAdmin
      },
      {
        path:"repairadmin",
        name:"repairadmin",
        component:Repair
      },
      {
        path:"paymentadmin",
        name:"paymentadmin",
        component:Paymentadmin
      },

      {
        path: "canteen",
        name: "canteen",
        component: Management,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/c5",
        name: "c5",
        component: C5,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/d1",
        name: "d1",
        component: D1,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/e1",
        name: "e1",
        component: E1,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/e2",
        name: "e2",
        component: E2,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/msquare",
        name: "msquare",
        component: Msquare,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/ruemrim",
        name: "ruemrim",
        component: RuemRim,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/s2",
        name: "s2",
        component: S2,
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: "canteen/epark",
        name: "epark",
        component: Epark,
        meta: { requiresAuth: true, role: 'admin' }
      }
    ]
  },

  // หน้า User
  {
    path: "/user",
    component: LayoutUser,
    meta: { requiresAuth: true, role: 'user' },
    children: [
      {
        path: "",
        name: "indexUser",
        component: IndexUser,
      },
      {
        path: "leave",
        name: "leave",
        component: Leave,
        meta: { requiresAuth: true, role: 'user' }
      },
      {
        path: "repair",
        name: "repair",
        component: Repair
      },
      {
        path:"paymentuser",
        name:"paymentuser",
        component: PaymentUser
      }

    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const userRole = localStorage.getItem('userRole');

  // ถ้าไม่ใช่หน้า login และยังไม่ได้ login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/');
  }
  // ถ้าเป็นหน้า admin แต่ role ไม่ใช่ admin
  else if (to.path.startsWith('/admin') && userRole !== 'admin') {
    next('/user');
  }
  // ถ้าเป็นหน้า user แต่ role ไม่ใช่ user
  else if (to.path.startsWith('/user') && userRole !== 'user') {
    next('/admin');
  }
  // ถ้า login แล้วและพยายามไปหน้า login
  else if (to.path === '/' && isAuthenticated) {
    next(userRole === 'admin' ? '/admin' : '/user');
  }
  else {
    next();
  }
});

export default router;

