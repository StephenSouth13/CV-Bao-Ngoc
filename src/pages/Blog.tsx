import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string | null;
  created_at: string;
  category_id: string | null;
  blog_categories: {
    name: string;
    color: string;
  } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const Blog = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [selectedCategory]);

  const fetchBlogs = async () => {
    try {
      let query = supabase
        .from("blogs")
        .select("id, title, slug, excerpt, image_url, created_at, category_id, blog_categories(name, color)")
        .eq("published", true);

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, slug, color")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <SEOHead
        title="Blog"
        description=""
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Blog
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                Chia sẻ kiến thức và kinh nghiệm
              </p>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedCategory === ""
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">Chưa có bài viết nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blog/${blog.slug}`}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] border-border/50 hover:border-primary/50">
                      {blog.image_url && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={blog.image_url}
                            alt={blog.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        </div>
                      )}
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(blog.created_at)}</span>
                            </div>
                            {blog.blog_categories && (
                              <Badge 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: blog.blog_categories.color + '20',
                                  color: blog.blog_categories.color,
                                  borderColor: blog.blog_categories.color
                                }}
                              >
                                {blog.blog_categories.name}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                            {blog.title}
                          </h3>
                          {blog.excerpt && (
                            <p className="text-muted-foreground line-clamp-3">
                              {blog.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-primary text-sm font-medium pt-4 mt-auto">
                          Đọc thêm <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
