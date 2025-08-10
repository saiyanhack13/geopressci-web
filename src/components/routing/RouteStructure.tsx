import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleBasedRoute from './RoleBasedRoute';
import PressingLayout from '../layout/PressingLayout';

// Pages publiques
import HomePage from '../../pages/client/HomePage';
import SearchPage from '../../pages/client/SearchPage';
import PressingDetailPage from '../../pages/client/PressingDetailPage';
import LoginPage from '../../pages/auth/LoginPage';
import RegisterClientPage from '../../pages/auth/RegisterClientPage';
import RegisterPressingPage from '../../pages/auth/RegisterPressingPage';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../../pages/auth/VerifyEmailPage';

// Pages client
import ClientSpacePage from '../../pages/client/ClientSpacePage';
import ClientDashboardPage from '../../pages/client/ClientDashboardPage';
import OrderCreatePage from '../../pages/client/OrderCreatePage';
import OrderReviewPage from '../../pages/client/OrderReviewPage';
import OrdersPage from '../../pages/client/OrdersPage';
import OrderDetailPage from '../../pages/client/OrderDetailPage';
import OrderTrackingPage from '../../pages/client/OrderTrackingPage';
import ProfilePage from '../../pages/client/ProfilePage';
import HistoryPage from '../../pages/client/HistoryPage';
import PaymentPage from '../../pages/client/PaymentPage';
import PaymentSuccessPage from '../../pages/client/PaymentSuccessPage';
import PaymentFailedPage from '../../pages/client/PaymentFailedPage';
import PaymentPendingPage from '../../pages/client/PaymentPendingPage';
import TransactionHistoryPage from '../../pages/client/TransactionHistoryPage';
import { AddressesPage } from '../../pages/client/AddressesPage';
import { PaymentMethodsPage } from '../../pages/client/PaymentMethodsPage';
import { NotificationsPage } from '../../pages/client/NotificationsPage';
import { FavoritesPage } from '../../pages/client/FavoritesPage';
import ClientSettingsPage from '../../pages/client/SettingsPage';
import PressingSettingsPage from '../../pages/pressing/ProfileSettingsPage';
import PressingPage from '../../pages/client/PressingPage';

// Pages pressing
import DashboardPage from '../../pages/pressing/DashboardPage';
import OrdersManagementPage from '../../pages/pressing/OrdersManagementPage';
import OrderDetailManagementPage from '../../pages/pressing/OrderDetailManagementPage';
import ServicesPage from '../../pages/pressing/ServicesPage';
import SchedulePage from '../../pages/pressing/SchedulePage';
import EarningsPage from '../../pages/pressing/EarningsPage';
import ReviewsPage from '../../pages/pressing/ReviewsPage';
import PromotionsPage from '../../pages/pressing/PromotionsPage';

import { BusinessProfilePage } from '../../pages/pressing/BusinessProfilePage';
import { GalleryPage } from '../../pages/pressing/GalleryPage';
import { LocationPage } from '../../pages/pressing/LocationPage';
import { SubscriptionPage } from '../../pages/pressing/SubscriptionPage';
import { AnalyticsPage } from '../../pages/pressing/AnalyticsPage';
import { SupportPage } from '../../pages/pressing/SupportPage';

// Pages admin
import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import UsersManagementPage from '../../pages/admin/UsersManagementPage';
import PressingsManagementPage from '../../pages/admin/PressingsManagementPage';
import OrdersOverviewPage from '../../pages/admin/OrdersOverviewPage';
import PaymentsPage from '../../pages/admin/PaymentsPage';
import { AnalyticsPage as AdminAnalyticsPage } from '../../pages/admin/AnalyticsPage';
import { SettingsPage as AdminSettingsPage } from '../../pages/admin/SettingsPage';
import ActivityLogsPage from '../../pages/admin/ActivityLogsPage';

export const RouteStructure: React.FC = () => {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      
      {/* Routes d'authentification */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-client" element={<RegisterClientPage />} />
      <Route path="/register-pressing" element={<RegisterPressingPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Routes client protégées */}
      <Route path="/client/*" element={
        <RoleBasedRoute allowedRoles={['client']}>
          <Routes>
            <Route index element={<ClientSpacePage />} />
            <Route path="dashboard" element={<ClientDashboardPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="orders/create" element={<OrderCreatePage />} />
            <Route path="orders/summary" element={<OrderReviewPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders/:id/track" element={<OrderTrackingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="payment/success" element={<PaymentSuccessPage />} />
            <Route path="payment/failed" element={<PaymentFailedPage />} />
            <Route path="payment/pending" element={<PaymentPendingPage />} />
            <Route path="transactions" element={<TransactionHistoryPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="settings" element={<ClientSettingsPage />} />
            <Route path="pressing" element={<PressingPage />} />
            <Route path="pressing/:id" element={<PressingDetailPage />} />
          </Routes>
        </RoleBasedRoute>
      } />

      {/* Routes pressing protégées */}
      <Route path="/pressing/*" element={
        <RoleBasedRoute allowedRoles={['pressing']}>
          <PressingLayout>
            <Routes>
              <Route index element={<Navigate to="/pressing/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders" element={<OrdersManagementPage />} />
              <Route path="orders/:id" element={<OrderDetailManagementPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="earnings" element={<EarningsPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="settings" element={<PressingSettingsPage />} />
              <Route path="profile" element={<BusinessProfilePage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="location" element={<LocationPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="support" element={<SupportPage />} />
            </Routes>
          </PressingLayout>
        </RoleBasedRoute>
      } />

      {/* Routes admin protégées */}
      <Route path="/admin/*" element={
        <RoleBasedRoute allowedRoles={['admin']}>
          <Routes>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="pressings" element={<PressingsManagementPage />} />
            <Route path="orders" element={<OrdersOverviewPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
          </Routes>
        </RoleBasedRoute>
      } />

      {/* Route pressing détail - seulement pour les vrais IDs numériques */}
      <Route path="/pressing-detail/:id" element={<PressingDetailPage />} />

      {/* Route 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page non trouvée
            </h1>
            <p className="text-gray-600 mb-6">
              La page que vous recherchez n'existe pas.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-3"
            >
              ← Retour
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              🏠 Accueil
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default RouteStructure;
