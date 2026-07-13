import { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Loader2, Clock, Rss } from 'lucide-react';
import api from '../services/api';

const SOURCE_COLORS = {
    "Economic Times Markets": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Moneycontrol":           "bg-green-500/10 text-green-400 border-green-500/20",
    "LiveMint Markets":       "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Yahoo Finance":          "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "Seeking Alpha":          "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function ArticleCard({ article }) {
    const badgeClass = SOURCE_COLORS[article.source] || "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-color)]";

    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50 border border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 rounded-2xl p-5 transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
            <div className="flex items-center justify-between gap-3">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${badgeClass}`}>
                    {article.source}
                </span>
                <ExternalLink size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            <h3 className="font-bold text-sm md:text-[15px] text-[var(--text-main)] leading-snug group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                {article.title}
            </h3>
            {article.summary && (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 font-medium">
                    {article.summary.replace(/<[^>]*>/g, '')}
                </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium mt-auto pt-1 border-t border-[var(--border-color)]">
                <Clock size={11} />
                {article.published}
            </div>
        </a>
    );
}

export default function NewsFeed({ theme }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeSource, setActiveSource] = useState("All");

    const fetchNews = useCallback(async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setLoading(true);
        try {
            const res = await api.get("/screener/news?limit=50");
            setArticles(res.data.articles || []);
        } catch (err) {
            console.error("News fetch error:", err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchNews(); }, [fetchNews]);

    const sources = ["All", ...Object.keys(SOURCE_COLORS)];
    const filtered = activeSource === "All"
        ? articles
        : articles.filter(a => a.source === activeSource);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-10 px-0 md:px-2 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4 md:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">News Feed</h1>
                    <p className="text-[11px] md:text-[13px] text-[var(--text-muted)] font-medium flex items-center gap-2">
                        <Rss size={16} className="text-[var(--accent-primary)]" />
                        Live financial news from top sources — updated every 10 minutes
                    </p>
                </div>
                <button
                    onClick={() => fetchNews(true)}
                    disabled={isRefreshing}
                    className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                >
                    <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Source Filter Tabs */}
            <div className="flex gap-2 flex-wrap px-4 md:px-0">
                {sources.map(src => (
                    <button
                        key={src}
                        onClick={() => setActiveSource(src)}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-black border transition-all ${
                            activeSource === src
                                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/25'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:text-[var(--text-main)]'
                        }`}
                    >
                        {src}
                        {src !== "All" && <span className="ml-1.5 opacity-70">({articles.filter(a => a.source === src).length})</span>}
                    </button>
                ))}
            </div>

            {/* Articles Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-10 h-10 text-[var(--accent-primary)] animate-spin" />
                    <p className="text-sm text-[var(--text-muted)] font-medium">Fetching latest market news...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 px-4 md:px-0">
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <Newspaper size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
                            <p className="text-[var(--text-muted)] text-sm font-medium">No articles found for this source.</p>
                        </div>
                    ) : filtered.map((article, idx) => (
                        <ArticleCard key={idx} article={article} />
                    ))}
                </div>
            )}
        </div>
    );
}
