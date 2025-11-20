from django.urls import path
from .views import (
    ContractUploadView,
    ContractSearchView,
    AllContractsListView,
    ContractByCategoryView,
    ContractQnAView,
    DocumentChatView,
    ChatHistoryView,
    ChatHistorySaveView,
    AlertsRemindersView,
    SetupQdrantView,
    summarize_multiple_documents  # ✅ ADD THIS IMPORT
)


urlpatterns = [
    # --- Contract Upload ---
    # Example: POST /api/contracts/upload/
    path('upload/', ContractUploadView.as_view(), name='contract-upload'),


    # --- Contract Search ---
    # Example: POST /api/contracts/search/
    path('search/', ContractSearchView.as_view(), name='contract-search'),


    # --- All Contracts (combined from all collections) ---
    # Example: GET /api/contracts/all/
    path('api/contracts/all/', AllContractsListView.as_view(), name='list_all_contracts'),


    # --- Contracts by Category (loan_agreement / nda / employee_contract) ---
    # Example: GET /api/contracts/nda/
    path('api/contracts/<str:category>/', ContractByCategoryView.as_view(), name='contracts-by-category'),


    # --- QnA (Retrieval-Augmented Generation) ---
    # Example: POST /api/contracts/answer/
    path('answer/', ContractQnAView.as_view(), name='contract-answer'),


    # --- Document Chat (follow-up Q&A for one document) ---
    # Example: POST /api/contracts/chat-with-document/
    path('chat-with-document/', DocumentChatView.as_view(), name='document-chat'),


    # --- Chat History (User's past queries & responses) ---
    # Example: GET /api/contracts/chat-history/
    path('chat-history/', ChatHistoryView.as_view(), name='chat-history'),
    path("chat-history/save/", ChatHistorySaveView.as_view(), name="chat-history-save"),


    # --- Alerts and Reminders ---
    # Example: GET /api/contracts/alerts-reminders/
    path('alerts-reminders/', AlertsRemindersView.as_view(), name='alerts-reminders'),


    # --- Manual Setup of Qdrant (create collections & indexes) ---
    # Example: GET /api/contracts/setup-qdrant/
    path('setup-qdrant/', SetupQdrantView.as_view(), name='setup-qdrant'),


    # ✅ NEW: Summarize Multiple Documents
    # Example: POST /api/contracts/summarize-multiple/
    path('summarize-multiple/', summarize_multiple_documents, name='summarize-multiple'),

]
