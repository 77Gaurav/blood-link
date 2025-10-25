import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface Conversation {
  id: string;
  hospital_id: string;
  blood_bank_id: string;
  emergency_post_id: string | null;
  created_at: string;
  updated_at: string;
  other_user_name: string;
  other_user_id: string;
  unread_count: number;
}

interface ConversationListProps {
  currentUserId: string;
  onSelectConversation: (conversationId: string, otherUserId: string, otherUserName: string) => void;
  selectedConversationId?: string;
}

export const ConversationList = ({
  currentUserId,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages for unread count updates
    const channel = supabase
      .channel("messages-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`hospital_id.eq.${currentUserId},blood_bank_id.eq.${currentUserId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch other user details and unread counts
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId =
            conv.hospital_id === currentUserId
              ? conv.blood_bank_id
              : conv.hospital_id;

          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, organization_name")
            .eq("id", otherUserId)
            .single();

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", currentUserId)
            .eq("read", false);

          return {
            ...conv,
            other_user_id: otherUserId,
            other_user_name: profileData?.organization_name || profileData?.full_name || "Unknown",
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <Button
                key={conv.id}
                variant="ghost"
                className={`w-full justify-start text-left p-4 h-auto rounded-none ${
                  selectedConversationId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() =>
                  onSelectConversation(
                    conv.id,
                    conv.other_user_id,
                    conv.other_user_name
                  )
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold truncate">{conv.other_user_name}</p>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(conv.updated_at), "MMM d, HH:mm")}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
