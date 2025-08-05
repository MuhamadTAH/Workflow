// Shop System Router - Main Entry Point
// This file handles all shop-related routes and lazy loading

import { lazy } from 'react';

// Lazy load shop components for better performance
export const ShopDashboard = lazy(() => import('./dashboard/ShopDashboard'));
export const AddProduct = lazy(() => import('./add-product/AddProduct'));
export const ManageProducts = lazy(() => import('./manage-products/ManageProducts'));
export const Categories = lazy(() => import('./categories/Categories'));
export const ViewStore = lazy(() => import('./view-store/ViewStore'));
export const Analytics = lazy(() => import('./analytics/Analytics'));
export const Customers = lazy(() => import('./customers/Customers'));
export const ShopSettings = lazy(() => import('./settings/ShopSettings'));
export const Privacy = lazy(() => import('./settings/Privacy'));
export const Terms = lazy(() => import('./settings/Terms'));

// Shared components
import ShopLayoutComponent from './components/ShopLayout/ShopLayout';
export { default as ShopLayout } from './components/ShopLayout/ShopLayout';

// Shop routes configuration
export const shopRoutes = [
  {
    path: '/shop',
    component: ShopDashboard,
    exact: true,
    name: 'Shop Dashboard'
  },
  {
    path: '/shop/add-product',
    component: AddProduct,
    name: 'Add Product'
  },
  {
    path: '/shop/manage-products',
    component: ManageProducts,
    name: 'Manage Products'
  },
  {
    path: '/shop/categories',
    component: Categories,
    name: 'Categories'
  },
  {
    path: '/shop/view-store',
    component: ViewStore,
    name: 'View Store'
  },
  {
    path: '/shop/analytics',
    component: Analytics,
    name: 'Analytics'
  },
  {
    path: '/shop/customers',
    component: Customers,
    name: 'Customers'
  },
  {
    path: '/shop/settings',
    component: ShopSettings,
    name: 'Shop Settings'
  },
  {
    path: '/shop/privacy',
    component: Privacy,
    name: 'Privacy Policy'
  },
  {
    path: '/shop/terms',
    component: Terms,
    name: 'Terms of Service'
  }
];

export default {
  ShopDashboard,
  AddProduct,
  ManageProducts,
  Categories,
  ViewStore,  
  Analytics,
  Customers,
  ShopSettings,
  Privacy,
  Terms,
  ShopLayout: ShopLayoutComponent,
  shopRoutes
};