import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axiosInstance from '../lib/axiosInstance.js';

function TransactionOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    category: '',
    transaction_type: '',
    amount_min: '',
    amount_max: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.post('categories/list/',{});
        if (response.data.status) {
          setCategories(response.data.records || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setError('Failed to load categories');
      }
    };

    const fetchTransactions = async () => {
      try {
        const payload = {
          page,
          page_size: 10,
          date: filters.date,
          category: filters.category,
          transaction_type: filters.transaction_type,
          amount_min: filters.amount_min,
          amount_max: filters.amount_max
        };
        const response = await axiosInstance.post('transactions/list/', payload);
        if (response.data.status) {
          const fetchedTransactions = response.data.records.map((t) => ({
            ...t,
            type: t.transaction_type // Map transaction_type to type for display
          }));
          setTransactions(fetchedTransactions);
          setTotalPages(response.data.num_pages || 1);
          setError('');
        } else {
          setTransactions([]);
          setTotalPages(1);
          setError(response.data.message || 'Transactions not found');
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        setError(error.response?.data?.message || 'Failed to fetch transactions');
        setTransactions([]);
      }
    };

    fetchCategories();
    fetchTransactions();
  }, [user, navigate, page, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // Reset to first page on filter change
  };

  const handleEdit = (id) => {
    navigate(`/transactions/edit/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`transactions/delete/${id}/`);
      setTransactions(transactions.filter((t) => t.id !== id));
      setError('');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Transaction Overview</h2>
      <div className="mb-4">
        <button
          onClick={() => navigate('/transactions/add')}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-4"
        >
          Add New Transaction
        </button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="mb-4 flex space-x-4 flex-wrap gap-y-4">
        <div>
          <label className="block mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Transaction Type</label>
          <select
            name="transaction_type"
            value={filters.transaction_type}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Min Amount</label>
          <input
            type="number"
            name="amount_min"
            value={filters.amount_min}
            onChange={handleFilterChange}
            className="p-2 border rounded"
            placeholder="Min amount"
          />
        </div>
        <div>
          <label className="block mb-1">Max Amount</label>
          <input
            type="number"
            name="amount_max"
            value={filters.amount_max}
            onChange={handleFilterChange}
            className="p-2 border rounded"
            placeholder="Max amount"
          />
        </div>
      </div>
      {transactions.length > 0 ? (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Category</th>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-2">{t.type}</td>
                  <td className="p-2">₹{parseFloat(t.amount).toFixed(2)}</td>
                  <td className="p-2">{t.category_name}</td>
                  <td className="p-2">{t.date}</td>
                  <td className="p-2">{t.description}</td>
                  <td className="p-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(t.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`p-2 rounded ${
                page === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            <span className="self-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className={`p-2 rounded ${
                page >= totalPages
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );
}

export default TransactionOverview;