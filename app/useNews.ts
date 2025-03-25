import { useState, useEffect } from "react";

const BASE_URL = "https://newsapi.org/v2/everything";

const topics = [
  "crop disease outbreaks India",
  "pest infestations India",
  "extreme weather impact on farming India",
  "agriculture policy changes India",
  "new farming techniques India",
  "climate change effects on agriculture India",
  "government subsidies for farmers India",
  "organic farming trends India",
  "market prices for crops India",
  "farmer protests and issues India",
];

// Hook to fetch news articles
export const useNews = (initialCount: number = 10, API_KEY: string = "9a180595ebed44ca9aaf845c8dd34414") => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [articleCount, setArticleCount] = useState<number>(initialCount); // Track news count

  const fetchNews = async (count: number) => {
    try {
      setLoading(true);
      let allNews: any[] = [];

      for (const topic of topics) {
        const url = `${BASE_URL}?q=${topic}&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
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
