import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/Layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { CustomerForm } from './pages/CustomerForm';
import { CustomerDetails } from './pages/CustomerDetails';
import { ProductList } from './pages/ProductList';
import { ProductForm } from './pages/ProductForm';
import { InventoryMovements } from './pages/InventoryMovements';
import { ChallanList } from './pages/ChallanList';
import { ChallanForm } from './pages/ChallanForm';
import { ChallanDetails } from './pages/ChallanDetails';
import { UserList } from './pages/UserList';
import { Reports } from './pages/Reports';
import { LoadingSpinner } from './components/UI/LoadingSpinner';

// Route Guard to protect private pages
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  return user ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" replace />;
};

// Route Guard to restrict pages by roles
interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Login Route */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      
      {/* Customers CRM */}
      <Route path="/customers" element={<PrivateRoute><CustomerList /></PrivateRoute>} />
      <Route 
        path="/customers/new" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN', 'SALES']}>
              <CustomerForm />
            </RoleRoute>
          </PrivateRoute>
        } 
      />
      <Route path="/customers/:id" element={<PrivateRoute><CustomerDetails /></PrivateRoute>} />
      <Route 
        path="/customers/:id/edit" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN', 'SALES']}>
              <CustomerForm />
            </RoleRoute>
          </PrivateRoute>
        } 
      />

      {/* Products & Inventory */}
      <Route path="/products" element={<PrivateRoute><ProductList /></PrivateRoute>} />
      <Route 
        path="/products/new" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <ProductForm />
            </RoleRoute>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/products/:id/edit" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <ProductForm />
            </RoleRoute>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/inventory/movements" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'ACCOUNTS']}>
              <InventoryMovements />
            </RoleRoute>
          </PrivateRoute>
        } 
      />

      {/* Sales Challans */}
      <Route path="/challans" element={<PrivateRoute><ChallanList /></PrivateRoute>} />
      <Route 
        path="/challans/new" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN', 'SALES']}>
              <ChallanForm />
            </RoleRoute>
          </PrivateRoute>
        } 
      />
      <Route path="/challans/:id" element={<PrivateRoute><ChallanDetails /></PrivateRoute>} />

      {/* User Management */}
      <Route 
        path="/users" 
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <UserList />
            </RoleRoute>
          </PrivateRoute>
        } 
      />

      {/* Reports & Analytics */}
      <Route 
        path="/reports" 
        element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        } 
      />

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
