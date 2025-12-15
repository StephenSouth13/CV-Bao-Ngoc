import { useDatabaseTheme } from "@/components/DatabaseThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const ThemeSelector = () => {
  const { currentTheme, availableThemes, setTheme, resetToDefault } = useDatabaseTheme();

  if (!currentTheme) {
    return null;
  }

  // Group themes by category
  const groupedThemes = availableThemes.reduce(
    (acc, theme) => {
      if (!acc[theme.category]) {
        acc[theme.category] = [];
      }
      acc[theme.category].push(theme);
      return acc;
    },
    {} as Record<string, typeof availableThemes>
  );

  const handleThemeChange = async (themeId: string) => {
    try {
      await setTheme(themeId);
      const theme = availableThemes.find((t) => t.id === themeId);
      toast.success(`Switched to "${theme?.name}" theme`);
    } catch (error) {
      toast.error("Failed to switch theme");
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefault();
      toast.success("Reset to default theme");
    } catch (error) {
      toast.error("Failed to reset theme");
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      default: "Default",
      seasonal: "Seasonal",
      minimal: "Minimal",
      corporate: "Corporate",
      custom: "Custom",
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10"
          title="Change theme"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span>Themes</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(groupedThemes).map(([category, themes]) => (
          <div key={category}>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              {getCategoryLabel(category)}
            </DropdownMenuLabel>
            {themes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`cursor-pointer ${
                  currentTheme.id === theme.id ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-4 h-4 rounded-full border border-muted-foreground"
                    style={{
                      backgroundColor: theme.primary_color,
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{theme.name}</div>
                    {theme.description && (
                      <div className="text-xs text-muted-foreground">
                        {theme.description}
                      </div>
                    )}
                  </div>
                  {currentTheme.id === theme.id && (
                    <span className="text-primary text-xs font-semibold">✓</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1" />
          </div>
        ))}

        <DropdownMenuItem
          onClick={handleReset}
          className="cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          <span className="text-sm">Reset to default</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
