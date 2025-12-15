import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Theme,
  initializeTheme,
  applyTheme,
  getUserTheme,
  getDefaultTheme,
  setUserTheme as setUserThemeService,
} from "@/services/themeService";

type DatabaseThemeProviderProps = {
  children: React.ReactNode;
};

type DatabaseThemeProviderState = {
  currentTheme: Theme | null;
  availableThemes: Theme[];
  isLoading: boolean;
  setTheme: (themeId: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
};

const DatabaseThemeProviderContext = createContext<DatabaseThemeProviderState | undefined>(undefined);

export function DatabaseThemeProvider({
  children,
}: DatabaseThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch available themes
  const { data: availableThemes = [] } = useQuery({
    queryKey: ["active-themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching themes:", error);
        return [];
      }

      return data as Theme[];
    },
  });

  // Initialize theme on mount and when user changes
  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      try {
        const theme = await initializeTheme(user?.id || null);
        setCurrentTheme(theme);
      } catch (error) {
        console.error("Error initializing theme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [user?.id]);

  const setTheme = useCallback(
    async (themeId: string) => {
      if (!user?.id) {
        console.error("Cannot set theme for anonymous user");
        return;
      }

      // Find the theme object
      const selectedTheme = availableThemes.find((t) => t.id === themeId);
      if (!selectedTheme) {
        console.error("Theme not found:", themeId);
        return;
      }

      try {
        // Save to database
        const success = await setUserThemeService(user.id, themeId);
        if (success) {
          // Apply theme to DOM
          applyTheme(selectedTheme);
          setCurrentTheme(selectedTheme);
        }
      } catch (error) {
        console.error("Error setting theme:", error);
      }
    },
    [user?.id, availableThemes]
  );

  const resetToDefault = useCallback(async () => {
    if (!user?.id) {
      // For anonymous users, just load default
      const defaultTheme = await getDefaultTheme();
      if (defaultTheme) {
        applyTheme(defaultTheme);
        setCurrentTheme(defaultTheme);
      }
      return;
    }

    try {
      // Clear user preference from database
      const { error } = await supabase
        .from("user_themes")
        .delete()
        .eq("user_id", user.id);

      if (!error) {
        // Load default theme
        const defaultTheme = await getDefaultTheme();
        if (defaultTheme) {
          applyTheme(defaultTheme);
          setCurrentTheme(defaultTheme);
        }
      }
    } catch (error) {
      console.error("Error resetting theme:", error);
    }
  }, [user?.id]);

  return (
    <DatabaseThemeProviderContext.Provider
      value={{
        currentTheme,
        availableThemes,
        isLoading,
        setTheme,
        resetToDefault,
      }}
    >
      {children}
    </DatabaseThemeProviderContext.Provider>
  );
}

export const useDatabaseTheme = () => {
  const context = useContext(DatabaseThemeProviderContext);
  if (context === undefined) {
    throw new Error(
      "useDatabaseTheme must be used within a DatabaseThemeProvider"
    );
  }
  return context;
};
