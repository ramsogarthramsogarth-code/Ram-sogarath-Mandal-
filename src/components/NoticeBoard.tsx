import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { translations, Language, CategoryInfo } from '../translations';
import { Notice } from '../types';
import { Bell, AlertCircle, Calendar, Newspaper, Award, RefreshCw, Layers } from 'lucide-react';

interface NoticeBoardProps {
  language: Language;
}

export function NoticeBoard({ language }: NoticeBoardProps) {
  const t = translations[language];

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | CategoryInfo>('all');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    // Realtime sync notices
    const unsubscribe = onSnapshot(collection(db, 'notices'), (snapshot) => {
      const list: Notice[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Notice);
      });
      // Sort: newest first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotices(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCategoryTheme = (cat: CategoryInfo) => {
    switch (cat) {
      case 'emergency':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900';
      case 'event':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900';
      case 'news':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900';
      default: // notice
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900';
    }
  };

  const getCategoryIcon = (cat: CategoryInfo) => {
    switch (cat) {
      case 'emergency':
        return <AlertCircle className="w-5 h-5 shrink-0" />;
      case 'event':
        return <Award className="w-5 h-5 shrink-0" />;
      case 'news':
        return <Newspaper className="w-5 h-5 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 shrink-0" />;
    }
  };

  const filteredNotices = notices.filter(
    (n) => filter === 'all' || n.category === filter
  );

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="noticeboard-container">
      {/* Search/Filter Pills */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-4 scrollbar-hide" id="notice-filter-scroller">
        {(['all', 'notice', 'news', 'event', 'emergency'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            id={`filter-pill-${cat}`}
          >
            {cat === 'all' ? (language === 'ne' ? 'सबै' : 'All') : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20" id="notice-loading">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4" id="notices-timeline">
          {filteredNotices.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-md border border-slate-100 dark:border-slate-700 text-center" id="notices-empty-card">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-semibold">{language === 'ne' ? 'यो श्रेणीमा कुनै सूचना भेटिएन।' : 'No notices in this category.'}</p>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <motion.div
                key={notice.id}
                layoutId={`notice-card-${notice.id}`}
                onClick={() => setSelectedNotice(notice)}
                className={`border border-solid p-5 rounded-3xl shadow-sm bg-white dark:bg-slate-800 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
                  notice.category === 'emergency' ? 'border-rose-400 dark:border-rose-950' : 'border-slate-100 dark:border-slate-700'
                }`}
                id={`notice-item-${notice.id}`}
              >
                <div className="flex justify-between items-start" id={`notice-item-top-${notice.id}`}>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryTheme(notice.category)}`}>
                    {getCategoryIcon(notice.category)}
                    <span className="capitalize text-[10px] font-black tracking-wider">{notice.category === 'emergency' && language === 'ne' ? 'आपतकालीन' : notice.category}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-bold dark:text-slate-450">{notice.date}</span>
                </div>

                <div className="mt-4" id={`notice-item-content-${notice.id}`}>
                  <h4 className="text-md font-bold text-slate-950 dark:text-white leading-snug">
                    {notice.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-350 line-clamp-2 mt-2 leading-relaxed">
                    {notice.description}
                  </p>
                </div>

                {notice.imageUrl && (
                  <div className="w-full h-32 mt-4 rounded-2xl overflow-hidden shadow-inner-md border border-slate-100 dark:border-slate-700" id={`notice-img-box-${notice.id}`}>
                    <img src={notice.imageUrl} alt={notice.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-750 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400" id={`notice-item-bottom-${notice.id}`}>
                  <span>By: <strong className="text-slate-800 dark:text-slate-300 font-bold">{notice.postedBy}</strong></span>
                  <span className="text-blue-600 font-black hover:underline hover:text-blue-500">
                    {language === 'ne' ? 'विस्तृत विवरण »' : 'Read details »'}
                  </span>
                </div>
              </motion.div>
            ))
          )}

          {/* Expand Modal / Backed overlay */}
          <AnimatePresence>
            {selectedNotice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center sm:items-center p-4"
                id="notice-modal-overlay"
              >
                <motion.div
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  exit={{ y: 50 }}
                  className="bg-white dark:bg-slate-800 h-[80vh] sm:h-auto sm:max-w-md w-full rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto border-t-8 border-blue-500 text-slate-900 dark:text-white flex flex-col justify-between"
                  id="notice-modal-content"
                >
                  <div id="modal-top">
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-4 mb-4" id="modal-notice-header">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryTheme(selectedNotice.category)}`}>
                          {getCategoryIcon(selectedNotice.category)}
                          <strong className="capitalize text-[8px] font-black tracking-widest">{selectedNotice.category}</strong>
                        </span>
                        <h3 className="text-md font-black text-slate-950 dark:text-white mt-2 leading-tight">
                          {selectedNotice.title}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">{selectedNotice.date} • By: {selectedNotice.postedBy}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedNotice(null)}
                        className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-bold bg-slate-100 dark:bg-slate-900 p-2 rounded-full cursor-pointer leading-none shrink-0"
                        id="modal-close-btn"
                      >
                        ✕
                      </button>
                    </div>

                    {selectedNotice.imageUrl && (
                      <div className="w-full h-40 max-h-48 rounded-2xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-700 shadow-md" id="modal-notice-img">
                        <img src={selectedNotice.imageUrl} alt={selectedNotice.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line" id="modal-notice-desc">
                      {selectedNotice.description}
                    </p>
                  </div>

                  {/* Simulated push alert notification mockup trigger */}
                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700" id="modal-notice-actions">
                    <button
                      onClick={() => alert(`📣 Instant Notification Alert sent: ${selectedNotice.title}`)}
                      className="w-full py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
                      id="pn-alert-mockup-btn"
                    >
                      🗣️ {language === 'ne' ? 'तत्काल पुश सूचना पठाउनुहोस् (Send Alert)' : 'Re-send Push Notification Announcement'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
