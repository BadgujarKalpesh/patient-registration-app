# Patient Registration and Management System

[![Live Demo](https://img.shields.io/badge/demo-live-green?style=for-the-badge)](https://patia.netlify.app/)
![React](https://img.shields.io/badge/React-18.2-blue)
![PGlite](https://img.shields.io/badge/PGlite-0.6.4-orange)

![Screenshot 2025-05-25 134523](https://github.com/user-attachments/assets/b138a479-b586-4244-86ac-a7b5c00883ef)


A full-featured patient management application with offline capabilities, built with React and PGlite (PostgreSQL in the browser).

## Features

- **Patient Registration**
  - Form validation with error messages
  - Data persistence in IndexedDB
  - Cross-tab synchronization

- **Dashboard**
  - Real-time patient statistics
  - Search by name (e.g., `SELECT * FROM patients WHERE name LIKE '%John%'`)
  - Gender distribution charts

- **SQL Query Interface**
  -- Example queries:
  SELECT * FROM patients LIMIT 10;
  SELECT gender, COUNT(*) FROM patients GROUP BY gender;
