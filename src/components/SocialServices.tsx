import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { SocialService } from '../types';
import { Heart, Activity, Church, Sparkles, Smile, ShieldAlert, Plus, Upload, CheckCircle, Image, Video } from 'lucide-react';

interface SocialServiceProps {
  language: Language;
}

export function SocialServices({ language }: SocialServiceProps) {
  const t = translations[language];

  const [activities, setActivities] = useState<SocialService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'financial_support' | 'emergency_assistance' | 'temple_service' | 'community_service' | 'awareness'>('all');

  // Multi form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState<'financial_support' | 'emergency_assistance' | 'temple_service' | 'community_service' | 'awareness'>('community_service');
  const [formImage, setFormImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'social_services'), (snapshot) => {
      const list: SocialService[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SocialService);
      });
      // Newest first
      list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc) return;

    setIsSubmitting(true);
    try {
      const newService: Omit<SocialService, 'id'> = {
        title: formTitle,
        description: formDesc,
        category: formCat,
        date: new Date().toISOString().split('T')[0],
        imageUrl: formImage || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&h=400'
      };

      await addDoc(collection(db, 'social_services'), newService);

      setFormTitle('');
      setFormDesc('');
      setFormImage('');
      setShowAddModal(false);
      alert(language === 'ne' ? 'नयाँ सामाजिक कार्य विवरण दर्ता भयो!' : 'Social service activity published successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to publish.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCatDetails = (cat: string) => {
    switch (cat) {
      case 'financial_support':
        return { label: language === 'ne' ? 'वित्तीय सहयोग' : 'Financial Support', icon: <Heart className="w-4 h-4 text-emerald-500" /> };
      case 'emergency_assistance':
        return { label: language === 'ne' ? 'आपतकालीन सहयोग' : 'Emergency Assistance', icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> };
      case 'temple_service':
        return { label: language === 'ne' ? 'धार्मिक तथा सांस्कृतिक सेवा' : 'Temple & Cultural Service', icon: <Church className="w-4 h-4 text-amber-500" /> };
      case 'community_service':
        return { label: language === 'ne' ? 'सामुदायिक विकास' : 'Community Service', icon: <Activity className="w-4 h-4 text-sky-500" /> };
      default: // awareness
        return { label: language === 'ne' ? 'युवा जनचेतना कार्यक्रम' : 'Youth Awareness Program', icon: <Sparkles className="w-4 h-4 text-indigo-500" /> };
    }
  };

  const filteredActivities = activities.filter(
    (act) => activeFilter === 'all' || act.category === activeFilter
  );

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="social-services-container">
      {/* Overview stats or introduction */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 rounded-3xl p-6 text-white mb-6 font-bold flex justify-between items-center shadow-lg shadow-blue-500/10" id="social-hero">
        <div id="social-hero-left">
          <h3 className="text-lg text-white" id="social-hero-title">{t.socialService}</h3>
          <p className="text-xs opacity-90 mt-1 font-semibold leading-relaxed">
            {language === 'ne' ? 'हाम्रो चौरिया गाउँ र समाज सेवाको गौरवशाली इतिहास' : 'Our proud contribution to Chauriya and immediate community service'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-3 bg-white/20 text-white rounded-full active:scale-95 transition cursor-pointer"
          id="add-social-activity-btn"
          title="Publish Activity"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Categories Filter scroller */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-6 scrollbar-hide" id="social-category-scroller">
        {(['all', 'financial_support', 'emergency_assistance', 'temple_service', 'community_service', 'awareness'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            id={`social-cat-pill-${cat}`}
          >
            {cat === 'all' ? (language === 'ne' ? 'सबै सेवा' : 'All') : getCatDetails(cat).label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24" id="social-loading">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6" id="social-activity-timeline">
          {filteredActivities.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-md border border-slate-100 dark:border-slate-700 text-center" id="social-activity-empty">
              <Smile className="w-12 h-12 text-slate-350 mx-auto mb-4" />
              <p className="text-slate-700 dark:text-slate-350 font-semibold">{language === 'ne' ? 'यो श्रेणीमा कुनै सामाजिक कार्यहरू रेकर्ड गरिएको छैन।' : 'No verified activities recorded in this category.'}</p>
            </div>
          ) : (
            filteredActivities.map((act) => {
              const details = getCatDetails(act.category);
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700"
                  id={`activity-card-${act.id}`}
                >
                  {/* Photo cover */}
                  {act.imageUrl && (
                    <div className="w-full h-48 overflow-hidden relative shadow-inner-md" id={`activity-img-box-${act.id}`}>
                      <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-md text-white font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider" id={`activity-badge-${act.id}`}>
                        {details.icon}
                        {details.label}
                      </div>
                    </div>
                  )}

                  <div className="p-5" id={`activity-body-${act.id}`}>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1 font-mono">{act.date}</span>
                    <h4 className="text-md font-bold text-slate-950 dark:text-white leading-tight">
                      {act.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-350 mt-3.5 leading-relaxed font-semibold">
                      {act.description}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Add New Project Publication Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-end justify-center sm:items-center p-4"
            id="social-modal-overlay"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-950 dark:text-white"
              id="social-modal-content"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4" id="social-modal-header">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <Image className="text-blue-500 w-5 h-5" />
                  {language === 'ne' ? 'सामाजिक कार्य पोष्ट गर्नुहोस्' : 'Post Social Service Record'}
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-800 text-sm font-bold bg-slate-100 dark:bg-slate-900 p-2 rounded-full cursor-pointer"
                  id="social-modal-close-btn"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" id="social-modal-form">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {language === 'ne' ? 'शीर्षक' : 'Activity Title'}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={language === 'ne' ? 'e.g. धर्मशाला मर्मत सम्भार' : 'e.g. Financial support to school'}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {language === 'ne' ? 'विवरण' : 'Description'}
                  </label>
                  <textarea
                    rows={4}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder={language === 'ne' ? 'विस्तृत जानकारी...' : 'Describe the work done...'}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {language === 'ne' ? 'श्रेणी (Category)' : 'Service Category'}
                  </label>
                  <select
                    value={formCat}
                    onChange={(e: any) => setFormCat(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-100 border border-slate-150 rounded-2xl text-sm text-slate-950 focus:outline-none"
                  >
                    <option value="financial_support">{language === 'ne' ? 'वित्तीय सहयोग (Financial Support)' : 'Financial Support'}</option>
                    <option value="emergency_assistance">{language === 'ne' ? 'आपतकालीन सहयोग (Emergency Assistance)' : 'Emergency Assistance'}</option>
                    <option value="temple_service">{language === 'ne' ? 'धार्मिक तथा सांस्कृतिक सेवा (Temple Service)' : 'Temple Service'}</option>
                    <option value="community_service">{language === 'ne' ? 'सामुदायिक सेवा (Community Service)' : 'Community Service'}</option>
                    <option value="awareness">{language === 'ne' ? 'जनचेतना कार्यक्रम (Youth Awareness)' : 'Youth Awareness Program'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                    {language === 'ne' ? 'तस्बिर अपलोड गर्नुहोस्' : 'Upload Cover Photo'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="social-form-image-input"
                    />
                    <label
                      htmlFor="social-form-image-input"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-250 font-bold transition"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      {language === 'ne' ? 'फोटो छान्नुहोस्' : 'Browse'}
                    </label>
                    {formImage ? (
                      <div className="relative">
                        <img src={formImage} alt="uploaded preview" className="w-12 h-12 object-cover rounded-xl shadow border border-slate-200" />
                        <button type="button" onClick={() => setFormImage('')} className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">✕</button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-450">{language === 'ne' ? 'छानिएको छैन' : 'No file loaded'}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/10 active:scale-95 transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                  id="social-form-submit-btn"
                >
                  {isSubmitting ? '...' : t.submit}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
