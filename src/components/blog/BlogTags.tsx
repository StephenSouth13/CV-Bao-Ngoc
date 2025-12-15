import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface BlogTagsProps {
  tags: BlogTag[];
}

const BlogTags = ({ tags }: BlogTagsProps) => {
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center flex-wrap gap-2">
      <Tag className="h-4 w-4 text-muted-foreground" />
      {tags.map((tag) => (
        <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
          <Badge
            variant="secondary"
            className="hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
};

export default BlogTags;
