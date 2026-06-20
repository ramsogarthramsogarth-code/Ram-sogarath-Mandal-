import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { Member } from '../types';
import { User, Wallet, Phone, Globe, Calendar, Briefcase, PlusCircle, CreditCard, Search, Check, AlertTriangle, FileText, Upload } from 'lucide-react';

interface MembershipSystemProps {
  language: Language;
}

export function MembershipSystem({ language }: MembershipSystemProps) {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'register' | 'status'>('register');
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    dob: '',
    gender: 'Male',
    address: '',
    mobileNumber: '',
    email: '',
    country: 'Nepal',
    passportNumber: '',
    occupation: '',
    bloodGroup: 'A+',
    joinDate: new Date().toISOString().split('T')[0],
  });

  const [photoFile, setPhotoFile] = useState<string>('');
  const [citizenshipFile, setCitizenshipFile] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search State
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResult, setSearchResult] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);

  // Convert File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'citizenship') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'photo') {
        setPhotoFile(base64String);
      } else {
        setCitizenshipFile(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.address) {
      setMessage({ type: 'error', text: language === 'ne' ? 'कृपया आवश्यक विवरणहरू भर्नुहोस्!' : 'Please fill all required fields!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Create new member doc in firestore
      const memberData = {
        fullName: formData.fullName,
        fatherName: formData.fatherName,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        country: formData.country,
        passportNumber: formData.passportNumber || '',
        occupation: formData.occupation,
        photoUrl: photoFile || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150', // placeholder
        citizenshipUrl: citizenshipFile || '',
        bloodGroup: formData.bloodGroup,
        joinDate: formData.joinDate,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'members'), memberData);
      
      setMessage({
        type: 'success',
        text: language === 'ne' 
          ? 'सदस्यता फारम सफलतापूर्वक पेस गरियो! कृपया समितिको स्वीकृतिको लागि प्रतीक्षा गर्नुहोस्।' 
          : 'Membership request submitted successfully! Pending committee approval.'
      });

      // Clear Form
      setFormData({
        fullName: '',
        fatherName: '',
        dob: '',
        gender: 'Male',
        address: '',
        mobileNumber: '',
        email: '',
        country: 'Nepal',
        passportNumber: '',
        occupation: '',
        bloodGroup: 'A+',
        joinDate: new Date().toISOString().split('T')[0],
      });
      setPhotoFile('');
      setCitizenshipFile('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: language === 'ne' ? 'त्रुटि भयो। कृपया पुन: प्रयास गर्नुहोस्।' : 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMobile) return;

    setSearching(true);
    setSearchResult(null);
    setMessage(null);

    try {
      const q = query(collection(db, 'members'), where('mobileNumber', '==', searchMobile));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setMessage({
          type: 'error',
          text: language === 'ne' ? 'यो मोबाइल नम्बर भएको कुनै सदस्य भेटिएन।' : 'No member found with this mobile number.'
        });
      } else {
        const docData = snapshot.docs[0].data() as Omit<Member, 'id'>;
        const memberId = snapshot.docs[0].id;
        setSearchResult({ id: memberId, ...docData });
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: language === 'ne' ? 'विवरण खोज्न समस्या भयो।' : 'Unable to search for membership detail.'
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="membership-system-container">
      {/* Sub tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 mb-6" id="membership-subtabs">
        <button
          onClick={() => { setActiveTab('register'); setMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'register' 
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-register-btn"
        >
          <PlusCircle className="w-4 h-4" />
          {t.registerNow}
        </button>
        <button
          onClick={() => { setActiveTab('status'); setMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'status' 
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-status-btn"
        >
          <CreditCard className="w-4 h-4" />
          {t.myCard}
        </button>
      </div>

      {message && (
        <div 
          className={`mb-4 p-4 rounded-2xl flex items-start gap-2 text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-800'
          }`}
          id="membership-alert-msg"
        >
          {message.type === 'success' ? <Check className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          <p>{message.text}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'register' ? (
          <motion.div
            key="register-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
            id="register-card"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2" id="register-header-title">
              <PlusCircle className="text-blue-500 w-5 h-5" />
              {language === 'ne' ? 'नयाँ दर्ता फारम' : 'New Registration Form'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" id="registration-form">
              {/* Full Name */}
              <div id="field-fullname">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {t.fullName} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder={language === 'ne' ? 'राम प्रसाद थारु' : 'Ram Prasad Tharu'}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Father Name */}
              <div id="field-fathername">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {t.fatherName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder={language === 'ne' ? 'बुवाको नाम' : "Father's Name"}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Grid 1: DOB & Gender */}
              <div className="grid grid-cols-2 gap-3" id="field-dob-gender">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.dob}
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.gender}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  >
                    <option value="Male">{language === 'ne' ? 'पुरुष' : 'Male'}</option>
                    <option value="Female">{language === 'ne' ? 'महिला' : 'Female'}</option>
                    <option value="Other">{language === 'ne' ? 'अन्य' : 'Other'}</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div id="field-address">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {t.address} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={language === 'ne' ? 'चौरिया, जनकपुर, नेपाल' : 'Chauriya, Janakpur, Nepal'}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-2 gap-3" id="field-contact">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.mobileNumber} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="98XXXXXXXX"
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Country & Passport */}
              <div className="grid grid-cols-2 gap-3" id="field-country-passport">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.country}
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder={language === 'ne' ? 'नेपाल / साउदी / कतार' : 'Nepal / Qatar / Saudi'}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.passportNumber}
                  </label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Occupation & Blood Group */}
              <div className="grid grid-cols-2 gap-3" id="field-job-blood">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.occupation}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder={language === 'ne' ? 'व्यवसाय / विद्यार्थी' : 'Business / Student'}
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.bloodGroup}
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-100 border border-slate-100 dark:border-slate-950 rounded-2xl text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-3" id="fields-files">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    {t.photoUpload} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photo')}
                      className="hidden"
                      id="photo-file-input"
                    />
                    <label
                      htmlFor="photo-file-input"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all font-semibold"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      {language === 'ne' ? 'फोटो छान्नुहोस्' : 'Select Photo'}
                    </label>
                    {photoFile ? (
                      <img src={photoFile} alt="uploaded" className="w-10 h-10 object-cover rounded-xl shadow-inner-md border border-slate-200" />
                    ) : (
                      <span className="text-[10px] text-slate-400">{language === 'ne' ? 'फोटो अपलोड गरिएको छैन' : 'No file chosen'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    {t.citizenshipUpload} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'citizenship')}
                      className="hidden"
                      id="citizenship-file-input"
                    />
                    <label
                      htmlFor="citizenship-file-input"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all font-semibold"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      {language === 'ne' ? 'कागजात छान्नुहोस्' : 'Select Document'}
                    </label>
                    {citizenshipFile ? (
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900 text-[10px] text-emerald-800 dark:text-emerald-300">
                        <Check className="w-3 h-3" />
                        Uploaded
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">{language === 'ne' ? 'ID अपलोड गरिएको छैन' : 'No ID uploaded'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                id="submit-register-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  t.submit
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="status-check"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="status-form-section"
          >
            {/* Search Box */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700" id="search-card">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4" id="search-title">
                {language === 'ne' ? 'नम्बर हालेर डिजिटल कार्ड हेर्नुहोस्' : 'Enter Mobile to view Digital Card'}
              </h3>
              <form onSubmit={handleSearchCard} className="flex gap-2" id="search-form">
                <input
                  type="tel"
                  placeholder="e.g. 98XXXXXXXX"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-2xl cursor-pointer flex items-center gap-1 active:scale-95 transition-all text-sm"
                  id="search-submit-btn"
                >
                  <Search className="w-4 h-4" />
                  {language === 'ne' ? 'खोज्नुहोस्' : 'Search'}
                </button>
              </form>
            </div>

            {/* Verification Result Card */}
            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                id="search-result-container"
              >
                {/* Status Indicator */}
                <div 
                  className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${
                    searchResult.status === 'approved' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
                      : searchResult.status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                  }`}
                  id="status-indicator-box"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {language === 'ne' ? `सदस्यता स्थिति: ` : 'Membership Status: '}
                    </span>
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {searchResult.status === 'approved' && (language === 'ne' ? 'स्वीकृत (Active)' : 'Approved')}
                    {searchResult.status === 'pending' && (language === 'ne' ? 'प्रतीक्षारत (Pending)' : 'Pending')}
                    {searchResult.status === 'suspended' && (language === 'ne' ? 'निलम्बित (Suspended)' : 'Suspended')}
                  </span>
                </div>

                {/* Digital Card (Only shown if approved!) */}
                {searchResult.status === 'approved' ? (
                  <div 
                    className="relative overflow-hidden bg-gradient-to-br from-[#0057B8] to-[#00AEEF] text-white rounded-3xl p-6 shadow-2xl border-4 border-white/10"
                    id="digital-membership-card"
                  >
                    {/* Watermark/Background designs */}
                    <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full filter blur-xl translate-x-20 translate-y-20 pointer-events-none" />
                    <div className="absolute left-0 top-0 w-24 h-24 bg-white/5 rounded-full filter blur-md -translate-x-10 -translate-y-10 pointer-events-none" />

                    {/* Logo & Header */}
                    <div className="flex items-start justify-between border-b border-white/20 pb-4 mb-4" id="card-header">
                      <div className="flex items-center gap-2">
                        {/* Club Symbol */}
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                          <img src="/src/assets/images/club_logo_1781939745902.jpg" alt="Club Logo" className="w-[100%] h-[100%] object-cover" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold tracking-wider leading-none">
                            श्री महावीर युवा क्लब, चौरिया
                          </h4>
                          <span className="text-[8px] opacity-90 block mt-[1px]">
                            SHRI MAHAVIR YUVA CLUB CHAURIYA
                          </span>
                          <span className="text-[9px] bg-white/20 px-1.5 py-[1px] rounded-full font-bold mt-1 inline-block uppercase tracking-wider text-[7px]" style={{ fontSize: '7px' }}>
                            "युवा एकता समाज"
                          </span>
                        </div>
                      </div>
                      <div className="text-right" id="card-card-type-box">
                        <span className="inline-block text-[9px] font-black uppercase bg-amber-500 px-3 py-1 rounded-full text-slate-950 shadow-inner">
                          {language === 'ne' ? 'सदस्यता कार्ड' : 'MEMBER'}
                        </span>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="grid grid-cols-12 gap-3 items-center" id="card-body">
                      {/* Photo */}
                      <div className="col-span-4" id="card-photo-col">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl border-2 border-white overflow-hidden shadow-md">
                          <img 
                            src={searchResult.photoUrl} 
                            alt={searchResult.fullName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Detail */}
                      <div className="col-span-5 text-[11px] space-y-1.5" id="card-details-col">
                        <div id="card-det-name">
                          <span className="opacity-75 block text-[8px] uppercase tracking-wider">{t.fullName}</span>
                          <strong className="text-sm tracking-wide block leading-tight">{searchResult.fullName}</strong>
                        </div>
                        <div id="card-det-id">
                          <span className="opacity-75 block text-[8px] uppercase tracking-wider">MEMBER ID</span>
                          <strong className="font-mono text-[10px] bg-slate-950/20 px-2 py-0.5 rounded inline-block">
                            {searchResult.membershipId || `SMYC-79-${searchResult.id.slice(0, 5).toUpperCase()}`}
                          </strong>
                        </div>
                        <div className="flex gap-3" id="card-det-country">
                          <div>
                            <span className="opacity-75 block text-[8px] uppercase tracking-wider">{t.country}</span>
                            <span className="font-bold">{searchResult.country}</span>
                          </div>
                          <div>
                            <span className="opacity-75 block text-[8px] uppercase tracking-wider">{t.bloodGroup}</span>
                            <span className="font-bold text-red-100">{searchResult.bloodGroup}</span>
                          </div>
                        </div>
                      </div>

                      {/* QR & Join Date */}
                      <div className="col-span-3 flex flex-col items-center justify-center text-center" id="card-qr-col">
                        <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg flex items-center justify-center">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              `Shri Mahavir Yuva Club - ID: ${searchResult.membershipId || searchResult.id}, Name: ${searchResult.fullName}, Status: Approved`
                            )}`} 
                            alt="QR Code" 
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-[8px] opacity-75 mt-1 block">
                          Join: {searchResult.joinDate || '2079'}
                        </span>
                      </div>
                    </div>

                    {/* Footer tagline */}
                    <div className="border-t border-white/20 mt-4 pt-2 text-center text-[8px] opacity-85 tracking-widest font-semibold" id="card-footer">
                      सम्पर्क: २९°२४'N, ८६°५०'E • चौरिया, नेपाल
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700" id="membership-pending-box">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-center py-4">
                      {language === 'ne' 
                        ? 'तपाईंको सदस्यता स्वीकृत भएपछि यहाँ डिजिटल सदस्यता कार्ड प्रकाशित गरिनेछ। थप जानकारीका लागि चौरिया समिति शाखामा सम्पर्क गर्नुहोस्।'
                        : 'Your digital membership card will be generated here once approved. Please contact the Chauriya Committee for inquiries.'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
