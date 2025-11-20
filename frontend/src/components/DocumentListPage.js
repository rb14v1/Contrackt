import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const modalFadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const PageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${modalFadeIn} 0.2s ease-out;
`;

const PageContainer = styled.div`
  width: 90%;
  max-width: 1000px;
  height: 80%;
  max-height: 700px;
  background: var(--card);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 25px;
  border-bottom: 1px solid var(--border);
  background: var(--sidebar);
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  text-shadow: 0 0 8px rgba(0, 229, 201, 0.25);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    color: var(--accent);
    transform: rotate(90deg);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: var(--bg);
`;

const TableWrapper = styled.div`
  padding: 25px 30px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: var(--text);
`;

const Thead = styled.thead`
  background: var(--sidebar);
`;

const Tbody = styled.tbody`
  tr {
    background: var(--card);
    border-bottom: 1px solid var(--border);
    transition: background-color 0.2s ease;
    
    &:last-child { border-bottom: none; }
    &:hover { background: var(--sidebar-item-hover); }
  }
`;

const Th = styled.th`
  padding: 14px 18px;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Td = styled.td`
  padding: 14px 18px;
  font-size: 0.95rem;
  vertical-align: middle;
  color: var(--text);

  &.name {
    font-weight: 600;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &.category, &.date {
    color: var(--text-secondary);
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// ✅ FIX: This is the new "View File" button style
const ViewLinkButton = styled.a`
  background: var(--accent);
  color: var(--card) !important;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 14px;
  border-radius: 6px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 229, 201, 0.2);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 15px;
  color: var(--text-secondary);
  padding: 40px 0;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(FaSpinner)`
  font-size: 2rem;
  color: var(--accent);
  animation: ${spin} 1s linear infinite;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
  padding: 40px 0;
`;

// ----------------------------------------------------
// ✅ FIX: THIS FUNCTION CONVERTS YOUR S3 URLS
// ----------------------------------------------------
const convertS3toHttp = (s3Url, collection) => {
  if (!s3Url) return '#'; // Return dead link if no URL
  
  // Case 1: URL is already a full, valid S3 path
  if (s3Url.startsWith('s3://')) {
    try {
      // "s3://contrackt-search/loan_agreements/f1ac...pdf"
      const path = s3Url.substring(5); // "contrackt-search/loan_agreements/f1ac...pdf"
      const parts = path.split('/'); // ["contrackt-search", "loan_agreements", "f1ac...pdf"]
      const bucket = parts.shift(); // "contrackt-search"
      const key = parts.join('/'); // "loan_agreements/f1ac...pdf"
      // Builds the working HTTPS link
      return `https://${bucket}.s3.amazonaws.com/${key}`;
    } catch (e) {
      console.error("Error converting S3 URL:", e);
      return '#';
    }
  }

  // Case 2: URL is just the filename (e.g., "9aafe...pdf")
  // We have to build the URL from scratch using the 'collection'
  if (collection) {
    // This assumes your bucket name is 'contrackt-search'
    return `https://contrackt-search.s3.amazonaws.com/${collection}/${s3Url}`;
  }

  // Fallback if collection is also missing (this link will be broken)
  return s3Url;
};

// ----------------------------------------------------
// COMPONENT
// ----------------------------------------------------

const DocumentListPage = ({ isOpen, onClose, title, documents, isLoading }) => {
  if (!isOpen) return null;

  return (
    <PageOverlay onClick={onClose}>
      <PageContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{title}</Title>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </Header>
        <ContentArea>
          {isLoading ? (
            <LoadingContainer>
              <Spinner />
              <span>Fetching documents...</span>
            </LoadingContainer>
          ) : documents && documents.length > 0 ? (
            <TableWrapper>
              <StyledTable>
                <Thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Category</Th>
                    <Th>Date</Th>
                    <Th>File</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {documents.map((doc, index) => (
                    <tr key={doc.qdrant_id || index}>
                      {/* Show the clean 'name' from the API */}
                      <Td className="name" title={doc.name}>{doc.name || 'N/A'}</Td>
                      <Td className="category" title={doc.category}>{doc.category || 'N/A'}</Td>
                      <Td className="date" title={doc.date}>{doc.date || 'N/A'}</Td>
                      <Td>
                        {/* ✅ FIX: Use the 'ViewLinkButton' and pass both 
                            'doc.s3_url' AND 'doc.collection' to the converter */}
                        <ViewLinkButton 
                          href={convertS3toHttp(doc.viewable_url || '#')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View File
                          <FaExternalLinkAlt size={12} />
                        </ViewLinkButton>
                      </Td>
                    </tr>
                  ))}
                </Tbody>
              </StyledTable>
            </TableWrapper>
          ) : (
            <EmptyMessage>No documents found for this category.</EmptyMessage>
          )}
        </ContentArea>
      </PageContainer>
    </PageOverlay>
  );
};

export default DocumentListPage;

