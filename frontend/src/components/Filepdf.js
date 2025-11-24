import React, { useRef, useState, useCallback, useEffect } from 'react';

// ----------------------------------------------------
// ICONS (Unchanged)
// ----------------------------------------------------
const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
  </svg>
);
// ... (IconFile, IconTimes, IconCheck, IconPaperPlane, Spinner remain unchanged) ...
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
// STYLES (injected as a <style> tag)
// ----------------------------------------------------

// 2. UPDATED: All colors replaced with light theme
const styles = `
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
    border: 2px solid #757575; /* secondaryText */
    border-top-color: #21b0be; /* teal */
    border-radius: 50%;
  }

  .FileUploadContainer {
    position: relative;
  }

  .UploadButton {
    background: #FFFFFF; /* chatBubble */
    color: #21b0be; /* teal */
    border: 1px solid #E0E0E0; /* inputBorder */
    border-radius: 10px; 
    height: 44px; 
    padding: 10px 16px; 
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px; 
    transition: all 0.3s ease;
    font-size: 0.92rem; 
    font-weight: 700; 
    white-space: nowrap; 
  }

  .UploadButton:hover {
    background: #159da9; /* tealDark */
    color: #FFFFFF; /* white */
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(21, 157, 169, 0.3); /* tealDark shadow */
  }

  .HiddenInput {
    display: none;
  }

  .FilePreview {
    position: absolute;
    top: 50px; 
    right: 0;
    background: #FFFFFF; /* chatBubble */
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Softer shadow */
    border: 1px solid #E0E0E0; /* inputBorder */
    min-width: 320px;
    max-width: 350px;
    z-index: 100;
  }

  .FileListContainer {
    padding: 12px;
    padding-bottom: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .FileItem {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    background: #0000;
    margin-bottom: 8px;
    border: 1px solid #E0E0E0; /* inputBorder */
  }
  
  .FileItem:last-child {
    margin-bottom: 0;
  }

  .FileIcon {
    color: #21b0be; /* teal */
    font-size: 16px;
    flex-shrink: 0;
  }

  .FileName {
    flex: 1;
    font-size: 12px;
    color: #212121; /* primaryText */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 50px;
    font-weight: 500;
  }

  .CategorySelect {
    background: #FAFAFA; /* inputBg */
    color: #21b0be; /* teal */
    border: 1px solid #E0E0E0; /* inputBorder */
    border-radius: 6px;
    padding: 4px 6px;
    font-size: 11px;
    font-weight: 600;
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    /* SVG icon color updated to new teal */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2321b0be%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.6-3.6%205.4-7.9%205.4-12.9%200-5-1.8-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 8px top 50%;
    background-size: 8px auto;
    padding-right: 24px;
    cursor: pointer;
  }

  .RemoveButton {
    background: none;
    border: none;
    color: #757575; /* secondaryText */
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  
  .RemoveButton:hover {
    color: #ff4757;
    background: rgba(255, 71, 87, 0.1);
  }

  .PreviewFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid #E0E0E0; /* inputBorder */
    background: #FAFAFA; /* inputBg */
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  .UploadStatus {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  .UploadStatus.success {
    color: #21b0be; /* teal */
  }
  .UploadStatus.error {
    color: #ff4757;
  }
  .UploadStatus.default {
    color: #757575; /* secondaryText */
  }

  .StatusText {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .SendFilesButton {
    background: #21b0be; /* teal */
    color: #FFFFFF; /* white */
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .SendFilesButton:hover {
    background: #159da9; /* tealDark */
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(21, 157, 169, 0.3); /* tealDark shadow */
  }

  .SendFilesButton:disabled {
    background: #E0E0E0; /* inputBorder */
    color: #757575; /* secondaryText */
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Toast styles updated */
  .ToastContainer {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    background: #FFFFFF; /* chatBubble */
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); /* Darker shadow */
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    font-size: 14px;
    animation: slideIn 0.3s ease, slideOut 0.3s ease 3.7s forwards;
  }

  .ToastContainer.success {
    border: 1px solid #21b0be; /* teal */
    color: #21b0be; /* teal */
  }
  
  .ToastContainer.error {
    border: 1px solid #ff4757;
    color: #ff4757;
  }

  .ToastIcon {
    font-size: 16px;
    flex-shrink: 0;
  }
  
  .ToastCloseButton {
    background: none;
    border: none;
    color: #757575; /* secondaryText */
    cursor: pointer;
    padding: 0;
    margin-left: 16px;
  }
  .ToastCloseButton:hover {
    color: #212121; /* primaryText */
  }
`;

// ----------------------------------------------------
// Toast Component (Unchanged)
// ----------------------------------------------------
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); 

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ToastContainer ${type}`}>
      <div className="ToastIcon">
        {type === 'success' ? <IconCheck /> : <IconTimes />}
      </div>
      <span>{message}</span>
      <button onClick={onClose} className="ToastCloseButton" title="Close">
        <IconTimes />
      </button>
    </div>
  );
};

// ----------------------------------------------------
// MAIN COMPONENT (Unchanged)
// ----------------------------------------------------
const Filepdf = ({ onFilesSelected, maxFiles = 5, acceptedTypes = '.pdf', onUploadStateChange }) => {
  // ... (All logic remains the same) ...
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
    onFilesSelected(updatedFiles);  
    
    event.target.value = '';
  };

  const handleCategoryChange = (fileId, newCategory) => {
    const updatedFiles = selectedFiles.map(f => 
      f.id === fileId ? { ...f, category: newCategory } : f
    );
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const removeFile = (fileId) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
    if (updatedFiles.length === 0) {
      setUploadStatus('');
    }
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
        console.error("Upload error for file:", fileItem.name, err);
        errorCount++;
        if (!firstError) {
          firstError = err.message;
        }
      }
    }

    setIsUploading(false);
    if (onUploadStateChange) onUploadStateChange(false);

    if (errorCount > 0) {
      const message = errorCount === 1 
        ? `Upload failed: ${firstError}` 
        : `${errorCount} of ${totalFiles} files failed.`;
      
      setUploadStatus(message); 
      setToast({ type: 'error', message }); 
    } else {
      const message = totalFiles > 1 
        ? `All ${totalFiles} files uploaded!`
        : 'File uploaded successfully!';

      setUploadStatus(message); 
      setToast({ type: 'success', message }); 
      
      setSelectedFiles([]);
      onFilesSelected([]); 
      
      setTimeout(() => setUploadStatus(''), 2000);
    }
  }, [selectedFiles, onFilesSelected, onUploadStateChange]);

  const hasFiles = selectedFiles.length > 0;
  const isSuccess = uploadStatus.includes('success') || uploadStatus.includes('uploaded');
  const hasError = !isUploading && !isSuccess && uploadStatus !== '' && !uploadStatus.startsWith('Uploading');

  let statusClass = 'default';
  if (isSuccess) statusClass = 'success';
  if (hasError) statusClass = 'error';

  return (
    <div className="FileUploadContainer">
      {/* Inject all our styles */}
      <style>{styles}</style>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
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
                <button onClick={() => removeFile(fileItem.id)} title="Remove file" className="RemoveButton">
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
      
      <button onClick={handleButtonClick} title="Upload Files" disabled={isUploading} className="UploadButton">
        <IconUpload />
        <span>Upload File</span>
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

export default Filepdf;