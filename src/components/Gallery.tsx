import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { GalleryItem } from '../types';
import { Image, Video, Film, Eye, Fullscreen, Plus, Upload, Smile, Camera } from 'lucide-react';

interface GalleryProps {
  language: Language;
}

export function Gallery({ language }: GalleryProps) {
  const t = translations[language];

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Photos' | 'Videos' | 'Events'>('all');
  const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);

  // Upload/Add state
  const [showAdd, setShowAdd] = useState(false);
  const [uploadImg, setUploadImg] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAlbum, setFormAlbum] = useState<'Photos' | 'Videos' | 'Events'>('Photos');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Sync gallery items real-time
    const unsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const gList: GalleryItem[] = [];
      snapshot.forEach((doc) => {
        gList.push({ id: doc.id, ...doc.data() } as GalleryItem);
      });
      // Try to load initial mock files if Firestore is completely empty inside this container database!
      if (snapshot.empty && gList.length === 0) {
        // We will seed these automatically in Firebase initialization or in the UI, but seeding them locally in state as fallback is robust!
      }
      setItems(gList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadImg(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImg || !formDesc) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        imageUrl: uploadImg,
        description: formDesc,
        albumName: formAlbum,
        date: new Date().toISOString().split('T')[0]
      });

      setUploadImg('');
      setFormDesc('');
      setShowAdd(false);
      alert(language === 'ne' ? 'नयाँ मिडिया ग्यालरीमा थपियो!' : 'New media successfully loaded to Gallery!');
    } catch (err) {
      console.error(err);
      alert('Fail to add medial.');
    } finally {
      setSubmitting(false);
    }
  };

  const localSeedItems: GalleryItem[] = [
    {
      id: 'mock-1',
      imageUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=600&h=400',
      description: language === 'ne' ? 'नवनियुक्त चौरिया कार्य समिति वि.सं. २०८०' : 'Newly inducted executive board members for SMYC B.S. 2080',
      date: '2026-05-10',
      albumName: 'Events'
    },
    {
      id: 'mock-2',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&h=400',
      description: language === 'ne' ? 'स्थानीय चौरिया प्राथमिक विद्यालयका बालबालिकाहरूलाई शैक्षिक सामग्री वितरण' : 'Distributing free reference book kits & uniforms in Chauriya village primary school',
      date: '2026-06-01',
      albumName: 'Photos'
    },
    {
      id: 'mock-3',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&h=400',
      description: language === 'ne' ? 'दहेजमुक्त समाज निर्माण जनचेतना नाटक' : 'Interactive street act campaigning against dowry custom',
      date: '2026-04-15',
      albumName: 'Events'
    }
  ];

  // Merge loaded + fallback seeded
  const renderedItems = [...items, ...(items.length === 0 ? localSeedItems : [])];
  const filteredItems = renderedItems.filter(
    (item) => filter === 'all' || item.albumName === filter
  );

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="gallery-container">
      {/* Title Header with add button */}
      <div className="flex justify-between items-center mb-6" id="gallery-header">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2" id="gallery-header-title">
          <Camera className="text-blue-600 w-5 h-5" />
          {t.gallery}
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-100 transition duration-150 ml-auto cursor-pointer"
          id="gallery-add-panel-btn"
        >
          <Plus className="w-4 h-4" />
          {language === 'ne' ? 'मिडिया थप्नुहोस्' : 'Add Media'}
        </button>
      </div>

      {/* Album Filters */}
      <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 mb-6" id="gallery-pills">
        {(['all', 'Photos', 'Videos', 'Events'] as const).map((alb) => (
          <button
            key={alb}
            onClick={() => setFilter(alb)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
              filter === alb
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            id={`gallery-pill-${alb}`}
          >
            {alb === 'all' ? (language === 'ne' ? 'सबै' : 'All') : alb}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20" id="gallery-loading">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3" id="gallery-grid">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setViewingItem(item)}
              className="group relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer"
              id={`gallery-item-${item.id}`}
            >
              <img src={item.imageUrl} alt="gallery" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end text-white opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200" id={`gallery-overlay-${item.id}`}>
                <span className="text-[8px] bg-blue-600 px-2 py-0.5 rounded-full inline-block w-fit mb-1 font-bold uppercase tracking-wider">{item.albumName}</span>
                <p className="text-[10px] leading-tight line-clamp-2 font-semibold">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {viewingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingItem(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-4 cursor-zoom-out"
            id="lightbox-overlay"
          >
            <div className="max-w-md w-full relative" id="lightbox-card" onClick={(e) => e.stopPropagation()}>
              <div className="absolute right-4 top-4 bg-black/60 backdrop-blur-md p-2 rounded-full cursor-pointer border border-white/20 text-white font-bold inline-block" onClick={() => setViewingItem(null)}>
                ✕
              </div>
              <img src={viewingItem.imageUrl} alt="lightbox description" className="w-full aspect-auto max-h-[70vh] rounded-3xl object-contain bg-black shadow-2xl border-4 border-white/5" />
              <div className="text-white mt-4 bg-slate-900/60 backdrop-blur-lg p-5 rounded-2xl border border-white/10" id="lightbox-meta">
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-950/40 px-2.5 py-1 rounded inline-block">{viewingItem.albumName}</span>
                <p className="text-sm font-semibold mt-2 leading-relaxed">{viewingItem.description}</p>
                <span className="text-[10px] text-slate-400 block mt-2 font-mono">Date Published: {viewingItem.date}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Media Dialog */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-end justify-center sm:items-center p-4"
            id="gallery-add-overlay"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white"
              id="gallery-add-form"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4" id="gallery-form-header">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <Image className="text-blue-500 w-5 h-5" />
                  {language === 'ne' ? 'मिडिया एल्बम थप्नुहोस्' : 'Publish Media Item'}
                </h3>
                <button 
                  onClick={() => setShowAdd(false)}
                  className="text-slate-400 hover:text-slate-800 text-sm font-bold bg-slate-100 dark:bg-slate-900 p-2 rounded-full cursor-pointer"
                  id="gallery-form-close-btn"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4" id="gallery-form-elem">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {language === 'ne' ? 'एल्बम चयन गर्नुहोस्' : 'Select Album'}
                  </label>
                  <select
                    value={formAlbum}
                    onChange={(e: any) => setFormAlbum(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  >
                    <option value="Photos">Photos</option>
                    <option value="Videos">Videos</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {language === 'ne' ? 'क्याप्सन (विवरण)' : 'Captions / Descriptions'}
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder={language === 'ne' ? 'e.g. धर्मशाला मर्मत सम्भार कार्यक्रम' : 'e.g. Village temple renovation work'}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                    {language === 'ne' ? 'मिडिया फाईल' : 'Upload Image'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageRead}
                      className="hidden"
                      id="gallery-pic-input"
                      required
                    />
                    <label
                      htmlFor="gallery-pic-input"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-750 rounded-xl cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition font-bold"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      {language === 'ne' ? 'फोटो छान्नुहोस्' : 'Browse File'}
                    </label>
                    {uploadImg ? (
                      <div className="relative">
                        <img src={uploadImg} alt="preview" className="w-12 h-12 object-cover rounded-xl shadow border border-slate-200" />
                        <button type="button" onClick={() => setUploadImg('')} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">✕</button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-450">{language === 'ne' ? 'फाईल छानिएको छैन' : 'No photo chosen'}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-2xl shadow shadow-blue-500/10 active:scale-95 transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                  id="gallery-submit-btn"
                >
                  {submitting ? '...' : t.submit}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
