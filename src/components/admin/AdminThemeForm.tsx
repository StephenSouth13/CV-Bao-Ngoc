import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Palette } from "lucide-react";
import { toast } from "sonner";

interface ThemeFormProps {
  theme?: any;
  onSaved?: () => void;
}

// Seasonal theme presets
const SEASONAL_THEME_PRESETS = {
  tet_lunar_new_year: {
    name: 'Tết Nguyên Đán',
    description: 'Giao diện lễ Tết Nguyên Đán với màu đỏ và vàng',
    category: 'seasonal',
    primary_color: '#DC2626',
    css_variables: {
      "--color-primary": "#DC2626",
      "--color-secondary": "#FBBF24",
      "--color-background": "#FEF3C7",
      "--color-text-body": "#78350F",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: true,
  },
  noel_christmas: {
    name: 'Giáng Sinh',
    description: 'Giao diện Giáng Sinh với màu đỏ và xanh lục',
    category: 'seasonal',
    primary_color: '#DC2626',
    css_variables: {
      "--color-primary": "#DC2626",
      "--color-secondary": "#15803D",
      "--color-background": "#F0F9FF",
      "--color-text-body": "#166534",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: true,
  },
  spring_season: {
    name: 'Mùa Xuân',
    description: 'Giao diện Mùa Xuân tươi tắn',
    category: 'seasonal',
    primary_color: '#10B981',
    css_variables: {
      "--color-primary": "#10B981",
      "--color-secondary": "#EC4899",
      "--color-background": "#F0FDF4",
      "--color-text-body": "#065F46",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: true,
  },
  summer_season: {
    name: 'Mùa Hè',
    description: 'Giao diện Mùa Hè sáng sủa',
    category: 'seasonal',
    primary_color: '#F59E0B',
    css_variables: {
      "--color-primary": "#F59E0B",
      "--color-secondary": "#06B6D4",
      "--color-background": "#FEFCE8",
      "--color-text-body": "#78350F",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: true,
  },
  autumn_season: {
    name: 'Mùa Thu',
    description: 'Giao diện Mùa Thu ấm áp',
    category: 'seasonal',
    primary_color: '#EA580C',
    css_variables: {
      "--color-primary": "#EA580C",
      "--color-secondary": "#92400E",
      "--color-background": "#FEF3C7",
      "--color-text-body": "#78350F",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: true,
  },
  winter_season: {
    name: 'Mùa Đông',
    description: 'Giao diện Mùa Đông lạnh lẽo',
    category: 'seasonal',
    primary_color: '#0369A1',
    css_variables: {
      "--color-primary": "#0369A1",
      "--color-secondary": "#6366F1",
      "--color-background": "#F0F9FF",
      "--color-text-body": "#0C2340",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: true,
  },
  green_white: {
    name: 'Xanh lá - Trắng',
    description: 'Giao diện tinh tế với xanh lá cây và trắng',
    category: 'custom',
    primary_color: '#059669',
    css_variables: {
      "--color-primary": "#059669",
      "--color-secondary": "#10B981",
      "--color-background": "#F9FAFB",
      "--color-text-body": "#0F766E",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem"
    },
    is_seasonal: false,
  },
};

const CSS_VARIABLE_FIELDS = [
  {
    key: "--color-primary",
    label: "Primary Color",
    type: "color",
  },
  {
    key: "--color-secondary",
    label: "Secondary Color",
    type: "color",
  },
  {
    key: "--color-background",
    label: "Background Color",
    type: "color",
  },
  {
    key: "--color-text-body",
    label: "Text Color",
    type: "color",
  },
  {
    key: "--font-family-base",
    label: "Font Family",
    type: "text",
  },
  {
    key: "--border-radius-base",
    label: "Border Radius",
    type: "text",
    placeholder: "e.g., 0.5rem",
  },
];

const AdminThemeForm = ({ theme, onSaved }: ThemeFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "custom",
    primary_color: "#3B82F6",
    is_active: true,
    is_seasonal: false,
    sort_order: 0,
    css_variables: {
      "--color-primary": "#3B82F6",
      "--color-secondary": "#10B981",
      "--color-background": "#FFFFFF",
      "--color-text-body": "#000000",
      "--font-family-base": "system-ui, -apple-system, sans-serif",
      "--border-radius-base": "0.5rem",
    },
  });

  useEffect(() => {
    if (theme) {
      setFormData({
        name: theme.name,
        slug: theme.slug,
        description: theme.description || "",
        category: theme.category,
        primary_color: theme.primary_color,
        is_active: theme.is_active,
        is_seasonal: theme.is_seasonal,
        sort_order: theme.sort_order || 0,
        css_variables: theme.css_variables || {},
      });
    }
  }, [theme]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name || !formData.slug) {
        throw new Error("Name and slug are required");
      }

      if (theme) {
        // Update existing theme
        const { error } = await supabase
          .from("themes")
          .update(formData)
          .eq("id", theme.id);

        if (error) throw error;
      } else {
        // Create new theme
        const { error } = await supabase.from("themes").insert([formData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast.success(theme ? "Theme updated" : "Theme created");
      onSaved?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save theme");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "slug") {
      // Auto-generate slug from name if not manually edited
      setFormData({
        ...formData,
        [name]: value.toLowerCase().replace(/\s+/g, "_"),
      });
    } else if (["sort_order"].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleCssVariableChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      css_variables: {
        ...formData.css_variables,
        [key]: value,
      },
    });

    // Update primary color when primary color CSS var changes
    if (key === "--color-primary") {
      setFormData((prev) => ({
        ...prev,
        primary_color: value,
      }));
    }
  };

  const handleGenerateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    setFormData({
      ...formData,
      slug,
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = SEASONAL_THEME_PRESETS[presetKey as keyof typeof SEASONAL_THEME_PRESETS];
    if (!preset) return;

    setFormData({
      ...formData,
      name: preset.name,
      slug: presetKey,
      description: preset.description,
      category: preset.category,
      primary_color: preset.primary_color,
      is_seasonal: preset.is_seasonal,
      css_variables: preset.css_variables,
    });
    toast.success(`Áp dụng preset "${preset.name}"`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
      className="space-y-6"
    >
      {/* Seasonal Theme Presets */}
      {!theme && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Chọn Preset Theme Theo Mùa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(SEASONAL_THEME_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  onClick={() => handleApplyPreset(key)}
                  className="h-auto flex-col items-start p-3 text-left"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: preset.primary_color }}
                    />
                    <span className="font-semibold text-sm">{preset.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{preset.category}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Theme Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Dark Premium"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., dark_premium"
                  required
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateSlug}
                  className="flex-shrink-0"
                >
                  Auto
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe this theme..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(val) => handleSelectChange("category", val)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleCheckChange("is_active", checked as boolean)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (show to users)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_seasonal"
                checked={formData.is_seasonal}
                onCheckedChange={(checked) => handleCheckChange("is_seasonal", checked as boolean)}
              />
              <Label htmlFor="is_seasonal" className="cursor-pointer">
                Seasonal Theme
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSS Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CSS_VARIABLE_FIELDS.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === "color" ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      id={field.key}
                      type="text"
                      value={formData.css_variables[field.key] || ""}
                      onChange={(e) => handleCssVariableChange(field.key, e.target.value)}
                      placeholder="e.g., #3B82F6"
                      className="font-mono text-sm"
                    />
                  </div>
                  <input
                    type="color"
                    value={formData.css_variables[field.key] || "#000000"}
                    onChange={(e) => handleCssVariableChange(field.key, e.target.value)}
                    className="h-10 w-12 border rounded cursor-pointer"
                  />
                </div>
              ) : (
                <Input
                  id={field.key}
                  type="text"
                  value={formData.css_variables[field.key] || ""}
                  onChange={(e) => handleCssVariableChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="font-mono text-sm"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-8 rounded-lg border space-y-4"
            style={{
              "--color-primary": formData.css_variables["--color-primary"],
              "--color-secondary": formData.css_variables["--color-secondary"],
              "--color-background": formData.css_variables["--color-background"],
              "--color-text-body": formData.css_variables["--color-text-body"],
              "--font-family-base": formData.css_variables["--font-family-base"],
              "--border-radius-base": formData.css_variables["--border-radius-base"],
            } as React.CSSProperties}
          >
            <div
              style={{
                color: "var(--color-text-body)",
                fontFamily: "var(--font-family-base)",
              }}
            >
              <h3
                style={{ color: "var(--color-primary)" }}
                className="text-lg font-bold mb-2"
              >
                {formData.name || "Theme Preview"}
              </h3>
              <p
                style={{ color: "var(--color-secondary)" }}
                className="text-sm mb-4"
              >
                {formData.description || "No description"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    borderRadius: "var(--border-radius-base)",
                  }}
                  className="px-4 py-2 text-sm font-medium"
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "white",
                    borderRadius: "var(--border-radius-base)",
                  }}
                  className="px-4 py-2 text-sm font-medium"
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Theme
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AdminThemeForm;
