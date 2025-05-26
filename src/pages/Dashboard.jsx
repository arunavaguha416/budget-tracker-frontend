import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as d3 from 'd3';
import axiosInstance from '../lib/axiosInstance.js';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const chartRef = useRef();
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('transactions/summary/');
        if (response.data.status) {
          const { total_income, total_expenses, balance } = response.data.records;
          setSummary({ total_income, total_expenses, balance });

          const data = [
            { label: 'Income', value: total_income },
            { label: 'Expenses', value: total_expenses },
            { label: 'Balance', value: balance },
          ];

          // Clear previous chart
          d3.select(chartRef.current).selectAll('*').remove();

          const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', 400)
            .attr('height', 350);

          const width = 400;
          const height = 350;
          const radius = Math.min(width, height - 50) / 2;

          const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(['#4caf50', '#f44336', '#2196f3']);

          const pie = d3.pie()
            .value(d => d.value);

          const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius - 10);

          const arcs = svg.selectAll('arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('transform', `translate(${width / 2}, ${(height - 50) / 2})`);

          arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.label));

          arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(d => `${d.data.label}: ₹${d.data.value.toFixed(2)}`);

          // Add chart title
          svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Financial Summary');

          setError('');
        } else {
          setError(response.data.message || 'Failed to fetch financial data');
        }
      } catch (error) {
        console.error('Failed to fetch financial data:', error);
        setError(error.response?.data?.message || 'Failed to fetch financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Financial Dashboard</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="mb-4">
            <p>Total Income: ₹{summary.total_income.toFixed(2)}</p>
            <p>Total Expenses: ₹{summary.total_expenses.toFixed(2)}</p>
            <p>Balance: ₹{summary.balance.toFixed(2)}</p>
            {summary.balance < 0 && (
              <p className="text-red-600">
                Warning: Your expenses exceed your income by ₹{Math.abs(summary.balance).toFixed(2)}!
              </p>
            )}
          </div>
          <div ref={chartRef} className="my-4"></div>
        </>
      )}
    </div>
  );
}

export default Dashboard;