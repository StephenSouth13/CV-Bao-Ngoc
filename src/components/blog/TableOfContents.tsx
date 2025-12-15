import { useState, useEffect } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const elements = doc.querySelectorAll("h1, h2, h3");
    
    const items: TOCItem[] = [];
    elements.forEach((el, index) => {
      const id = `heading-${index}`;
      const text = el.textContent || "";
      const level = parseInt(el.tagName[1]);
      items.push({ id, text, level });
    });
    
    setHeadings(items);
  }, [content]);

  useEffect(() => {
    // Add IDs to actual headings in the DOM
    const articleContent = document.querySelector(".prose-content");
    if (articleContent) {
      const headingElements = articleContent.querySelectorAll("h1, h2, h3");
      headingElements.forEach((el, index) => {
        el.id = `heading-${index}`;
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
        <List className="h-4 w-4" />
        Mục lục
      </div>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "block text-sm py-1 transition-colors hover:text-primary",
              heading.level === 2 && "pl-0",
              heading.level === 3 && "pl-4",
              activeId === heading.id
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(heading.id)?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default TableOfContents;
