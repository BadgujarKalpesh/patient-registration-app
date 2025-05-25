import React, { useState, useEffect } from 'react';
import { getDb } from './db';
import { useParams, Link } from 'react-router-dom';
import './App.css';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
    try {
        const db = await getDb();
        const result = await db.query(
        'SELECT * FROM patients WHERE id = $1',
        [id]
        );

        if (!result.rows || result.rows.length === 0) {
        setError('Patient not found');
        } else {
        setPatient(result.rows[0]);
        }
        setLoading(false);
    } catch (err) {
        setError('Error fetching patient data');
        console.error(err);
        setLoading(false);
    }
};
    
    fetchPatient();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
  return <div className="patient-detail-container">Loading patient data...</div>;
}

if (error || !patient) {
  return <div className="patient-detail-container error">{error || 'Patient not found'}</div>;
}

  return (
    <div className="patient-detail-container">
      <div className="patient-header">
        <h2>
          {patient.first_name} {patient.last_name}
          <span className="patient-id">ID: {patient.id}</span>
        </h2>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </div>
      
      <div className="patient-details">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-row">
            <span className="detail-label">Date of Birth:</span>
            <span>{formatDate(patient.date_of_birth)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Gender:</span>
            <span>{patient.gender}</span>
          </div>
        </div>
        
        <div className="detail-section">
          <h3>Contact Information</h3>
          <div className="detail-row">
            <span className="detail-label">Address:</span>
            <span>{patient.address || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span>{patient.phone || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span>{patient.email || 'N/A'}</span>
          </div>
        </div>
        
        <div className="detail-section">
          <h3>System Information</h3>
          <div className="detail-row">
            <span className="detail-label">Registration Date:</span>
            <span>{new Date(patient.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="patient-actions">
        <Link 
          to={`/register?edit=${patient.id}`} 
          className="action-button edit"
        >
          Edit Patient
        </Link>
      </div>
    </div>
  );
};

export default PatientDetail;