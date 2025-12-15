import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthorInfo {
  name: string;
  title: string;
  image_url: string | null;
  description: string;
}

const AuthorCard = () => {
  const [author, setAuthor] = useState<AuthorInfo | null>(null);

  useEffect(() => {
    fetchAuthorInfo();
  }, []);

  const fetchAuthorInfo = async () => {
    try {
      const [heroRes, aboutRes] = await Promise.all([
        supabase.from("hero_section").select("name, title, profile_image_url").single(),
        supabase.from("about_section").select("description").single(),
      ]);

      if (heroRes.data) {
        setAuthor({
          name: heroRes.data.name,
          title: heroRes.data.title,
          image_url: heroRes.data.profile_image_url,
          description: aboutRes.data?.description || "",
        });
      }
    } catch (error) {
      console.error("Error fetching author info:", error);
    }
  };

  if (!author) return null;

  // Truncate description
  const shortDescription = author.description.length > 150 
    ? author.description.slice(0, 150) + "..." 
    : author.description;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            <AvatarImage src={author.image_url || undefined} alt={author.name} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {author.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-lg">{author.name}</h3>
            <p className="text-sm text-primary mb-2">{author.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>
            <Link to="/about">
              <Button variant="link" size="sm" className="px-0 mt-2">
                Xem thêm về tác giả
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorCard;
