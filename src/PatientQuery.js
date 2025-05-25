import React, { useState, useEffect, useCallback } from 'react';
import { getDb } from './db';
import './App.css';

const PatientQuery = () => {
  const [query, setQuery] = useState('SELECT * FROM patients ORDER BY id DESC LIMIT 10');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [columns, setColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [exportFormat, setExportFormat] = useState('none');
  const [isExporting, setIsExporting] = useState(false);

  // Wrap executeQuery in useCallback to prevent unnecessary recreations
  const executeQuery = useCallback(async (q = query, pg = page, pgSize = pageSize) => {
    try {
      const db = await getDb();
      
      // First get total count if this is a patient query
      if (q.toLowerCase().includes('from patients')) {
        const countRes = await db.query(
          q.replace(/SELECT .*? FROM/i, 'SELECT COUNT(*) FROM')
            .replace(/ORDER BY .*/i, '')
            .replace(/LIMIT .*/i, '')
        );
        setTotalRecords(Number(countRes.rows[0].count)); // Fixed: Access count directly from the first row
      }
      
      // Execute the query with pagination
      const paginatedQuery = `${q} 
        ${!q.toLowerCase().includes('limit') ? `LIMIT ${pgSize}` : ''}
        ${!q.toLowerCase().includes('offset') && !q.toLowerCase().includes('limit') ? 
          `OFFSET ${(pg - 1) * pgSize}` : ''}`;
      
      const result = await db.query(paginatedQuery);
      
      setColumns(result.fields ? result.fields.map(f => f.name) : []);
setResults(result.rows || []);
      setError('');
    } catch (err) {
      setError(err.message);
      setResults([]);
      setColumns([]);
    }
  }, [query, page, pageSize]); // Add dependencies here

  useEffect(() => {
    const handleUpdate = (event) => {
      if (event.data && event.data.type === 'DATA_UPDATED') {
        executeQuery();
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleUpdate);
    }

    window.addEventListener('storage', handleUpdate);

    executeQuery();

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleUpdate);
      }
      window.removeEventListener('storage', handleUpdate);
    };
  }, [executeQuery]); // Add executeQuery to dependencies

  useEffect(() => {
    executeQuery();
  }, [page, pageSize, executeQuery]); // Add executeQuery to dependencies

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    executeQuery();
  };

  const handleExport = async () => {
    if (exportFormat === 'none') return;
    
    setIsExporting(true);
    try {
      const db = await getDb();
      const result = await db.query(query.replace(/LIMIT \d+/i, ''));
      
      let content, mimeType, ext;
      
      if (exportFormat === 'csv') {
        const headers = result.fields.map(f => f.name).join(',');
        const rows = result.rows.map(row => 
          result.fields.map(field => {
            const value = row[field.name];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        );
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        ext = 'csv';
      } else { // JSON
        content = JSON.stringify(result.rows, null, 2);
        mimeType = 'application/json';
        ext = 'json';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients_export.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="query-container">
      <h2>Patient Query</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>SQL Query:</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows="4"
          />
        </div>
        <div className="form-actions">
          <button type="submit">Execute Query</button>
          <div className="export-controls">
            <select 
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={isExporting}
            >
              <option value="none">Export format...</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button 
              type="button" 
              onClick={handleExport}
              disabled={exportFormat === 'none' || isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {results.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <h3>Results ({totalRecords} total records)</h3>
            <div className="pagination-controls">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
              >
                Next
              </button>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((col) => (
                      <td key={`${rowIndex}-${col}`}>
                        {typeof row[col] === 'object' 
                          ? JSON.stringify(row[col]) 
                          : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientQuery;