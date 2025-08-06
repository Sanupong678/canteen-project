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
import E1 from "@/pages/admin/canteen/e1.vue";
import E2 from "~/pages/admin/canteen/e2.vue";
import Msquare from "~/pages/admin/canteen/Msquare.vue";
import RuemRim from "~/pages/admin/canteen/RuemRim.vue";
import S2 from "~/pages/admin/canteen/s2.vue";
import Epark from "~/pages/admin/canteen/epark.vue";
import UserLeave from "~/pages/user/leave.vue";
import AdminLeave from "~/pages/admin/leave.vue";
import UserRepair from "~/pages/user/repair.vue";
import AdminRepair from "~/pages/admin/repair.vue";
import BillAdmin from "~/pages/admin/bill.vue";
import Evaluation from '../pages/admin/evaluation.vue'
import UserRanking from "~/pages/user/ranking.vue";

const routes = [
  // หน้า Login
  {
    path: "/",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false }
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
        path: "leave",
        name: "adminLeave",
        component: AdminLeave
      },
      {
        path:"repairadmin",
        name:"repairadmin",
        component: AdminRepair
      },
      {
        path:"bill",
        name:"bill",
        component: BillAdmin
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
      },
      {
        path: '/admin/evaluation',
        name: 'Evaluation',
        component: Evaluation,
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
        name: "userLeave",
        component: UserLeave,
        meta: { requiresAuth: true, role: 'user' }
      },
      {
        path: "repair",
        name: "userRepair",
        component: UserRepair
      },
      {
        path: "bill",
        name: "bill",
        component: () => import('~/pages/user/bill.vue')
      },
      {
        path: "ranking",
        name: "userRanking",
        component: UserRanking,
        meta: { requiresAuth: true, role: 'user' }
      },
      {
        path: "money-history",
        name: "userMoneyHistory",
        component: () => import('~/pages/user/money-history.vue'),
        meta: { requiresAuth: true, role: 'user' }
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

