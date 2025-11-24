import React, { useRef, useState, useCallback, useEffect } from 'react';

// ----------------------------------------------------
// ICONS (Same as before)
// ----------------------------------------------------

const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
  </svg>
);

const IconFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
  </svg>
);

const IconTimes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
  </svg>
);

const IconPaperPlane = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
  </svg>
);

const Spinner = () => <div className="Spinner"></div>;

// ----------------------------------------------------
// STYLES (Updated for Light Theme 💡)
// ----------------------------------------------------

const styles = `
  /* Define our palette variables locally for easy tweaking */
  .FileUploadContainer {
    --bg-color: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-main: #333333;
    --text-secondary: #666666;
    --border-color: #e9ecef;
    --accent-color: #00c4cc;
    --accent-hover: #009688;
    --shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    
    position: relative;
    padding: 10px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  .Spinner {
    animation: spin 1s linear infinite;
    width: 14px;
    height: 14px;
    border: 2px solid var(--text-secondary);
    border-top-color: var(--accent-color);
    border-radius: 50%;
  }

  /* --- Main Upload Button --- */
  .UploadButton {
    background: var(--bg-color);
    color: var(--accent-color);
    border: 2px solid var(--border-color);
    border-radius: 12px; /* softer square or circle */
    width: 44px;
    height: 44px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }

  .UploadButton:hover {
    border-color: var(--accent-color);
    background: var(--bg-secondary);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 191, 165, 0.2);
  }

  .HiddenInput {
    display: none;
  }

  /* --- File Preview Container --- */
  .FilePreview {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: var(--bg-color);
    border-radius: 12px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    min-width: 340px;
    max-width: 380px;
    z-index: 100;
    overflow: hidden;
  }

  .FileListContainer {
    padding: 12px;
    max-height: 220px;
    overflow-y: auto;
  }

  /* --- Individual File Row --- */
  .FileItem {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    background: #fff;
    margin-bottom: 8px;
    border: 1px solid var(--border-color);
    transition: background 0.2s;
  }
  
  .FileItem:hover {
    border-color: #d1d5db;
  }
  
  .FileItem:last-child {
    margin-bottom: 0;
  }

  .FileIcon {
    color: var(--accent-color);
    display: flex;
    align-items: center;
  }

  .FileName {
    flex: 1;
    font-size: 13px;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  /* --- Dropdown Select --- */
  .CategorySelect {
    background: var(--bg-secondary);
    color: var(--text-main);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    appearance: none;
    padding-right: 24px;
    /* Teal arrow for the dropdown */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300bfa5%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.6-3.6%205.4-7.9%205.4-12.9%200-5-1.8-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 8px top 55%;
    background-size: 8px auto;
  }
  
  .CategorySelect:hover {
    border-color: #ccc;
  }

  .RemoveButton {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .RemoveButton:hover {
    color: #ef4444;
    background: #fee2e2;
  }

  /* --- Footer Section --- */
  .PreviewFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .UploadStatus {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    font-weight: 500;
  }
  .UploadStatus.success { color: var(--accent-color); }
  .UploadStatus.error { color: #ef4444; }
  .UploadStatus.default { color: var(--text-secondary); }

  .StatusText {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .SendFilesButton {
    background: var(--accent-color);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 191, 165, 0.3);
  }

  .SendFilesButton:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 191, 165, 0.4);
  }

  .SendFilesButton:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  /* --- Toast Notification --- */
  .ToastContainer {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    font-size: 14px;
    font-weight: 500;
    border-left: 4px solid transparent;
    animation: slideIn 0.3s ease, slideOut 0.3s ease 3.7s forwards;
  }

  .ToastContainer.success {
    border-left-color: var(--accent-color);
    color: var(--text-main);
  }
  .ToastContainer.success .ToastIcon {
    color: var(--accent-color);
  }
  
  .ToastContainer.error {
    border-left-color: #ef4444;
    color: var(--text-main);
  }
  .ToastContainer.error .ToastIcon {
    color: #ef4444;
  }

  .ToastCloseButton {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    margin-left: 12px;
    padding: 0;
    display: flex;
  }
  .ToastCloseButton:hover {
    color: #333;
  }
`;

// ----------------------------------------------------
// TOAST COMPONENT
// ----------------------------------------------------
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ToastContainer ${type}`}>
      <div className="ToastIcon">
        {type === 'success' ? <IconCheck /> : <IconTimes />}
      </div>
      <span>{message}</span>
      <button onClick={onClose} className="ToastCloseButton">
        <IconTimes />
      </button>
    </div>
  );
};

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------

const FileUpload = ({ onFilesSelected, maxFiles = 5, acceptedTypes = '.pdf', onUploadStateChange }) => {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadStatus('');
    setToast(null);

    if (selectedFiles.length + files.length > maxFiles) {
      setUploadStatus(`Max ${maxFiles} files`);
      return;
    }

    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      category: 'nda',
    }));

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    onFilesSelected && onFilesSelected(updatedFiles);  
    event.target.value = '';
  };

  const handleCategoryChange = (fileId, newCategory) => {
    const updatedFiles = selectedFiles.map(f => 
      f.id === fileId ? { ...f, category: newCategory } : f
    );
    setSelectedFiles(updatedFiles);
    onFilesSelected && onFilesSelected(updatedFiles);
  };

  const removeFile = (fileId) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    onFilesSelected && onFilesSelected(updatedFiles);
    if (updatedFiles.length === 0) setUploadStatus('');
  };

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setToast(null);
    if (onUploadStateChange) onUploadStateChange(true);
    
    let errorCount = 0;
    let firstError = '';
    const totalFiles = selectedFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const fileItem = selectedFiles[i];
      setUploadStatus(`Uploading ${i + 1} of ${totalFiles}...`);

      const formData = new FormData();
      formData.append('contract_file', fileItem.file, fileItem.name);
      formData.append('contract_category', fileItem.category);

      try {
        const response = await fetch("http://18.212.212.53/upload/", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Upload failed');
        }
      } catch (err) {
        console.error("Upload error:", err);
        errorCount++;
        if (!firstError) firstError = err.message;
      }
    }

    setIsUploading(false);
    if (onUploadStateChange) onUploadStateChange(false);

    if (errorCount > 0) {
      const message = errorCount === 1 ? `Upload failed: ${firstError}` : `${errorCount} files failed.`;
      setUploadStatus(message);
      setToast({ type: 'error', message });
    } else {
      const message = 'Upload successful!';
      setUploadStatus(message);
      setToast({ type: 'success', message });
      setSelectedFiles([]);
      onFilesSelected && onFilesSelected([]);
      setTimeout(() => setUploadStatus(''), 2000);
    }
  }, [selectedFiles, onFilesSelected, onUploadStateChange]);

  const hasFiles = selectedFiles.length > 0;
  const isSuccess = uploadStatus.toLowerCase().includes('success') || uploadStatus.toLowerCase().includes('uploaded');
  const hasError = !isUploading && !isSuccess && uploadStatus !== '' && !uploadStatus.startsWith('Uploading');
  let statusClass = 'default';
  if (isSuccess) statusClass = 'success';
  if (hasError) statusClass = 'error';

  return (
    <div className="FileUploadContainer">
      <style>{styles}</style>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {hasFiles && (
        <div className="FilePreview">
          <div className="FileListContainer">
            {selectedFiles.map((fileItem) => (
              <div key={fileItem.id} className="FileItem">
                <div className="FileIcon"><IconFile /></div>
                <div className="FileName" title={fileItem.name}>{fileItem.name}</div>
                <select 
                  className="CategorySelect"
                  value={fileItem.category}
                  onChange={(e) => handleCategoryChange(fileItem.id, e.target.value)}
                >
                  <option value="nda">NDA</option>
                  <option value="employee_contract">Employment</option>
                  <option value="loan_agreement">Loan</option>
                </select>
                <button onClick={() => removeFile(fileItem.id)} title="Remove" className="RemoveButton">
                  <IconTimes />
                </button>
              </div>
            ))}
          </div>
          
          <div className="PreviewFooter">
            <div className={`UploadStatus ${statusClass}`}>
              {isUploading && <Spinner />}
              {isSuccess && <IconCheck />}
              {hasError && <IconTimes />}
              <span className="StatusText">{uploadStatus}</span>
            </div>

            <button onClick={handleUpload} disabled={isUploading} className="SendFilesButton">
              <IconPaperPlane />
              {isUploading ? 'Sending...' : 'Send Files'}
            </button>
          </div>
        </div>
      )}
      
      <button onClick={handleButtonClick} title="Upload PDF" disabled={isUploading} className="UploadButton">
        <IconUpload />
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="HiddenInput"
      />
    </div>
  );
};

export default FileUpload;