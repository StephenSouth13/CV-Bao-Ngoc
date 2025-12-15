import { supabase } from "@/integrations/supabase/client";

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  primary_color: string;
  css_variables: Record<string, string>;
  is_active: boolean;
  is_seasonal: boolean;
}

/**
 * Fetch all active themes from database
 */
export const fetchActiveThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching themes:", error);
    return [];
  }

  return data || [];
};

/**
 * Fetch a specific theme by slug
 */
export const fetchThemeBySlug = async (slug: string): Promise<Theme | null> => {
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(`Error fetching theme ${slug}:`, error);
    return null;
  }

  return data;
};

/**
 * Get user's selected theme
 * Priority: User theme > Default setting > 'light' fallback
 */
export const getUserTheme = async (userId: string): Promise<Theme | null> => {
  // Check if user has selected a theme
  const { data: userTheme } = await supabase
    .from("user_themes")
    .select(`
      *,
      themes (*)
    `)
    .eq("user_id", userId)
    .single();

  if (userTheme?.themes) {
    return userTheme.themes as Theme;
  }

  // Fallback to default website theme
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "default_website_theme")
    .single();

  const defaultSlug = settings?.value || "light";
  return await fetchThemeBySlug(defaultSlug);
};

/**
 * Get theme for anonymous user
 * Priority: Default setting > 'light' fallback
 */
export const getDefaultTheme = async (): Promise<Theme | null> => {
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "default_website_theme")
    .single();

  const defaultSlug = settings?.value || "light";
  return await fetchThemeBySlug(defaultSlug);
};

/**
 * Apply theme CSS variables to DOM
 */
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // Clear previous theme class
  root.className = root.className.replace(/data-theme-\S+/g, '');

  // Apply all CSS variables from the theme
  Object.entries(theme.css_variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Store current theme slug in localStorage
  localStorage.setItem("current_theme_slug", theme.slug);

  // Add theme slug as data attribute for CSS selectors
  root.setAttribute("data-theme", theme.slug);

  // Force re-render by dispatching custom event
  window.dispatchEvent(new Event('theme-changed'));
};

/**
 * Set user's theme preference
 */
export const setUserTheme = async (
  userId: string,
  themeId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from("user_themes")
    .upsert({
      user_id: userId,
      theme_id: themeId,
    }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Error setting user theme:", error);
    return false;
  }

  return true;
};

/**
 * Clear user's theme preference (revert to default)
 */
export const clearUserTheme = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("user_themes")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error clearing user theme:", error);
    return false;
  }

  return true;
};

/**
 * Get current theme from localStorage
 */
export const getCurrentThemeSlug = (): string | null => {
  return localStorage.getItem("current_theme_slug");
};

/**
 * Initialize theme on app load
 */
export const initializeTheme = async (userId: string | null) => {
  let theme: Theme | null = null;

  if (userId) {
    theme = await getUserTheme(userId);
  } else {
    theme = await getDefaultTheme();
  }

  if (theme) {
    applyTheme(theme);
    return theme;
  }

  // Ultimate fallback to light theme if nothing found
  const fallback = await fetchThemeBySlug("light");
  if (fallback) {
    applyTheme(fallback);
  }

  return fallback;
};
