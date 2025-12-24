
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, MarketInsight, NewsArticle } from "../types";

// Always initialize with direct process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketAnalysis = async (stock: StockData): Promise<MarketInsight> => {
  const prompt = `Analyze the current market performance of ${stock.name} (${stock.symbol}). 
  Current Price: $${stock.price}
  Change: ${stock.changePercent}%
  Historical Data: ${JSON.stringify(stock.history.slice(-5))}
  
  Provide a detailed technical and sentiment analysis.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING, description: "One of: Bullish, Bearish, Neutral" },
          summary: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          keyFactors: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["sentiment", "summary", "recommendation", "keyFactors"]
      }
    }
  });

  try {
    // text is a property, not a method.
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {
      sentiment: 'Neutral',
      summary: 'Analysis currently unavailable due to data formatting issues.',
      recommendation: 'Hold',
      keyFactors: ['Network latency', 'Model timeout']
    };
  }
};

export const getStockNews = async (stock: StockData): Promise<NewsArticle[]> => {
  const prompt = `Search for the 3 most recent and impactful financial news articles for ${stock.name} (${stock.symbol}). 
  Provide news title, source, a brief summary, relative time, and URL.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // Guidelines: grounding tools may not return JSON in response.text.
      // We will extract structured data if possible, and URLs from groundingMetadata.
    }
  });

  try {
    const text = response.text || "";
    // Crude extraction of JSON if model wraps it in Markdown
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    let articles: NewsArticle[] = [];
    
    try {
      articles = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, the model might have just returned text.
      return [];
    }

    // MANDATORY: Extract URLs from groundingChunks when using googleSearch
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      articles = articles.map((article, idx) => {
        const chunk = groundingChunks[idx];
        if (chunk?.web?.uri) {
          return { ...article, url: chunk.web.uri };
        }
        return article;
      });
    }

    return articles;
  } catch (e) {
    console.error("Failed to process news response", e);
    return [];
  }
};
