import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Budget Tracker</Link>
        <div className="space-x-4">
          {user ? (
            <>
              <Link to="/" className="hover:underline">Dashboard</Link>
              <Link to="/transactions" className="hover:underline">Transactions</Link>
              <Link to="/budget" className="hover:underline">Budget</Link>
              <button onClick={handleLogout} className="hover:underline">Logout</button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;