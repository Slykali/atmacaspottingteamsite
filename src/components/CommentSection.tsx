import React, { useState, useEffect } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  itemId: string;
  itemType: "gallery" | "announcement";
}

const CommentSection = ({ itemId, itemType }: CommentSectionProps) => {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tableName = itemType === "gallery" ? "gallery_comments" : "announcement_comments";
  const columnName = itemType === "gallery" ? "image_id" : "announcement_id";

  useEffect(() => {
    fetchComments();
  }, [itemId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let commentsData;
      
      if (itemType === "gallery") {
        const { data, error } = await supabase
          .from("gallery_comments")
          .select('id, comment, created_at, user_id')
          .eq("image_id", itemId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        commentsData = data;
      } else {
        const { data, error } = await supabase
          .from("announcement_comments")
          .select('id, comment, created_at, user_id')
          .eq("announcement_id", itemId)
          .order('created_at', { ascending: false});
        if (error) throw error;
        commentsData = data;
      }

      if (commentsData && commentsData.length > 0) {
        // Fetch profiles separately
        const userIds = [...new Set(commentsData.map(c => c.user_id))] as string[];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || { full_name: null, avatar_url: null }
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Giriş gerekli",
        description: "Yorum yapmak için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      let error;
      
      if (itemType === "gallery") {
        const result = await supabase
          .from("gallery_comments")
          .insert({
            user_id: user.id,
            comment: newComment.trim(),
            image_id: itemId,
          });
        error = result.error;
      } else {
        const result = await supabase
          .from("announcement_comments")
          .insert({
            user_id: user.id,
            comment: newComment.trim(),
            announcement_id: itemId,
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Yorumunuz eklendi.",
      });

      setNewComment("");
      fetchComments();
    } catch (error: any) {
      console.error("Comment error:", error);
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Yorum silindi.",
      });

      fetchComments();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Hata",
        description: "Yorum silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Yorumlar ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Yorumunuzu yazın..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Gönder
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground">
            Yorum yapmak için giriş yapmalısınız.
          </p>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Yorumlar yükleniyor...</p>
        ) : comments.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-muted-foreground">Henüz yorum yapılmamış.</p>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {comment.profiles?.full_name || "Anonim Kullanıcı"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                    {(user?.id === comment.user_id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
