import { useState, useEffect } from "react";
import Constants from "expo-constants";

const BASE_URL = "https://newsapi.org/v2/everything";

const topics = [
  "crop disease outbreaks India",
  "pest infestations India",
  "new farming techniques India",
  "climate change effects on agriculture India",
  "organic farming trends India",
];

// Hook to fetch news articles
export const useNews = (initialCount: number = 3) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [articleCount, setArticleCount] = useState<number>(initialCount); // Track news count

  const API_KEY = Constants.expoConfig?.extra?.news_api_key; // Replace with your News API key

  const fetchNews = async (count: number) => {
    try {
      setLoading(true);
      let allNews: any[] = [];

      for (const topic of topics) {
        const url = `${BASE_URL}?q=${topic}&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        if (data.status === "error" && data.code === "rateLimited") {
          setError("⚠️ An internal error occurred. Please try again later.");
          setLoading(false);
          return;
        }
        
        if (data.articles) {
          allNews = [...allNews, ...data.articles];
        }
        
      }

      setNews(allNews.slice(0, count)); // Limit the number of articles
    } catch (err) {
      setError("Error fetching news.");
    } finally {
      setLoading(false);
    }
  };

  // Load more news when called
  const fetchMoreNews = () => {
    setArticleCount((prev) => prev + 10); // Increase count by 10
  };

  useEffect(() => {
    fetchNews(articleCount);
  }, [articleCount]); // Re-fetch when article count changes

  return { news, loading, error, fetchMoreNews };
};
