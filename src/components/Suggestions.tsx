import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { MessageSquare, Send, CheckCircle2, Phone, User, AlertOctagon } from 'lucide-react';

interface SuggestionsProps {
  language: Language;
}

export function Suggestions({ language }: SuggestionsProps) {
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    type: 'suggestion' as 'suggestion' | 'complaint' | 'feedback',
    details: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.details) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        senderName: formData.name,
        senderContact: formData.contact,
        messageType: formData.type,
        details: formData.details,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });

      setSuccess(true);
      setFormData({ name: '', contact: '', type: 'suggestion', details: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to send.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="suggestions-container">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-md border border-slate-100 dark:border-slate-700 text-center space-y-4"
          id="suggestions-success-box"
        >
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {language === 'ne' ? 'सुझाव सफलतापूर्वक पठाइयो!' : 'Thank you for your voice!'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
            {language === 'ne' 
              ? 'यहाँको सल्लाह-सुझाव समितिको आगामी बैठकमा गहन छलफल गरिनेछ। समाज सुधार कार्यमा यहाँको सक्रिय सहभागिता अमूल्य छ।'
              : 'Your feedback/complaint has been successfully logged with the club executive committee. We discuss and evaluate suggestions during our monthly Friday assembly.'}
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-2xl shadow active:scale-95 transition text-sm cursor-pointer"
            id="more-feedback-btn"
          >
            {language === 'ne' ? 'थप सुझाव पठाउनुहोस्' : 'Submit another suggestion'}
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
          id="suggestions-form-card"
        >
          <div className="flex items-center gap-3 mb-6" id="suggestions-header">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600" id="suggest-icon-box">
              <MessageSquare className="w-6 h-6" id="suggest-icon" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white leading-none">
                {t.suggestions}
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">{language === 'ne' ? 'हाम्रो चौरिया गाउँलाई अझ समृद्ध र अनुशासित बनाउन सल्लाह दिनुहोस्' : 'Share suggestions to construct a Dowry-free & united Chauriya.'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="suggestions-form">
            {/* Message Type selectors */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                {language === 'ne' ? 'प्रकार चयन गर्नुहोस्' : 'What is this about?'}
              </label>
              <div className="grid grid-cols-3 gap-2" id="msg-type-pillbox">
                {(['suggestion', 'complaint', 'feedback'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type }))}
                    className={`py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      formData.type === type
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id={`type-btn-${type}`}
                  >
                    {type === 'suggestion' ? (language === 'ne' ? 'सल्लाह' : 'Suggest') : type === 'complaint' ? (language === 'ne' ? 'गुनासो' : 'Complaint') : (language === 'ne' ? 'सुझाव' : 'Feedback')}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div id="field-s-name">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {language === 'ne' ? 'तपाईंको नाम' : 'Your Name'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'ne' ? 'e.g. राम प्रसाद थारु' : 'e.g. Ram Prasad'}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Contact */}
            <div id="field-s-contact">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {language === 'ne' ? 'सम्पर्क नम्बर वा इमेल' : 'Your Mobile / Contact Info'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="e.g. 98XXXXXXXX / email"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Details */}
            <div id="field-s-details">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {language === 'ne' ? 'विवरण' : 'Details & Remarks'} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.details}
                onChange={(e) => setFormData((prev) => ({ ...prev, details: e.target.value }))}
                placeholder={language === 'ne' ? 'हाम्रो क्लबलाई अझ सुदृढ पार्ने सल्लाहहरू यहाँ लेख्नुहोस्...' : 'Write down your constructive feedback...'}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              id="suggestions-submit-btn"
            >
              <Send className="w-4 h-4" />
              {submitting ? '...' : (language === 'ne' ? 'पेस गर्नुहोस्' : 'Submit Voice')}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
