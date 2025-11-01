import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  itemId: string;
  itemType: "gallery" | "announcement";
  initialLikes?: number;
  className?: string;
}

const LikeButton = ({ itemId, itemType, initialLikes = 0, className }: LikeButtonProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  const tableName = itemType === "gallery" ? "gallery_likes" : "announcement_likes";
  const columnName = itemType === "gallery" ? "image_id" : "announcement_id";

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, itemId]);

  const checkIfLiked = async () => {
    if (!user) return;

    if (itemType === "gallery") {
      const { data } = await supabase
        .from("gallery_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("image_id", itemId)
        .single();
      setLiked(!!data);
    } else {
      const { data } = await supabase
        .from("announcement_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("announcement_id", itemId)
        .single();
      setLiked(!!data);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Giriş gerekli",
        description: "Beğenmek için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (liked) {
        // Unlike
        if (itemType === "gallery") {
          const { error } = await supabase
            .from("gallery_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("image_id", itemId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("announcement_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("announcement_id", itemId);
          if (error) throw error;
        }

        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        if (itemType === "gallery") {
          const { error } = await supabase
            .from("gallery_likes")
            .insert({
              user_id: user.id,
              image_id: itemId,
            });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("announcement_likes")
            .insert({
              user_id: user.id,
              announcement_id: itemId,
            });
          if (error) throw error;
        }

        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error("Like error:", error);
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={cn("gap-2", className)}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
      <span className="text-sm">{likesCount}</span>
    </Button>
  );
};

export default LikeButton;
