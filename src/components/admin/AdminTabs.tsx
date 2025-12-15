import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHero from "./AdminHero";
import AdminAbout from "./AdminAbout";
import AdminSkills from "./AdminSkills";
import AdminEducation from "./AdminEducation";
import AdminExperiences from "./AdminExperiences";
import AdminProjects from "./AdminProjects";
import AdminBlog from "./AdminBlog";
import AdminBlogCategories from "./AdminBlogCategories";
import AdminBlogTags from "./AdminBlogTags";
import AdminContact from "./AdminContact";
import AdminSubmissions from "./AdminSubmissions";
import AdminChatbot from "./AdminChatbot";
import AdminNavigationSettings from "./AdminNavigationSettings";
import AdminStore from "./AdminStore";
import AdminCertificates from "./AdminCertificates";
import AdminStoreSettings from "./AdminStoreSettings";
import AdminLogoSettings from "./AdminLogoSettings";
import AdminThemes from "./AdminThemes";
import AdminProductCategories from "./store/AdminProductCategories";
import AdminProducts from "./store/AdminProducts";

const AdminTabs = () => {
  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
        <TabsTrigger value="content">Nội dung</TabsTrigger>
        <TabsTrigger value="blog">Blog</TabsTrigger>
        <TabsTrigger value="store">Cửa hàng</TabsTrigger>
        <TabsTrigger value="contact">Liên hệ</TabsTrigger>
        <TabsTrigger value="system">Hệ thống</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 mb-6">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="about">Về tôi</TabsTrigger>
            <TabsTrigger value="skills">Kỹ năng</TabsTrigger>
            <TabsTrigger value="certificates">Chứng chỉ</TabsTrigger>
            <TabsTrigger value="education">Học vấn</TabsTrigger>
            <TabsTrigger value="experiences">Kinh nghiệm</TabsTrigger>
            <TabsTrigger value="projects">Dự án</TabsTrigger>
          </TabsList>
          <TabsContent value="hero"><AdminHero /></TabsContent>
          <TabsContent value="about"><AdminAbout /></TabsContent>
          <TabsContent value="skills"><AdminSkills /></TabsContent>
          <TabsContent value="certificates"><AdminCertificates /></TabsContent>
          <TabsContent value="education"><AdminEducation /></TabsContent>
          <TabsContent value="experiences"><AdminExperiences /></TabsContent>
          <TabsContent value="projects"><AdminProjects /></TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="blog">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="posts">Bài viết</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>
          <TabsContent value="posts"><AdminBlog /></TabsContent>
          <TabsContent value="categories"><AdminBlogCategories /></TabsContent>
          <TabsContent value="tags"><AdminBlogTags /></TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="store">
        {/* AdminStore already renders its own nested tabs (dashboard/products/categories/orders) */}
        <AdminStore />
      </TabsContent>

      <TabsContent value="contact">
        {/* Unified contact admin: socials, contact info and footer_text are managed inside AdminContact */}
        <AdminContact />
      </TabsContent>

      <TabsContent value="system">
        <Tabs defaultValue="navigation" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="navigation">Điều hướng</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
            <TabsTrigger value="submissions">Tin nhắn</TabsTrigger>
          </TabsList>
          <TabsContent value="navigation"><AdminNavigationSettings /></TabsContent>
          <TabsContent value="logo"><AdminLogoSettings /></TabsContent>
          <TabsContent value="themes"><AdminThemes /></TabsContent>
          <TabsContent value="chatbot"><AdminChatbot /></TabsContent>
          <TabsContent value="submissions"><AdminSubmissions /></TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
