// Types for messages
interface MessagePart {
  type: string;
  text?: string;
  image?: string;
}

interface MessageMetadata {
  parts?: MessagePart[];
  imageUrls?: string[];
  imageUrl?: string;
}

interface ChatMessage {
  message_id: string;
  role: string;
  content: string;
  metadata: MessageMetadata;
}

interface ProcessedMessage {
  id: string;
  role: string;
  content: string;
  parts?: any[];
  experimental_attachments?: Array<{
    url: string;
    contentType: string;
    name: string;
  }>;
}

/**
 * Fetch messages for a chat session
 */
export const fetchChatMessages = async (
  sessionId: string,
  appId: string,
  authToken: string
): Promise<ProcessedMessage[]> => {
  try {
    const response = await fetch(
      `/api/chat?sessionId=${sessionId}&appId=${appId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Session not found - it might be newly created
        return [];
      }
      throw new Error("Failed to fetch messages");
    }

    const messages: ChatMessage[] = await response.json();
    return messages.map((msg) => ({
      id: msg.message_id,
      role: msg.role,
      content: msg.content,
      parts: msg.metadata.parts,
      experimental_attachments: msg.metadata.imageUrls
        ? msg.metadata.imageUrls.map((url) => ({
            url: url,
            contentType: "image/jpeg",
            name: "image",
          }))
        : msg.metadata.imageUrl
        ? [
            {
              url: msg.metadata.imageUrl,
              contentType: "image/jpeg",
              name: "image",
            },
          ]
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

/**
 * Save an AI message
 */
export const saveAIMessage = async (
  sessionId: string,
  appId: string,
  apiUrl: string,
  options: any,
  message: any,
  authToken: string
): Promise<any> => {
  try {
    const response = await fetch("/api/chat/ai-message-save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        sessionId,
        appId,
        apiUrl,
        options,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save AI message");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving AI message:", error);
    throw error;
  }
};

/**
 * Restore a checkpoint
 */
export const restoreCheckpoint = async (
  messageId: string,
  apiUrl: string,
  sessionId: string,
  authToken: string
): Promise<any> => {
  try {
    const response = await fetch("/api/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        messageId,
        apiUrl,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to restore checkpoint");
    }

    return await response.json();
  } catch (error) {
    console.error("Error restoring checkpoint:", error);
    throw error;
  }
};
