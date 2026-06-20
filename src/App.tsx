import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from './translations';
import { AboutClub } from './components/AboutClub';
import { MembershipSystem } from './components/MembershipSystem';
import { MonthlyContributions } from './components/MonthlyContributions';
import { MeetingsManager } from './components/MeetingsManager';
import { NoticeBoard } from './components/NoticeBoard';
import { SocialServices } from './components/SocialServices';
import { Suggestions } from './components/Suggestions';
import { Gallery } from './components/Gallery';
import { AdminPanel } from './components/AdminPanel';
import { db } from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Notice, Meeting } from './types';
import { 
  Home as HomeIcon, Info, Users, Wallet, Calendar, HeartHandshake, 
  MessageSquare, Camera, ShieldAlert, Sun, Moon, Globe, LogIn 
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('ne');
  const [darkMode, setDarkMode] = useState(false);
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'membership' | 'contributions' | 'meetings' | 'social' | 'noticeboard' | 'suggestions' | 'gallery' | 'admin'>('home');

  // Unified Home Info stats (synced real-time)
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);

  // Toggle Dark Mode class on the body element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync some real-time notices & assemblies for Home dashboard widget
  useEffect(() => {
    const unsubNotices = onSnapshot(collection(db, 'notices'), (sn) => {
      const list: Notice[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Notice));
      list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentNotices(list.slice(0, 2)); // Grab latest 2
    });

    const unsubMeetings = onSnapshot(collection(db, 'meetings'), (sn) => {
      const list: Meeting[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Meeting));
      const up = list.filter(m => m.status === 'upcoming');
      up.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUpcomingMeetings(up.slice(0, 1)); // Grab next upcoming
    });

    return () => {
      unsubNotices();
      unsubMeetings();
    };
  }, []);

  const t = translations[language];

  // Render Component by Active Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutClub language={language} />;
      case 'membership':
        return <MembershipSystem language={language} />;
      case 'contributions':
        return <MonthlyContributions language={language} />;
      case 'meetings':
        return <MeetingsManager language={language} />;
      case 'noticeboard':
        return <NoticeBoard language={language} />;
      case 'social':
        return <SocialServices language={language} />;
      case 'suggestions':
        return <Suggestions language={language} />;
      case 'gallery':
        return <Gallery language={language} />;
      case 'admin':
        return <AdminPanel language={language} />;
      default:
        return renderHomeDashboard();
    }
  };

  const renderHomeDashboard = () => (
    <div className="space-y-6 p-4 max-w-lg mx-auto pb-24" id="home-dashboard-container">
      {/* Club Logo Heading Card */}
      <div className="bg-gradient-to-br from-[#0057B8] to-[#00AEEF] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden" id="home-hero-card">
        <div className="absolute right-0 bottom-0 w-36 h-36 bg-white/10 rounded-full filter blur-xl translate-x-12 translate-y-12" />
        <div className="flex flex-col items-center text-center space-y-4" id="home-hero-header">
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.9, rotate: -2 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 bg-white rounded-full p-1 shadow-md overflow-hidden relative border-4 border-white/20"
            id="home-logo-box"
          >
            <img src="/src/assets/images/club_logo_1781939745902.jpg" alt="Club Logo" className="w-[100%] h-[100%] object-cover" />
          </motion.div>
          
          <div className="space-y-1" id="home-titles-wrapper">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {t.appName}
            </h1>
            <p className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
              "{t.tagline}"
            </p>
          </div>

          <div className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-white" id="motto-box">
            {t.motto}
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="space-y-3" id="quick-access-box">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          {language === 'ne' ? 'छिटो पहुँच (Quick Access)' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 gap-3" id="quick-access-grid">
          <button 
            onClick={() => setActiveTab('membership')} 
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl hover:shadow hover:border-blue-500/50 transition border border-slate-100 dark:border-slate-700 text-left flex flex-col justify-between h-28 cursor-pointer"
            id="quick-action-register"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl w-fit" id="qa-reg-icon">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs text-slate-800 dark:text-neutral-200 block font-bold leading-normal">{t.registerNow}</strong>
              <span className="text-[9px] text-slate-400 mt-0.5 block">Digital Card system</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('contributions')} 
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl hover:shadow hover:border-blue-500/50 transition border border-slate-100 dark:border-slate-700 text-left flex flex-col justify-between h-28 cursor-pointer"
            id="quick-action-contribute"
          >
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl w-fit" id="qa-con-icon">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs text-slate-800 dark:text-neutral-200 block font-bold leading-normal">{language === 'ne' ? 'सहयोग बक्यौता विवरण' : 'Contribution Records'}</strong>
              <span className="text-[9px] text-slate-400 mt-0.5 block">10 Riyal Monthly dues</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('social')} 
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl hover:shadow hover:border-blue-500/50 transition border border-slate-100 dark:border-slate-700 text-left flex flex-col justify-between h-28 cursor-pointer"
            id="quick-action-social"
          >
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl w-fit" id="qa-soc-icon">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs text-slate-800 dark:text-neutral-200 block font-bold leading-normal">{t.socialService}</strong>
              <span className="text-[9px] text-slate-400 mt-0.5 block">Temple / Emergency Help</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('suggestions')} 
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl hover:shadow hover:border-blue-500/50 transition border border-slate-100 dark:border-slate-700 text-left flex flex-col justify-between h-28 cursor-pointer"
            id="quick-action-suggest"
          >
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl w-fit" id="qa-sug-icon">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs text-slate-800 dark:text-neutral-200 block font-bold leading-normal">{t.suggestions}</strong>
              <span className="text-[9px] text-slate-400 mt-0.5 block">Submit feedbacks</span>
            </div>
          </button>
        </div>
      </div>

      {/* Live Notice Board Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4" id="home-notices-widget">
        <div className="flex justify-between items-center" id="notices-widget-title">
          <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
            {t.recentNotices}
          </h4>
          <button 
            onClick={() => setActiveTab('noticeboard')} 
            className="text-xs text-blue-600 font-bold hover:underline"
            id="notices-see-all-btn"
          >
            {language === 'ne' ? 'सबै हेर्नुहोस् »' : 'See All »'}
          </button>
        </div>

        {recentNotices.length > 0 ? (
          <div className="space-y-3" id="notices-widget-list">
            {recentNotices.map((not) => (
              <div 
                key={not.id}
                onClick={() => setActiveTab('noticeboard')}
                className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                id={`notice-widget-row-${not.id}`}
              >
                <div className="flex justify-between text-[9px] text-slate-450" id={`not-widget-top-${not.id}`}>
                  <span className="uppercase text-rose-600 font-black tracking-wider">{not.category}</span>
                  <span className="font-mono">{not.date}</span>
                </div>
                <strong className="text-xs text-slate-800 dark:text-white block mt-1 line-clamp-1 font-bold">{not.title}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-semibold" id="no-recent-notices-msg">
            {language === 'ne' ? 'हाल कुनै पनि नयाँ सूचना टासिएको छैन।' : 'No news alerts posted yet.'}
          </p>
        )}
      </div>

      {/* Assembly Schedule Widget */}
      {upcomingMeetings.length > 0 && (
        <div 
          onClick={() => setActiveTab('meetings')}
          className="bg-amber-500/5 border-2 border-amber-500/20 dark:border-amber-500/10 rounded-3xl p-5 shadow-inner-md cursor-pointer hover:bg-amber-500/10 transition-all"
          id="home-meetings-widget"
        >
          <div className="flex items-center gap-2 text-amber-600" id="meetings-widget-header">
            <Calendar className="w-5 h-5" />
            <h4 className="text-xs font-black uppercase tracking-widest">{language === 'ne' ? 'आगामी शुक्रबार बैठक सूचना' : 'Upcoming Assembly Schedule'}</h4>
          </div>
          <strong className="text-sm text-slate-950 dark:text-amber-100 block mt-2.5 font-bold leading-none">{upcomingMeetings[0].title}</strong>
          <div className="flex gap-4 mt-3 text-xs text-slate-600 dark:text-slate-350" id="meetings-widget-meta">
            <span>📅 {upcomingMeetings[0].date}</span>
            <span>📍 {upcomingMeetings[0].venue}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col" id="master-container">
      <AnimatePresence>
        {isSplashActive ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-[#0057B8] to-[#00AEEF] flex flex-col justify-between p-6 text-white text-center"
            id="welcome-splash-screen"
          >
            {/* Language Top toggle */}
            <div className="flex justify-end pt-2" id="splash-lang-box">
              <button
                onClick={() => setLanguage(language === 'ne' ? 'en' : 'ne')}
                className="flex items-center gap-1 text-xs font-bold text-white/95 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 active:scale-95 transition cursor-pointer"
                id="splash-lang-btn"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'ne' ? 'English' : 'नेपाली'}
              </button>
            </div>

            {/* Middle Welcome Visuals */}
            <div className="flex flex-col items-center space-y-6 max-w-sm mx-auto my-auto" id="splash-middle">
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-36 h-36 bg-white rounded-full p-1 border-4 border-white/25 shadow-2xl relative overflow-hidden"
                id="splash-logo-box"
              >
                <img src="/src/assets/images/club_logo_1781939745902.jpg" alt="Club Emblem" className="w-[100%] h-[100%] object-cover" />
              </motion.div>

              <div className="space-y-2" id="splash-intro-text">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight break-keep" id="splash-appname">
                  श्री महावीर युवा क्लब, चौरिया
                </h1>
                <p className="text-sm font-extrabold uppercase tracking-widest text-amber-300" id="splash-tagline">
                  "युवा एकता समाज"
                </p>
              </div>

              <p className="text-xs text-white/90 leading-relaxed italic" id="splash-motto">
                "सेवा, एकता र अनुशासन हाम्रो पहिचान"
              </p>
            </div>

            {/* Bottom button */}
            <div className="max-w-xs mx-auto w-full pb-8" id="splash-bottom">
              <button
                onClick={() => setIsSplashActive(false)}
                className="w-full py-4 bg-white text-blue-700 font-black rounded-2xl shadow-xl hover:shadow-white/10 active:scale-95 transition-all text-sm tracking-wider cursor-pointer uppercase flex items-center justify-center gap-2"
                id="splash-enter-btn"
              >
                Let's Enter App / प्रवेश गर्नुहोस्
              </button>
              <span className="text-[10px] text-white/70 block mt-4 tracking-widest">
                ESTD. 2079 बी.सं.
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950" id="main-navigation-frame">
            {/* Desktop simulation header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800" id="master-header">
              <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between" id="header-container">
                <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer" id="header-brand">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 bg-white p-0.5 shadow-sm">
                    <img src="/src/assets/images/club_logo_1781939745902.jpg" alt="Logo" className="w-[100%] h-[100%] object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900 dark:text-white leading-none tracking-wide">
                      {language === 'ne' ? 'महावीर युवा क्लब' : 'Mahavir Yuva Club'}
                    </h2>
                    <span className="text-[8px] text-slate-400 font-bold tracking-widest block mt-0.5 uppercase">"युवा एकता समाज"</span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3" id="header-controls">
                  <button
                    onClick={() => setLanguage(language === 'ne' ? 'en' : 'ne')}
                    className="p-2 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                    id="lang-toggle-btn"
                    title={language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                    id="theme-toggle-btn"
                    title="Toggle Dark Mode"
                  >
                    {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </header>

            {/* Active Content rendering area */}
            <main className="flex-1 overflow-y-auto" id="master-content-pane">
              {renderTabContent()}
            </main>

            {/* High-fidelity iOS/Android Simulated Tab Bar Navigation */}
            <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800" id="bottom-tab-bar">
              <div className="max-w-lg mx-auto px-1 py-1.5 flex items-center justify-around" id="tab-bar-container">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition cursor-pointer ${
                    activeTab === 'home' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                  id="tab-btn-home"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span className="text-[9px] mt-1 tracking-wide">{language === 'ne' ? 'होम' : 'Home'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition cursor-pointer ${
                    activeTab === 'about' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                  id="tab-btn-about"
                >
                  <Info className="w-5 h-5" />
                  <span className="text-[9px] mt-1 tracking-wide">{language === 'ne' ? 'कमिटी' : 'About'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('noticeboard')}
                  className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition relative cursor-pointer ${
                    activeTab === 'noticeboard' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                  id="tab-btn-noticeboard"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-[9px] mt-1 tracking-wide">{language === 'ne' ? 'सूचना' : 'Notices'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition cursor-pointer ${
                    activeTab === 'gallery' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                  id="tab-btn-gallery"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] mt-1 tracking-wide">{language === 'ne' ? 'ग्यालरी' : 'Gallery'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition cursor-pointer ${
                    activeTab === 'admin' ? 'text-red-650 font-bold bg-red-50/50 dark:bg-red-950/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                  id="tab-btn-admin"
                >
                  <LogIn className="w-5 h-5 text-red-500" />
                  <span className="text-[9px] mt-1 tracking-wide text-red-500">{language === 'ne' ? 'प्रशासक' : 'Admin'}</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
