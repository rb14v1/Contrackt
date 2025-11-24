import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Unified COLOR palette (copied from WelcomePage)
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(33, 176, 190, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: ${COLOR.chatBubble};
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(33,176,190,0.12);
  border: 1px solid ${COLOR.teal};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid ${COLOR.teal};
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  color: ${COLOR.teal};
  margin: 0;
  text-shadow: 0 0 10px ${COLOR.teal}40;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${COLOR.teal};
  font-size: 1.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    color: ${COLOR.deepPurple};
    transform: rotate(90deg);
  }
`;

const CategoryFilter = styled.select`
  background: ${COLOR.inputBg};
  color: ${COLOR.teal};
  font-weight: 600;
  border-radius: 8px;
  padding: 10px 15px;
  border: 1px solid ${COLOR.teal};
  margin-bottom: 20px;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  width: 100%;
  &:hover {
    background: ${COLOR.chatBubble};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const TableHeader = styled.th`
  background: ${COLOR.inputBg};
  color: ${COLOR.teal};
  font-weight: 700;
  padding: 12px;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TableRow = styled.tr`
  &:hover {
    background: ${COLOR.chatBubble};
  }
`;

const TableCell = styled.td`
  padding: 12px;
  background: ${COLOR.chatBubble};
  border-bottom: 1px solid ${COLOR.inputBorder};
  color: ${COLOR.primaryText};
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${COLOR.teal};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${COLOR.teal};
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? COLOR.teal : 'transparent'};
  color: ${props => props.primary ? '#fff' : COLOR.teal};
  border: 2px solid ${COLOR.teal};
  padding: 10px 30px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: ${props => props.primary ? COLOR.tealDark : COLOR.teal};
    color: #fff;
    box-shadow: 0 4px 15px ${COLOR.teal}40;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: ${COLOR.teal};
  font-size: 1.2rem;
  padding: 20px;
`;

const NoDataText = styled.div`
  text-align: center;
  color: ${COLOR.secondaryText};
  font-size: 1.1rem;
  padding: 20px;
`;

const API_BASE = "http://18.212.212.53/api/contracts";

const CONTRACT_CATEGORIES = [
    { key: 'all', label: 'All Contracts' },
    { key: 'employee_contract', label: 'Employee Contracts' },
    { key: 'loan_agreement', label: 'Loan Agreements' },
    { key: 'nda', label: 'NDA Agreements' },
];

const categoryApiMap = {
    all: `${API_BASE}/all/`,
    employee_contract: `${API_BASE}/employee_contract/`,
    loan_agreement: `${API_BASE}/loan_agreement/`,
    nda: `${API_BASE}/nda/`,
};

const ContractSelectionModal = ({ isOpen, onClose, onConfirm }) => {
    // This correctly defaults to 'all'
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [contracts, setContracts] = useState([]);
    const [selectedContracts, setSelectedContracts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchContracts(selectedCategory);
        }
    }, [isOpen, selectedCategory]);

    const fetchContracts = async (categoryKey) => {
        setLoading(true);
        setSelectedContracts([]);
        try {
            const endpoint = categoryApiMap[categoryKey];
            const response = await fetch(endpoint);
            const data = await response.json();
            setContracts(data.results || []);
        } catch (error) {
            console.error('Error fetching contracts:', error);
            setContracts([]);
        }
        setLoading(false);
    };

    const handleCheckboxChange = (contract) => {
        setSelectedContracts(prev => {
            const isSelected = prev.some(c => c.s3_url === contract.s3_url);
            if (isSelected) {
                return prev.filter(c => c.s3_url !== contract.s3_url);
            } else {
                return [...prev, contract];
            }
        });
    };

    const handleConfirm = () => {
        onConfirm(selectedContracts);
        setSelectedContracts([]);
        onClose();
    };

    const handleCancel = () => {
        setSelectedContracts([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={handleCancel}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>Select PDFs</ModalTitle>
                    <CloseButton onClick={handleCancel}>×</CloseButton>
                </ModalHeader>

                <CategoryFilter
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    {/* 💡 --- FIX: Removed the "Select Category" option --- 💡
                      Since state already defaults to 'all', the first item
                      in the array will be shown by default.
                    */}
                    {CONTRACT_CATEGORIES.map(({ key, label }) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </CategoryFilter>


                {loading ? (
                    <LoadingText>Loading contracts...</LoadingText>
                ) : contracts.length === 0 ? (
                    <NoDataText>No contracts found</NoDataText>
                ) : (
                    <Table>
                        <thead>
                            <tr>
                                <TableHeader>NAME</TableHeader>
                                <TableHeader>CATEGORY</TableHeader>
                                <TableHeader>DATE</TableHeader>
                                <TableHeader style={{ textAlign: 'center' }}>SELECT</TableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract, index) => (
                                <TableRow key={contract.s3_url || index}>
                                    <TableCell>{contract.name || contract.title || 'Unnamed'}</TableCell>
                                    <TableCell>{contract.category}</TableCell>
                                    <TableCell>{contract.date || 'N/A'}</TableCell>
                                    <TableCell style={{ textAlign: 'center' }}>
                                        <Checkbox
                                            checked={selectedContracts.some(c => c.s3_url === contract.s3_url)}
                                            onChange={() => handleCheckboxChange(contract)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                )}

                <ButtonGroup>
                    <ActionButton onClick={handleCancel}>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        primary
                        onClick={handleConfirm}
                        disabled={selectedContracts.length === 0}
                    >
                        Confirm ({selectedContracts.length} selected)
                    </ActionButton>
                </ButtonGroup>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default ContractSelectionModal;