import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { ChatInterface } from "./ChatInterface";

interface ChatSystemProps {
  currentUserId: string;
}

export const ChatSystem = ({ currentUserId }: ChatSystemProps) => {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    otherUserId: string;
    otherUserName: string;
  } | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <ConversationList
          currentUserId={currentUserId}
          onSelectConversation={(id, otherUserId, otherUserName) =>
            setSelectedConversation({ id, otherUserId, otherUserName })
          }
          selectedConversationId={selectedConversation?.id}
        />
      </div>
      <div className="md:col-span-2">
        {selectedConversation ? (
          <ChatInterface
            conversationId={selectedConversation.id}
            otherUserId={selectedConversation.otherUserId}
            otherUserName={selectedConversation.otherUserName}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="h-[600px] border border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
