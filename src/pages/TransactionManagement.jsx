import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axiosInstance from '../lib/axiosInstance.js';

function TransactionManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Get transaction ID from URL
  const [transaction, setTransaction] = useState({
    transaction_type: 'income',
    amount: '',
    category: '',
    date: '',
    description: '',
  });
  const [categories, setCategories] = useState([]);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch categories for the dropdown
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

    // Fetch transaction details if editing
    const fetchTransaction = async () => {
      try {
        const response = await axiosInstance.post('transactions/details/', { id });
        if (response.data.status) {
          const tx = response.data.records;
          setTransaction({
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            description: tx.description
          });
          setEditingTransactionId(id);
        } else {
          setError(response.data.message || 'Failed to fetch transaction details');
        }
      } catch (error) {
        console.error('Failed to fetch transaction:', error);
        setError(error.response?.data?.message || 'Failed to fetch transaction details');
      }
    };

    fetchCategories();
    if (id) {
      fetchTransaction();
    }
  }, [user, navigate, id]);

  const handleChange = (e) => {
    setTransaction({ ...transaction, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTransactionId) {
        const response = await axiosInstance.put('transactions/update/', {
          id: editingTransactionId,
          ...transaction
        });
        if (response.data.status) {
          setSuccess('Transaction updated successfully');
          setEditingTransactionId(null);
          setTransaction({ transaction_type: 'income', amount: '', category: '', date: '', description: '' });
          navigate('/transactions'); // Redirect to overview after update
        } else {
          setError(response.data.message || 'Failed to update transaction');
        }
      } else {
        const response = await axiosInstance.post('transactions/add/', transaction);
        if (response.data.status) {
          setSuccess('Transaction added successfully');
          setTransaction({ transaction_type: 'income', amount: '', category: '', date: '', description: '' });
          navigate('/transactions'); // Redirect to overview after adding
        } else {
          setError(response.data.message || 'Failed to add transaction');
        }
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setError(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleCancelEdit = () => {
    setEditingTransactionId(null);
    setTransaction({ transaction_type: 'income', amount: '', category: '', date: '', description: '' });
    setError('');
    setSuccess('');
    navigate('/transactions');
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4">
        {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
      </h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Type</label>
          <select
            name="transaction_type"
            value={transaction.transaction_type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={transaction.amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={transaction.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={transaction.date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={transaction.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex space-x-4">
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {editingTransactionId ? 'Update Transaction' : 'Add Transaction'}
          </button>
          {editingTransactionId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default TransactionManagement;