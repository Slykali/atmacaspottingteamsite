import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";

interface AnnouncementCardProps {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
}

const AnnouncementCard = ({ title, slug, date, excerpt }: AnnouncementCardProps) => {
  const formattedDate = new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="hover-lift group">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </Badge>
        </div>
        <CardTitle className="text-xl group-hover:text-accent transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
      </CardContent>
      <CardFooter>
        <Link to={`/duyurular/${slug}`} className="w-full">
          <Button variant="ghost" className="w-full group/btn">
            Devamını Oku
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default AnnouncementCard;
