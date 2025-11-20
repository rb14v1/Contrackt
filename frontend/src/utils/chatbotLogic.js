/**
 * Utility function to generate chatbot responses based on user input
 */

const formatCategoryName = (categoryText) => {
  // Extract category name from "Analyze the [category] contract." format
  const match = categoryText.match(/Analyze the (.*?) contract\./i);
  return match ? match[1] : categoryText;
};

export const getChatbotResponse = (message) => {
  const lowerCaseMessage = message.toLowerCase();

  // Handle category analysis requests
  if (lowerCaseMessage.startsWith('analyze the')) {
    const category = formatCategoryName(message);
    return `Great! You've selected **${category}**. Please provide the contract details, or ask a specific question about ${category} clauses, risks, or terms. I can help you analyze key provisions, identify potential issues, and suggest improvements.`;
  }

  // Greeting responses
  if (lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hey')) {
    return "Hello there! 👋 I'm conTrackt, your AI-powered contract analysis assistant. How can I help you with your Version1 contracts today? You can select a **contract type** from the sidebar or ask me any questions about contract analysis.";
  }

  // Version1 specific questions
  if (lowerCaseMessage.includes('version1') || lowerCaseMessage.includes('version 1')) {
    return "**Version1** is a leading technology services company focused on accelerating digital transformation for its customers. I'm here to help you analyze contracts and agreements related to Version1's services. What specific contract would you like to examine?";
  }

  // Contract-related questions
  if (lowerCaseMessage.includes('contract') || lowerCaseMessage.includes('agreement')) {
    return "I specialize in contract analysis! I can help you with:\n\n• **Employee contracts** - Terms, conditions, and benefits\n• **Service agreements** - Scope, deliverables, and SLAs\n• **NDAs** - Confidentiality and non-disclosure terms\n• **Lease agreements** - Property and rental terms\n• **Partnership agreements** - Joint ventures and collaborations\n\nWhat type of contract would you like to analyze?";
  }

  // Legal or risk-related questions
  if (lowerCaseMessage.includes('legal') || lowerCaseMessage.includes('risk') || lowerCaseMessage.includes('clause')) {
    return "I can help you identify potential **legal risks** and problematic clauses in your contracts. Some common areas I analyze include:\n\n• **Liability limitations**\n• **Termination conditions**\n• **Payment terms**\n• **Intellectual property rights**\n• **Dispute resolution mechanisms**\n\nPlease share the contract text or specific clauses you'd like me to review.";
  }

  // Help or assistance requests
  if (lowerCaseMessage.includes('help') || lowerCaseMessage.includes('what can you do')) {
    return "I'm here to assist you with comprehensive contract analysis! Here's what I can do:\n\n🔍 **Analyze** contract terms and conditions\n⚠️ **Identify** potential risks and red flags\n💡 **Suggest** improvements and alternatives\n📋 **Explain** complex legal language\n🤝 **Compare** different contract types\n\nSelect a category from the sidebar or paste your contract text to get started!";
  }

  // Thank you responses
  if (lowerCaseMessage.includes('thank') || lowerCaseMessage.includes('thanks')) {
    return "You're welcome! 😊 I'm always here to help with your contract analysis needs. Feel free to ask me anything about contracts, agreements, or legal terms. Is there anything else you'd like to analyze?";
  }

  // Goodbye responses
  if (lowerCaseMessage.includes('bye') || lowerCaseMessage.includes('goodbye') || lowerCaseMessage.includes('see you')) {
    return "Goodbye! 👋 Thanks for using conTrackt for your contract analysis needs. Remember, I'm always here whenever you need help with contracts or agreements. Have a great day!";
  }

  // Default response for unrecognized queries
  return "I'm here to help with contract analysis! I didn't quite understand your request, but I can assist you with:\n\n• **Analyzing specific contract types** (select from the sidebar)\n• **Reviewing contract clauses** and terms\n• **Identifying potential risks** in agreements\n• **Explaining legal terminology**\n\nCould you please clarify what type of contract assistance you need, or select a category from the sidebar?";
};