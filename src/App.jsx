import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const TransactionManagement = lazy(() => import('./pages/TransactionManagement.jsx'));
const TransactionOverview = lazy(() => import('./pages/TransactionOverview.jsx'));
const BudgetManagement = lazy(() => import('./pages/BudgetManagement.jsx'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<TransactionOverview />} />
                  <Route path="/transactions/manage" element={<TransactionManagement />} />
                  <Route path="/transactions/add" element={<TransactionManagement />} />
                  <Route path="/transactions/edit/:id" element={<TransactionManagement />} />
                  <Route path="/transactions" element={<TransactionOverview />} />
                  <Route path="/budget" element={<BudgetManagement />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;