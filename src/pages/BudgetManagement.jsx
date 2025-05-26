import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as d3 from 'd3';
import axiosInstance from '../lib/axiosInstance.js';

function BudgetManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const chartRef = useRef();
  const [budgetInput, setBudgetInput] = useState('');
  const [currentBudget, setCurrentBudget] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the first day of the current month (e.g., 2025-05-01)
  const currentMonth = new Date(2025, 4, 1); // May 2025 (months are 0-indexed in JS)
  const currentMonthString = currentMonth.toISOString().split('T')[0]; // "2025-05-01"

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBudgetData = async () => {
      setLoading(true);
      try {
        // Fetch budget for the current month
        const budgetResponse = await axiosInstance.post('budgets/list/', {
          month: currentMonthString
        });
        let budgetAmount = 0;
        if (budgetResponse.data.status && budgetResponse.data.records.length > 0) {
          budgetAmount = parseFloat(budgetResponse.data.records[0].amount);
          setCurrentBudget(budgetAmount);
        } else {
          setCurrentBudget(null);
        }

        // Fetch total expenses for the current month
        // Assuming /api/transactions/summary/ can filter by date range
        const startDate = currentMonthString;
        const endDate = new Date(2025, 4, 31).toISOString().split('T')[0]; // Last day of May 2025
        const expensesResponse = await axiosInstance.get('transactions/summary/', {
          params: { start_date: startDate, end_date: endDate }
        });
        const expenses = parseFloat(expensesResponse.data.total_expenses) || 0;
        setTotalExpenses(expenses);

        // Update D3.js chart
        const data = [
          { label: 'Budget', value: budgetAmount },
          { label: 'Expenses', value: expenses },
        ];

        // Clear previous chart
        d3.select(chartRef.current).selectAll('*').remove();

        const svg = d3.select(chartRef.current)
          .append('svg')
          .attr('width', 400)
          .attr('height', 300);

        const width = 400;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 50, left: 50 };

        const x = d3.scaleBand()
          .domain(data.map(d => d.label))
          .range([margin.left, width - margin.right])
          .padding(0.4);

        const y = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.value) * 1.2]) // Add padding to y-axis
          .range([height - margin.bottom, margin.top]);

        svg.selectAll('rect')
          .data(data)
          .enter()
          .append('rect')
          .attr('x', d => x(d.label))
          .attr('y', d => y(d.value))
          .attr('width', x.bandwidth())
          .attr('height', d => height - margin.bottom - y(d.value))
          .attr('fill', d => d.label === 'Budget' ? '#4caf50' : '#f44336');

        svg.append('g')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(x))
          .selectAll('text')
          .style('font-size', '14px');

        svg.append('g')
          .attr('transform', `translate(${margin.left}, 0)`)
          .call(d3.axisLeft(y))
          .selectAll('text')
          .style('font-size', '12px');

        // Add y-axis label
        svg.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('x', -height / 2)
          .attr('y', margin.left / 2)
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .text('Amount (₹)');

        setError('');
      } catch (error) {
        console.error('Failed to fetch budget data:', error);
        setError(error.response?.data?.message || 'Failed to fetch budget data');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, [user, navigate]);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('budgets/add/', {
        amount: parseFloat(budgetInput),
        month: currentMonthString
      });
      if (response.data.status) {
        setCurrentBudget(parseFloat(budgetInput));
        setBudgetInput('');
        alert('Budget set successfully');
      } else {
        setError(response.data.message || 'Failed to set budget');
      }
    } catch (error) {
      console.error('Failed to set budget:', error);
      setError(error.response?.data?.message || 'Failed to set budget');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Budget Management</h2>
      <p className="mb-4">Managing budget for {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <form onSubmit={handleBudgetSubmit} className="mb-4 max-w-md">
            <div className="flex space-x-4">
              <input
                type="number"
                step="0.01"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="p-2 border rounded flex-grow"
                placeholder="Set monthly budget (₹)"
                required
              />
              <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                Set Budget
              </button>
            </div>
          </form>
          <div className="mb-4">
            {currentBudget !== null ? (
              <p>Current Budget: ₹{currentBudget.toFixed(2)}</p>
            ) : (
              <p>No budget set for this month.</p>
            )}
            <p>Total Expenses: ₹{totalExpenses.toFixed(2)}</p>
            {currentBudget !== null && totalExpenses > currentBudget && (
              <p className="text-red-600">
                Warning: Expenses exceed budget by ₹{(totalExpenses - currentBudget).toFixed(2)}!
              </p>
            )}
          </div>
          <div ref={chartRef} className="my-4"></div>
        </>
      )}
    </div>
  );
}

export default BudgetManagement;