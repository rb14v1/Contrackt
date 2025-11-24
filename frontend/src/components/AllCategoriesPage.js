import React, { useState, useEffect, useCallback } from 'react';

// 2. ADDED: Color theme from WelcomePage.js
const COLOR = {
  background: '#F5F5F5',
  chatBubble: '#FFFFFF',
  inputBg: '#FAFAFA',
  inputBorder: '#E0E0E0',
  accentPurple: '#7E57C2',
  deepPurple: '#5E35B1',
  teal: '#21b0be',
  tealDark: '#159da9',
  primaryText: '#212121',
  secondaryText: '#757575',
  placeholderText: '#BDBDBD',
};

const CONTRACT_CATEGORIES = [
  { key: 'employee_contract', label: 'Employee Contracts' },
  { key: 'loan_agreement', label: 'Loan Agreements' },
  { key: 'nda', label: 'NDA Agreements' },
];

const API_BASE = "http://18.212.212.53/api/contracts";
const categoryApiMap = {
  all: `${API_BASE}/all/`,
  employee_contract: `${API_BASE}/employee_contract/`,
  loan_agreement: `${API_BASE}/loan_agreement/`,
  nda: `${API_BASE}/nda/`,
};

// --- Icons ---
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M8 3.293l6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6ZM8 1.5l-8 8V13.5a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9.5l-8-8Z"/>
    <path fillRule="evenodd" d="M 10 11.5V15h-4v-3.5A1.5 1.5 0 0 1 7.5 10h1A1.5 1.5 0 0 1 10 11.5Z"/>
  </svg>
);

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
  </svg>
);

// --- Styles ---
const AllCategoriesPageStyles = () => (
  <style>{`
    .page-container {
      min-height: 100vh;
      background: ${COLOR.background};
      color: ${COLOR.primaryText};
      display: flex;
      flex-direction: column;
      padding: 20px 40px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      color: ${COLOR.teal};
      text-shadow: 0 4px 10px ${COLOR.teal}30;
    }

    .home-button {
      background: transparent;
      border: none;
      color: ${COLOR.teal};
      font-size: 2.3rem;
      cursor: pointer;
      transition: 0.3s;
    }
    .home-button:hover {
      color: ${COLOR.tealDark};
      transform: scale(1.2);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .icon-button {
      background: ${COLOR.inputBg};
      color: ${COLOR.secondaryText};
      border: 1px solid ${COLOR.inputBorder};
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.3s;
      position: relative;
    }

    .icon-button:hover {
      background: ${COLOR.teal};
      color: white;
    }

    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff4757;
      color: white;
      border-radius: 50%;
      padding: 3px 6px;
      font-size: 10px;
      font-weight: 700;
    }

    .controls-container {
      display: flex;
      align-items: flex-end;
      gap: 24px;
      margin-bottom: 20px;
      justify-content: center;
    }

    .category-select {
      background: ${COLOR.chatBubble};
      border-radius: 10px;
      height: 44px;
      padding: 10px;
      border: 1px solid ${COLOR.inputBorder};
      font-size: 0.92rem;
      font-weight: 700;
      min-width: 200px;
    }

    .pdf-table-scroll-container {
      max-height: 420px;
      overflow-y: auto;
      border-radius: 12px;
    }

    .pdf-table {
      width: 100%;
      background: ${COLOR.chatBubble};
      border-collapse: collapse;
      font-size: 1.08rem;
    }

    .pdf-table-header {
      background: ${COLOR.inputBg};
      color: ${COLOR.teal};
      font-weight: 700;
      padding: 12px;
      border-bottom: 1px solid ${COLOR.inputBorder};
    }

    .pdf-table-cell {
      padding: 10px;
      border-bottom: 1px solid ${COLOR.inputBorder};
    }

    .view-file-button {
      background: ${COLOR.teal};
      color: white;
      padding: 7px 20px;
      font-weight: 700;
      border-radius: 8px;
      text-decoration: none;
      transition: 0.2s;
    }
    .view-file-button:hover {
      background: ${COLOR.tealDark};
    }
  `}</style>
);

// --- Component ---
const AllCategoriesPage = ({
  onBack,
  alerts = [],
  reminders = [],
  onShowNotifications,
  onShowReminders
}) => {
  const [selectedKey, setSelectedKey] = useState('all');
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = useCallback(async (key) => {
    setLoading(true);
    try {
      const response = await fetch(categoryApiMap[key]);
      const data = await response.json();
      setPdfList(data.results || []);
    } catch {
      setPdfList([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContracts(selectedKey);
  }, [selectedKey, fetchContracts]);

  const getCategoryLabel = () => {
    if (selectedKey === 'all') return 'All Contracts';
    return (CONTRACT_CATEGORIES.find((c) => c.key === selectedKey)?.label) || '...';
  };

  return (
    <div className="page-container">
      <AllCategoriesPageStyles />

      <div className="header">
        <div className="header-left">
          <h2 className="title">Categories</h2>
          {onBack && (
            <button className="home-button" onClick={onBack}>
              <IconHome />
            </button>
          )}
        </div>

        <div className="header-actions">
          {/* ✅ SWAPPED: Notifications (Bell) now come first */}
          <button className="icon-button" onClick={onShowNotifications}>
            <IconBell />
            {alerts.length > 0 && <div className="badge">{alerts.length}</div>}
          </button>

          {/* ✅ SWAPPED: Reminders (Clock) now come second */}
          <button className="icon-button" onClick={onShowReminders}>
            <IconClock />
            {reminders.length > 0 && <div className="badge">{reminders.length}</div>}
          </button>
        </div>
      </div>

      {/* --- CONTROLS WITHOUT UPLOAD BUTTON --- */}
      <div className="controls-container">
        <select className="category-select" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
          <option value="all">All Contracts</option>
          {CONTRACT_CATEGORIES.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading && <div>Loading contracts...</div>}

      {!loading && (
        <>
          {pdfList.length === 0 ? (
            <div>No PDFs found for {getCategoryLabel()}</div>
          ) : (
            <div className="pdf-table-scroll-container">
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th className="pdf-table-header">NAME</th>
                    <th className="pdf-table-header">CATEGORY</th>
                    <th className="pdf-table-header">DATE</th>
                    <th className="pdf-table-header">FILE</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfList.map((pdf) => (
                    <tr key={pdf.qdrant_id || pdf.id || pdf.s3_url}>
                      <td className="pdf-table-cell">{pdf.name}</td>
                      <td className="pdf-table-cell">{pdf.category}</td>
                      <td className="pdf-table-cell">{pdf.date}</td>
                      <td className="pdf-table-cell">
                        <a className="view-file-button" href={pdf.viewable_url} target="_blank" rel="noopener noreferrer">
                          View File ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllCategoriesPage;