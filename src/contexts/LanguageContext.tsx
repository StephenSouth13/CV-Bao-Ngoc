import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    home: "Home",
    about: "About",
    projects: "Projects",
    contact: "Contact",
    admin: "Admin",
    viewMore: "View More",
    viewDetails: "View Details",
    backToProjects: "Back to Projects",
    featuredProjects: "Featured Projects",
    allProjects: "All Projects",
    technologies: "Technologies",
    challenge: "Challenge",
    solution: "Solution",
    projectMetrics: "Project Metrics",
  },
  vi: {
    home: "Trang chủ",
    about: "Về tôi",
    projects: "Dự án",
    contact: "Liên hệ",
    admin: "Quản trị",
    viewMore: "Xem thêm",
    viewDetails: "Xem chi tiết",
    backToProjects: "Quay lại dự án",
    featuredProjects: "Dự án nổi bật",
    allProjects: "Tất cả dự án",
    technologies: "Công nghệ",
    challenge: "Thách thức",
    solution: "Giải pháp",
    projectMetrics: "Chỉ số dự án",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("vi");

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
