import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ChatbotTraining {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  language: string;
  priority: number;
  active: boolean;
}

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [messages, setMessages] = useState<Array<{ text: string; isBot: boolean }>>([
    { text: language === "vi" ? "Xin chào! Tôi có thể giúp gì cho bạn?" : "Hello! How can I help you?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [trainings, setTrainings] = useState<ChatbotTraining[]>([]);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    const { data } = await supabase
      .from("chatbot_training")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: false });

    if (data) {
      setTrainings(data);
    }
  };

  const findBestAnswer = (userInput: string): string => {
    const normalizedInput = userInput.toLowerCase();
    
    const relevantTrainings = trainings.filter(
      (t) => t.language === language
    );

    let bestMatch: ChatbotTraining | null = null;
    let highestPriority = -1;

    for (const training of relevantTrainings) {
      const hasMatch = training.keywords.some((keyword) =>
        normalizedInput.includes(keyword.toLowerCase())
      );

      if (hasMatch && training.priority >= highestPriority) {
        bestMatch = training;
        highestPriority = training.priority;
      }
    }

    if (bestMatch) {
      return bestMatch.answer;
    }

    return language === "vi"
      ? "Cảm ơn bạn đã liên hệ! Đây là phản hồi tự động. Để được hỗ trợ tốt nhất, vui lòng điền form liên hệ."
      : "Thank you for reaching out! This is an automated response. For best support, please fill out the contact form.";
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, isBot: false };
    const userInput = inputValue;
    setMessages([...messages, userMessage]);
    setInputValue("");
    
    setTimeout(() => {
      const botResponse = {
        text: findBestAnswer(userInput),
        isBot: true
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  const toggleLanguage = () => {
    const newLang = language === "vi" ? "en" : "vi";
    setLanguage(newLang);
    setMessages([{
      text: newLang === "vi" ? "Xin chào! Tôi có thể giúp gì cho bạn?" : "Hello! How can I help you?",
      isBot: true
    }]);
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-4 sm:right-8 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="gold-gradient p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-background" />
                <span className="font-semibold text-background">
                  {language === "vi" ? "Trợ lý ảo" : "Virtual Assistant"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1 bg-background/20 hover:bg-background/30 rounded text-xs font-medium text-background transition-colors"
                >
                  {language === "vi" ? "EN" : "VI"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-background hover:bg-background/20 rounded-full p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-secondary/20">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? "bg-card border border-border"
                        : "gold-gradient text-background"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder={language === "vi" ? "Nhập tin nhắn..." : "Type a message..."}
                  className="flex-1 bg-secondary/50 border-border"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="gold-gradient hover:opacity-90 transition-opacity shrink-0"
                >
                  <Send className="h-4 w-4 text-background" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="fixed bottom-6 right-4 sm:right-8 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full gold-gradient hover:opacity-90 transition-opacity shadow-lg glow-gold"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-background" />
          ) : (
            <MessageCircle className="h-6 w-6 text-background" />
          )}
        </Button>
      </motion.div>
    </>
  );
};

export default FloatingChat;
