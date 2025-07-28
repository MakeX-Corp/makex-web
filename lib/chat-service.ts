// Types for messages
interface MessagePart {
  type: string;
  text?: string;
  image?: string;
}

interface ChatMessage {
  message_id: string;
  role: string;
  content: string;
  parts: MessagePart[];
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
): Promise<ProcessedMessage[]> => {
  try {
    const response = await fetch(
      `/api/chat?sessionId=${sessionId}&appId=${appId}`,
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
      parts: msg.parts,
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
  message: any,
): Promise<any> => {
  try {
    const response = await fetch("/api/chat/ai-message-save", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        appId,
        apiUrl,
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
): Promise<any> => {
  try {
    const response = await fetch("/api/code", {
      method: "POST",
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

export const checkMessageLimit = async () => {
  try {
    const response = await fetch("/api/chat/limits", {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      return {
        reachedLimit: data.reachedLimit,
        remainingMessages: data.remaining,
        total: data.total,
        used: data.used,
        planName: data.planName,
        hasActiveSubscription: data.hasActiveSubscription,
        nextBillingDate: data.nextBillingDate,
      };
    }
  } catch (error) {
    console.error("Error checking message limit:", error);
  }
};
