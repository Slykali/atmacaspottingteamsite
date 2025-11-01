import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram } from "lucide-react";

interface MemberCardProps {
  name: string;
  role: string;
  bio: string;
  photo: string;
  social?: {
    instagram?: string;
  };
}

const MemberCard = ({ name, role, bio, photo, social }: MemberCardProps) => {
  return (
    <Card className="hover-lift group runway-lights overflow-hidden">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-muted ring-4 ring-accent/20 group-hover:ring-accent/40 transition-all">
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="font-bold text-lg group-hover:text-accent transition-colors">{name}</h3>
          <Badge variant="secondary" className="mt-2 crew-badge">
            {role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">{bio}</p>
        {social?.instagram && (
          <a
            href={social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent hover:underline group-hover:scale-105 transition-transform"
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;
