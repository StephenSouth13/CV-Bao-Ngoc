import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Eye, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import DOMPurify from "dompurify";
import ReadingProgress from "@/components/blog/ReadingProgress";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareButtons from "@/components/blog/ShareButtons";
import AuthorCard from "@/components/blog/AuthorCard";
import RelatedPosts from "@/components/blog/RelatedPosts";
import BlogTags from "@/components/blog/BlogTags";
import { Badge } from "@/components/ui/badge";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  created_at: string;
  view_count: number;
  category_id: string | null;
  category?: {
    name: string;
    color: string;
    slug: string;
  };
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchBlog();
      incrementViewCount();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select(`
          *,
          category:blog_categories(name, color, slug)
        `)
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;
      setBlog(data);

      // Calculate reading time (average 200 words per minute)
      const wordCount = data.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
      setReadingTime(Math.ceil(wordCount / 200));

      // Fetch tags
      fetchTags(data.id);
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async (blogId: string) => {
    try {
      const { data, error } = await supabase
        .from("blog_post_tags")
        .select(`
          tag:blog_tags(id, name, slug, color)
        `)
        .eq("blog_id", blogId);

      if (error) throw error;
      const tagList = data?.map((item: any) => item.tag).filter(Boolean) || [];
      setTags(tagList);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc("increment_blog_view", { blog_slug: slug });
    } catch (error) {
      console.error("Error incrementing view:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <>
        <SEOHead title="Loading..." />
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto space-y-8">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!blog) {
    return (
      <>
        <SEOHead title="Blog không tồn tại" />
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Không tìm thấy bài viết</h1>
              <Link to="/blog">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại Blog
                </Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <SEOHead
        title={blog.title}
        description={blog.excerpt || blog.content.slice(0, 160)}
        image={blog.image_url || undefined}
      />
      <ReadingProgress />
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <Link to="/blog" className="inline-block mb-8">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Blog
              </Button>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
              {/* Main Content */}
              <div>
                {blog.image_url && (
                  <div className="relative h-[400px] rounded-xl overflow-hidden mb-8">
                    <img
                      src={blog.image_url}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                    {blog.category && (
                      <Link to={`/blog?category=${blog.category.slug}`}>
                        <Badge
                          className="absolute top-4 left-4"
                          style={{
                            backgroundColor: blog.category.color,
                            color: "white",
                          }}
                        >
                          {blog.category.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                )}

                <article className="prose prose-lg dark:prose-invert max-w-none">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                    {blog.title}
                  </h1>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6 not-prose">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formatDate(blog.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatViewCount(blog.view_count || 0)} lượt xem</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{readingTime} phút đọc</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="mb-8 not-prose">
                      <BlogTags tags={tags} />
                    </div>
                  )}

                  {/* Share Buttons */}
                  <div className="mb-8 pb-6 border-b border-border/50 not-prose">
                    <ShareButtons title={blog.title} url={currentUrl} />
                  </div>

                  {/* Content */}
                  <div
                    className="prose-content text-foreground/90 leading-relaxed
                      prose-headings:scroll-mt-20 prose-headings:font-bold
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                      prose-p:mb-4 prose-p:leading-relaxed
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-xl prose-img:shadow-lg
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                      prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:bg-muted prose-pre:rounded-xl prose-pre:p-4"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
                  />

                  {/* Bottom Share */}
                  <div className="mt-10 pt-6 border-t border-border/50 not-prose">
                    <ShareButtons title={blog.title} url={currentUrl} />
                  </div>
                </article>

                {/* Author Card */}
                <div className="mt-10">
                  <AuthorCard />
                </div>

                {/* Related Posts */}
                <div className="mt-12">
                  <RelatedPosts currentBlogId={blog.id} categoryId={blog.category_id} />
                </div>
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <TableOfContents content={blog.content} />
              </aside>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BlogDetail;
