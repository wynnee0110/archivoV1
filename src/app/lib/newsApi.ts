export type NewsPost = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_news: boolean;
  link: string;
  author: {
    full_name: string;
    username: string;
    avatar_url: string;
    badge: string;
    border_variant: string;
  };
};

export const fetchTechNews = async (): Promise<NewsPost[]> => {
  const GNEWS_KEY = "8f2b903e0d4d254fde49ad9c5ebb157a"; 
  const GUARDIAN_KEY = "849b2598-32b9-4e28-a97f-21fc5f86fcf0"; 
  
  try {
    const gnewsUrl = `https://gnews.io/api/v4/top-headlines?lang=en&country=us&max=10&apikey=${GNEWS_KEY}`;
    
    // 1. Added "bodyText" to show-fields for full content
    const guardianUrl = `https://content.guardianapis.com/search?section=technology&show-fields=thumbnail,trailText,bodyText&page-size=10&api-key=${GUARDIAN_KEY}`;

    const [gnewsRes, guardianRes] = await Promise.all([
      fetch(gnewsUrl),
      fetch(guardianUrl)
    ]);

    const gnewsData = await gnewsRes.json();
    const guardianData = await guardianRes.json();

    // 2. Format GNews (Use article.content if description is short)
    const gnewsFormatted = (gnewsData.articles || []).map((article: any, index: number) => ({
      id: `gnews-${index}-${article.publishedAt}`,
      title: article.title,
      // Fallback logic to get the longest text available
      content: article.content || article.description || "No content available.",
      image_url: article.image,
      created_at: article.publishedAt,
      link: article.url,
      is_news: true,
      author: {
        full_name: article.source.name || "Global News",
        username: "gnews",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/21/21601.png", 
        badge: "bot",
        border_variant: "ghost"
      }
    }));

    // 3. Format Guardian (Use bodyText for the full article)
    const guardianFormatted = (guardianData.response?.results || []).map((article: any, index: number) => {
      // Use bodyText for the full article, fallback to trailText
      const fullContent = article.fields?.bodyText || article.fields?.trailText || "";
      
      return {
        id: `guardian-${index}-${article.webPublicationDate}`,
        title: article.webTitle,
        content: fullContent.replace(/<[^>]*>?/gm, ''), // Clean HTML
        image_url: article.fields?.thumbnail || null,
        created_at: article.webPublicationDate,
        link: article.webUrl,
        is_news: true,
        author: {
          full_name: "The Guardian",
          username: "guardian",
          avatar_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2VsbKU5ZIyU7Lo9H-s_zj7WhX2A4yyxK8dA&s", 
          badge: "verified",
          border_variant: "fire"
        }
      };
    });

    const combinedNews = [...gnewsFormatted, ...guardianFormatted];
    return combinedNews.length > 0 ? combinedNews : MOCK_NEWS;

  } catch (error) {
    console.error("Fetch failed:", error);
    return MOCK_NEWS;
  }
};

const MOCK_NEWS: NewsPost[] = [
  {
    id: "mock-gnews",
    title: "News Feed Loading...",
    content: "We are currently pulling the latest stories from GNews and The Guardian. If this persists, please check your API keys!",
    image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000",
    created_at: new Date().toISOString(),
    link: "https://gnews.io",
    is_news: true,
    author: {
      full_name: "System Bot",
      username: "system",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
      badge: "admin",
      border_variant: "ghost"
    }
  }
];