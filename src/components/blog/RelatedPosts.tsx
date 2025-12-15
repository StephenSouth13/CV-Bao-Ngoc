import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  created_at: string;
}

interface RelatedPostsProps {
  currentBlogId: string;
  categoryId: string | null;
}

const RelatedPosts = ({ currentBlogId, categoryId }: RelatedPostsProps) => {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRelatedPosts();
  }, [currentBlogId, categoryId]);

  const fetchRelatedPosts = async () => {
    try {
      let query = supabase
        .from("blogs")
        .select("id, title, slug, excerpt, image_url, created_at")
        .eq("published", true)
        .neq("id", currentBlogId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If not enough posts in same category, fetch more from all categories
      if (data && data.length < 3 && categoryId) {
        const existingIds = data.map((p) => p.id);
        existingIds.push(currentBlogId);

        const { data: moreData } = await supabase
          .from("blogs")
          .select("id, title, slug, excerpt, image_url, created_at")
          .eq("published", true)
          .not("id", "in", `(${existingIds.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(3 - data.length);

        if (moreData) {
          setPosts([...data, ...moreData]);
          return;
        }
      }

      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching related posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bài viết liên quan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`}>
            <Card className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50">
              {post.image_url && (
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.created_at)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
