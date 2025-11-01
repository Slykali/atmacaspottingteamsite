import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";

interface GalleryImageProps {
  id: string;
  src: string;
  alt: string;
  tags: string[];
  location?: string | null;
  date?: string | null;
  photographer?: string | null;
  likes_count?: number;
}

const GalleryImage = ({ id, src, alt, tags, location, date, photographer, likes_count = 0 }: GalleryImageProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted cursor-pointer hover-lift"
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{alt}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto rounded-lg"
            />
            
            <div className="flex items-center gap-2">
              <LikeButton 
                itemId={id} 
                itemType="gallery" 
                initialLikes={likes_count || 0}
              />
            </div>

            <Separator />
            
            <div className="space-y-4">
              {location && (
                <div>
                  <span className="font-semibold">Lokasyon: </span>
                  {location}
                </div>
              )}
              
              {date && (
                <div>
                  <span className="font-semibold">Tarih: </span>
                  {new Date(date).toLocaleDateString('tr-TR')}
                </div>
              )}
              
              {photographer && (
                <div>
                  <span className="font-semibold">Fotoğrafçı: </span>
                  {photographer}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <CommentSection itemId={id} itemType="gallery" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GalleryImage;
