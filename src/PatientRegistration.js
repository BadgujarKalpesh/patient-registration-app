import React, { useState, useEffect } from 'react';
import { getDb } from './db';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
// ...existing code...
import './App.css';

const PatientRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    phone: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [dbReady, setDbReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initDb = async () => {
      try {
        await getDb();
        setDbReady(true);
      } catch (err) {
        setMessage(`Database initialization failed: ${err.message}`);
      }
    };
    
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setPatientId(editId);
      fetchPatientData(editId);
    }
    
    initDb();
  }, [searchParams]);

  const fetchPatientData = async (id) => {
    try {
      const db = await getDb();
      const patient = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
      
      if (patient.length > 0) {
        const p = patient[0];
        setFormData({
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          gender: p.gender,
          address: p.address || '',
          phone: p.phone || '',
          email: p.email || ''
        });
      }
    } catch (err) {
      setMessage(`Error loading patient data: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage('First and last name are required');
      return false;
    }
    
    if (!formData.dateOfBirth) {
      setMessage('Date of birth is required');
      return false;
    }
    
    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!validateForm()) return;
    
    if (!dbReady) {
      setMessage('Database is not ready yet. Please try again.');
      return;
    }

    try {
      const db = await getDb();
      
      if (isEditing) {
        await db.query(
          `UPDATE patients SET
            first_name = $1,
            last_name = $2,
            date_of_birth = $3,
            gender = $4,
            address = $5,
            phone = $6,
            email = $7
           WHERE id = $8`,
          [
            formData.firstName,
            formData.lastName,
            formData.dateOfBirth,
            formData.gender,
            formData.address,
            formData.phone,
            formData.email,
            patientId
          ]
        );
        setMessage('Patient updated successfully!');
      } else {
        await db.query(
          `INSERT INTO patients (first_name, last_name, date_of_birth, gender, address, phone, email)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            formData.firstName,
            formData.lastName,
            formData.dateOfBirth,
            formData.gender,
            formData.address,
            formData.phone,
            formData.email
          ]
        );
        setMessage('Patient registered successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'male',
          address: '',
          phone: '',
          email: ''
        });
      }
      
      // Notify other tabs
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'DATA_UPDATED'
        });
      }
      
      // Redirect to patient detail if editing
      if (isEditing) {
        navigate(`/patient/${patientId}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.error('Database error:', err);
    }
  };

  return (
    <div className="registration-container">
      <h2>{isEditing ? 'Edit Patient' : 'Patient Registration'}</h2>
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>First Name*:</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Last Name*:</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth*:</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group">
            <label>Gender*:</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Address:</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              title="Please enter a 10-digit phone number"
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="primary">
            {isEditing ? 'Update Patient' : 'Register Patient'}
          </button>
          <Link to="/" className="button secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;