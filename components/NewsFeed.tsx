
import React from 'react';
import { NewsArticle } from '../types';

interface NewsFeedProps {
  news: NewsArticle[];
  isLoading: boolean;
  stockSymbol: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading, stockSymbol }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-slate-800 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-800 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-500 italic">No recent news found for {stockSymbol}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((article, idx) => (
        <a 
          key={idx} 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded">
              {article.source}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{article.time}</span>
          </div>
          <h4 className="text-white font-bold mb-2 group-hover:text-emerald-400 transition-colors leading-snug">
            {article.title}
          </h4>
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
          <div className="mt-3 flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-tighter gap-1">
            Read Article 
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );
};

export default NewsFeed;
