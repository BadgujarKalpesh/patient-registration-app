import React, { useState, useEffect } from 'react';
import { getDb } from './db';
import { Link } from 'react-router-dom';
import './App.css';

const PatientDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentPatients: [],
    genderDistribution: {},
    monthlyRegistrations: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await getDb();

// Get total patients
const totalRes = await db.query('SELECT COUNT(*) FROM patients');
const totalPatients = Number(totalRes.rows[0].count);

// Get recent patients
const recentRes = await db.query(
  'SELECT id, first_name, last_name, date_of_birth FROM patients ORDER BY created_at DESC LIMIT 5'
);

// Get gender distribution
const genderRes = await db.query(
  'SELECT gender, COUNT(*) as count FROM patients GROUP BY gender'
);
const genderDistribution = {};
genderRes.rows.forEach(row => {
  genderDistribution[row.gender] = Number(row.count);
});

// Get monthly registrations
const monthlyRes = await db.query(`
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as count
  FROM patients
  GROUP BY month
  ORDER BY month
`);

setStats({
  totalPatients,
  recentPatients: recentRes.rows,
  genderDistribution,
  monthlyRegistrations: monthlyRes.rows
});
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const db = await getDb();
      const results = await db.query(
        `SELECT id, first_name, last_name, date_of_birth 
         FROM patients 
         WHERE first_name ILIKE $1 OR last_name ILIKE $1
         LIMIT 10`,
        [`%${searchTerm}%`]
      );
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed');
    }
  };

  if (loading) {
    return <div className="dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Patient Dashboard</h2>
      
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results</h3>
            <ul>
              {searchResults.map(patient => (
                <li key={patient.id}>
                  <Link to={`/patient/${patient.id}`}>
                    {patient.first_name} {patient.last_name} (DOB: {patient.date_of_birth})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <p className="stat-value">{stats.totalPatients}</p>
        </div>
        
        <div className="stat-card">
          <h3>Gender Distribution</h3>
          <ul className="gender-stats">
            {Object.entries(stats.genderDistribution).map(([gender, count]) => (
              <li key={gender}>
                {gender}: {count} ({(count / stats.totalPatients * 100).toFixed(1)}%)
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="recent-patients">
        <h3>Recently Registered Patients</h3>
        {stats.recentPatients.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPatients.map(patient => (
                <tr key={patient.id}>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>
                    {patient.date_of_birth
                        ? new Date(patient.date_of_birth).toLocaleDateString()
                        : ''}
                    </td>
                    <td>
                    <Link to={`/patient/${patient.id}`} className="action-link">
                        View Details
                    </Link>
                    </td>
                </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p>No patients found</p>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;