
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, MarketInsight, NewsArticle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    return JSON.parse(response.text);
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
  Provide the news title, source name, a very brief summary (1-2 sentences), a relative time (e.g. "2 hours ago"), and the article URL.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            time: { type: Type.STRING },
            summary: { type: Type.STRING },
            url: { type: Type.STRING }
          },
          required: ["title", "source", "time", "summary", "url"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse news response", e);
    return [];
  }
};
