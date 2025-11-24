/**
 * API service for chatbot communication
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://18.212.212.53'; 

/**
 * Send a message to the chatbot API
 * @param {string|object} messageData - User message data (string or {text, files})
 * @param {Array} conversationHistory - Previous conversation history
 * @returns {Promise} - Response from the API
 */
export const sendMessage = async (messageData, conversationHistory = []) => {
  try {
    // Prepare payload with prompt key as backend expects
    const payload = { prompt: typeof messageData === 'string' ? messageData : messageData.text };

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
/**
 * Send a message to the chatbot API with streaming response
 * @param {string|object} messageData - User message data (string or {text, files})
 * @param {Array} conversationHistory - Previous conversation history
 * @param {Function} onChunk - Callback for each chunk of the response
 * @returns {Promise} - Full response when complete
 */
export const sendMessageStreaming = async (messageData, conversationHistory = [], onChunk) => {
  try {
    // Handle both string messages and object messages with files
    const payload = typeof messageData === 'string'
      ? { message: messageData, conversationHistory }
      : {
          message: messageData.text,
          files: messageData.files,
          conversationHistory
        };

    const response = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
  // Decode the chunk and process each SSE message
  const chunk = decoder.decode(value, { stream: true });
  // Debug: log raw SSE chunk fragment
  try { console.debug('SSE RAW FRAGMENT:', chunk); } catch (e) {}
      const lines = chunk.split('\n\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (data.chunk) {
              onChunk(data.chunk, data.done);
              fullResponse += data.chunk;
            }
            
            if (data.done) {
              return { success: true, response: data.fullResponse || fullResponse };
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e, 'line:', line);
          }
        }
      }
    }
    
    return { success: true, response: fullResponse };
  } catch (error) {
    console.error('Error sending streaming message:', error);
    throw error;
  }
};

/**
 * Get available contract categories
 * @returns {Promise} - Response with categories
 */
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/chat/categories`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { categories: [] };
  }
};

