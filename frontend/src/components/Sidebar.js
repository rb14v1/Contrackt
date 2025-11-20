import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { FaPlus, FaTrash, FaThumbtack, FaRegStar } from "react-icons/fa";

const GlobalStyle = createGlobalStyle`
  :root {
    --sidebar-bg: #ffffff;
    --sidebar-item-bg: #f8f8f8;
    --sidebar-item-hover: #ededed;
    --sidebar-item-active: #e2e2e2;
    --accent: #21b0be;
    --border: #e0e0e0;
    --text: #ffff;
    --secondary-text: #757575;
  }
  * {
    box-sizing: border-box;
    font-family: "Inter", sans-serif;
  }
  body {
    margin: 0;
    padding: 0;
  }
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--sidebar-bg);
  }
  ::-webkit-scrollbar-thumb {
    background-color: var(--accent);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: #159da9;
  }
`;

const SidebarContainer = styled.div`
  width: 300px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  height: 100vh;
  position: relative;
  z-index: 3;
`;

const ScrollableArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
`;

const SidebarHeaderLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 28px;
  gap: 20px;
`;

const BrandCol = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BrandLogo = styled.img`
  height: 50px;
  width: auto;
  border-radius: 10px;
  background: #fff;
  padding: 6px 12px;
  object-fit: contain;
`;

const NewChatButton = styled.button`
  background: var(--accent);
  color: var(--sidebar-bg);
  border: none;
  border-radius: 10px;
  padding: 14px 16px;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  &:hover {
    background: #159da9;
  }
  &:active {
    transform: scale(0.97);
  }
`;

const ChatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChatItem = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${(props) =>
    props.isActive ? "var(--sidebar-item-active)" : "var(--sidebar-item-bg)"};
  transition: all 0.2s ease;
  &:hover {
    background: var(--sidebar-item-hover);
  }
`;

const ChatTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  color: #212121;
`;

const ChatActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  ${ChatItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: var(--secondary-text);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: var(--accent);
    background: rgba(33,176,190,0.08);
  }
`;

const SectionLabel = styled.h4`
  margin: 18px 0 8px 4px;
  font-size: 0.95rem;
  color: var(--accent);
  font-weight: 600;
`;

const Sidebar = ({
  chatHistory,
  currentChatId,
  pinnedChats,
  onNewChat,
  onSelectChat,
  onPinChat,
  onUnpinChat,
  onDeleteChat,
}) => {
  const pinnedChatIds = pinnedChats?.map((chat) => chat.id) || [];
  const regularChats =
    chatHistory?.filter((chat) => !pinnedChatIds.includes(chat.id)) || [];

  return (
    <>
      <GlobalStyle />
      <SidebarContainer>
        <ScrollableArea>
          <SidebarHeaderLogo>
            <BrandCol>
              <BrandLogo
                src="/assets/versionsidebar.png"
                alt="Version 1"
                draggable={false}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </BrandCol>
            <BrandCol>
              <BrandLogo
                src="/assets/contractsidebar.png"
                alt="ConTrackt"
                draggable={false}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </BrandCol>
          </SidebarHeaderLogo>

          <NewChatButton onClick={onNewChat}>
            <FaPlus /> New Chat
          </NewChatButton>

          <ChatList>
            {regularChats.length > 0 ? (
              regularChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  isActive={chat.id === currentChatId}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <ChatTitle>{chat.title}</ChatTitle>
                  <ChatActions>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinChat(chat.id);
                      }}
                    >
                      <FaRegStar />
                    </ActionButton>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                    >
                      <FaTrash />
                    </ActionButton>
                  </ChatActions>
                </ChatItem>
              ))
            ) : (
              <ChatItem>
                <ChatTitle>No conversations yet</ChatTitle>
              </ChatItem>
            )}
          </ChatList>

          {pinnedChats && pinnedChats.length > 0 && (
            <>
              <SectionLabel>Pinned Conversations</SectionLabel>
              <ChatList>
                {pinnedChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    isActive={chat.id === currentChatId}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <ChatTitle>{chat.title}</ChatTitle>
                    <ChatActions>
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpinChat(chat.id);
                        }}
                      >
                        <FaThumbtack />
                      </ActionButton>
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                      >
                        <FaTrash />
                      </ActionButton>
                    </ChatActions>
                  </ChatItem>
                ))}
              </ChatList>
            </>
          )}
        </ScrollableArea>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
