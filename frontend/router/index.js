// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import LayoutAdmin from "@/components/LayoutAdmin.vue";
import Login from "@/pages/login.vue";
import LayoutUser from "@/components/LayoutUser.vue";
import IndexAdmin from "~/pages/admin/index.vue";
import IndexUser from "~/pages/user/index.vue";
import Management from "~/pages/admin/management.vue";
import CanteenDynamic from "@/pages/admin/canteen/CanteenDynamic.vue";
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
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false }
  },
  // หน้า Admin (กลุ่มเส้นทางหลัก)
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
        path: '/admin/evaluation',
        name: 'Evaluation',
        component: Evaluation,
        meta: { requiresAuth: true, role: 'admin' }
      }
    ]
  },

  // หน้า Admin (เส้นทางไดนามิกแบบ absolute เพื่อแก้ no match)
  {
    path: "/admin/canteen/:id",
    name: "canteenDynamic",
    component: CanteenDynamic,
    meta: { requiresAuth: true, role: 'admin' }
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
        path: "bill-history",
        name: "billHistory",
        component: () => import('~/pages/user/bill-history.vue')
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

  // ถ้าไม่ใช่หน้า login/welcome และยังไม่ได้ login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
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
  else if (to.path === '/login' && isAuthenticated) {
    next(userRole === 'admin' ? '/admin' : '/user');
  }
  else {
    next();
  }
});

export default router;

