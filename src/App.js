import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PatientRegistration from './PatientRegistration';
import PatientQuery from './PatientQuery';
import PatientDashboard from './PatientDashboard';
import PatientDetail from './PatientDetail';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <nav>
          <div className="nav-header">
            <h1>Patient Management</h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
          <ul>
            <li>
              <Link to="/">Dashboard</Link>
            </li>
            <li>
              <Link to="/register">Register Patient</Link>
            </li>
            <li>
              <Link to="/query">Query Patients</Link>
            </li>
          </ul>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/register" element={<PatientRegistration />} />
            <Route path="/query" element={<PatientQuery />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;