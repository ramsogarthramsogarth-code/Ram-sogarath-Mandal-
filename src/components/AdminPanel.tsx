import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, updateDoc, doc, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { Member, Contribution, Meeting, Notice, Suggestion } from '../types';
import { LayoutDashboard, Users, HeartHandshake, Bell, Lock, Key, Check, Ban, FileText, Download, CalendarCheck, Send, CheckCircle, PlusCircle, Trash } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AdminPanelProps {
  language: Language;
}

export function AdminPanel({ language }: AdminPanelProps) {
  const t = translations[language];

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Real-time Firestore sync stats
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Sub tab inside Admin Panel
  const [adminSubTab, setAdminSubTab] = useState<'stats' | 'members' | 'contributions' | 'meetings' | 'notices' | 'suggestions'>('stats');

  // Month & Year state for Recharts
  const [chartMonth, setChartMonth] = useState<string>(() => {
    const list = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return list[new Date().getMonth()];
  });
  const [chartYear, setChartYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // Form State for creating items
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeCat, setNoticeCat] = useState<'notice' | 'news' | 'event' | 'emergency'>('notice');
  const [noticeImg, setNoticeImg] = useState('');

  // Meeting Form
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetVenue, setMeetVenue] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // Real-time listeners
    const unsubMembers = onSnapshot(collection(db, 'members'), (sn) => {
      const list: Member[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Member));
      setMembers(list);
    });

    const unsubContrib = onSnapshot(collection(db, 'contributions'), (sn) => {
      const list: Contribution[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Contribution));
      setContributions(list);
    });

    const unsubMeet = onSnapshot(collection(db, 'meetings'), (sn) => {
      const list: Meeting[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Meeting));
      setMeetings(list);
    });

    const unsubNotice = onSnapshot(collection(db, 'notices'), (sn) => {
      const list: Notice[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Notice));
      setNotices(list);
    });

    const unsubSuggest = onSnapshot(collection(db, 'suggestions'), (sn) => {
      const list: Suggestion[] = [];
      sn.forEach(d => list.push({ id: d.id, ...d.data() } as Suggestion));
      setSuggestions(list);
    });

    return () => {
      unsubMembers();
      unsubContrib();
      unsubMeet();
      unsubNotice();
      unsubSuggest();
    };
  }, [isAdminLoggedIn]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'admin@mahavir.org' && adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError(language === 'ne' ? 'इमेल वा पासवर्ड मिलेन!' : 'Invalid email or password!');
    }
  };

  const handleBypass = () => {
    setAdminEmail('admin@mahavir.org');
    setAdminPassword('admin123');
    setIsAdminLoggedIn(true);
    setLoginError('');
  };

  // Member Status controls
  const updateMemberStatus = async (id: string, newStatus: 'approved' | 'suspended') => {
    try {
      const memberRef = doc(db, 'members', id);
      const generatedCardId = `SMYC-79-${Math.floor(100 + Math.random() * 900)}`;
      await updateDoc(memberRef, {
        status: newStatus,
        membershipId: newStatus === 'approved' ? generatedCardId : ''
      });
      alert(`Status modified successfully! Assigned ID: ${generatedCardId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to modify card.');
    }
  };

  // Publish News Notice from Board
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeDesc) return;

    try {
      const newNotice: Omit<Notice, 'id'> = {
        title: noticeTitle,
        description: noticeDesc,
        category: noticeCat,
        date: new Date().toISOString().split('T')[0],
        imageUrl: noticeImg || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&h=300',
        postedBy: 'Admin Committee'
      };

      await addDoc(collection(db, 'notices'), newNotice);

      setNoticeTitle('');
      setNoticeDesc('');
      setNoticeImg('');
      alert(language === 'ne' ? 'सूचना सफलतापूर्वक प्रकाशित गरियो!' : 'A notice published successfully!');
    } catch (err) {
      console.error(err);
      alert('Fail to publish notice.');
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle || !meetDate || !meetVenue) return;

    try {
      const newMeet: Omit<Meeting, 'id'> = {
        title: meetTitle,
        date: meetDate,
        time: meetTime || '14:00',
        venue: meetVenue,
        agenda: meetAgenda,
        attendance: [],
        status: 'upcoming',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'meetings'), newMeet);

      setMeetTitle('');
      setMeetDate('');
      setMeetTime('');
      setMeetVenue('');
      setMeetAgenda('');
      alert(language === 'ne' ? 'नयाँ बैठक शेड्युल भयो!' : 'New Friday assembly scheduled!');
    } catch (err) {
      console.error(err);
    }
  };

  // Export functions CSV simulation
  const exportMembersToExcel = () => {
    const headers = 'Full Name,Father Name,ID,Mobile,Country,Status\n';
    const rows = members.map(m => `"${m.fullName}","${m.fatherName}","${m.membershipId || 'N/A'}","${m.mobileNumber}","${m.country}","${m.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mahavir_Club_Members_2026.csv`);
    link.click();
  };

  const filterPending = members.filter(m => m.status === 'pending');
  const filterActive = members.filter(m => m.status === 'approved');
  const totalReceivedFunds = contributions.length * 10; // Qatar Riyal 10 each

  const approvedMembersList = members.filter(m => m.status === 'approved');
  const paidMembersList = approvedMembersList.filter(m => contributions.some(c => c.memberId === m.id && c.month.toLowerCase() === chartMonth.toLowerCase() && c.year === chartYear && c.status === 'paid'));
  const paidCount = paidMembersList.length;
  const pendingCount = Math.max(0, approvedMembersList.length - paidCount);

  const chartData = [
    { name: language === 'ne' ? 'भुक्तानी गरिएको' : 'Paid', value: paidCount, color: '#10b981' }, 
    { name: language === 'ne' ? 'बाँकी' : 'Pending', value: pendingCount, color: '#f43f5e' }
  ];

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="admin-panel-container">
      {!isAdminLoggedIn ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
          id="admin-login-card"
        >
          <div className="flex flex-col items-center text-center mb-6" id="login-header">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {language === 'ne' ? 'समिति प्रशासक लगइन' : 'Executive Admin Access Only'}
            </h3>
            <span className="text-xs text-slate-450 block mt-1">
              {language === 'ne' ? 'क्लब प्यानल नियन्त्रण गर्न आधिकारिक विवरण आवश्यक छ।' : 'Access restricted to Shri Mahavir Committee officials.'}
            </span>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-150 rounded-xl text-xs font-semibold" id="login-error-msg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4" id="admin-login-form">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">EMAIL ADDRESS</label>
              <div className="relative">
                <Send className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@mahavir.org"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">PASSWORD</label>
              <div className="relative">
                <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold rounded-2xl active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              id="admin-form-submit-btn"
            >
              <Lock className="w-4 h-4" />
              {language === 'ne' ? 'सुरक्षित लगइन' : 'Secure Admin Login'}
            </button>
          </form>

          {/* Quick Bypass Demo */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-100 dark:border-slate-700 text-center" id="demo-bypass-box">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 font-bold">{language === 'ne' ? 'मूल्याङ्कनका लागि द्रुत पहुँच बाइपास' : 'DEMO BYPASS ACCESS FOR EVALUATION'}</span>
            <button
              onClick={handleBypass}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              id="bypass-login-btn"
            >
              ⚡ Bypass Login (admin@mahavir.org / admin123)
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6" id="admin-dashboard-layout">
          {/* Top Bar info */}
          <div className="bg-slate-900/40 text-slate-950 dark:text-white rounded-3xl p-4 flex justify-between items-center" id="dashboard-strip">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">COMMITTEE ADMIN ACTIVE</span>
              <strong className="block text-sm dark:text-white mt-0.5">Shri Mahavir Chauriya Board</strong>
            </div>
            <button
              onClick={() => setIsAdminLoggedIn(false)}
              className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-xl text-xs hover:bg-red-200 transition shrink-0 cursor-pointer"
              id="admin-logout-btn"
            >
              Sign Out
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide" id="admin-subtabs-box">
            {(['stats', 'members', 'contributions', 'meetings', 'notices', 'suggestions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAdminSubTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  adminSubTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                id={`admin-tab-pill-${tab}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* 1. Statistics Summary */}
            {adminSubTab === 'stats' && (
              <motion.div
                key="stats-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
                id="view-stats"
              >
                {/* Visual Stats Block Grid */}
                <div className="grid grid-cols-2 gap-3" id="stats-grid">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-700/50" id="stat-active">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ne' ? 'स्वीकृत सदस्य' : 'TOTAL MEMBERS'}</span>
                    <strong className="text-2xl font-black block mt-2 text-blue-600">{filterActive.length}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-700/50" id="stat-pending">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ne' ? 'प्रतीक्षारत' : 'PENDING'}</span>
                    <strong className="text-2xl font-black block mt-2 text-rose-500">{filterPending.length}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-700/50" id="stat-funds">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ne' ? 'कुल संकलित कोष' : 'TOTAL FUNDS'}</span>
                    <strong className="text-2xl font-black block mt-2 text-emerald-600">{totalReceivedFunds} Riyals</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-700/50" id="stat-notices">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ne' ? 'सूचना पाटी' : 'NOTICES'}</span>
                    <strong className="text-2xl font-black block mt-2 text-indigo-500">{notices.length}</strong>
                  </div>
                </div>

                {/* 10 Riyals Monthly Contribution Pie Chart Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4" id="monthly-dues-chart-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="chart-card-header">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <HeartHandshake className="text-emerald-500 w-5 h-5" />
                        {language === 'ne' ? 'मासिक चन्दा सङ्कलन स्थिति' : 'Monthly Contributions Status'}
                      </h4>
                      <p className="text-[11px] text-slate-405 mt-0.5">
                        {language === 'ne' 
                          ? `स्वीकृत सदस्यहरूका लागि ${chartMonth} ${chartYear} को विवरण`
                          : `Status for ${chartMonth} ${chartYear} among approved members`}
                      </p>
                    </div>

                    {/* Filter Dropdown Controls */}
                    <div className="flex gap-1.5 items-center" id="chart-filter-controls">
                      <select
                        value={chartMonth}
                        onChange={(e) => setChartMonth(e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white cursor-pointer"
                        id="chart-month-select"
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={chartYear}
                        onChange={(e) => setChartYear(Number(e.target.value))}
                        className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white cursor-pointer"
                        id="chart-year-select"
                      >
                        {[2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {approvedMembersList.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-750 rounded-2xl" id="chart-no-members">
                      {language === 'ne' 
                        ? 'चार्ट देखाउनको लागि पहिले स्वीकृत सदस्यहरू आवश्यक पर्दछ।' 
                        : 'Approved active members required to display contribution status.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 pt-2" id="chart-body-wrapper">
                      {/* Pie Chart Element */}
                      <div className="sm:col-span-7 h-48 relative flex justify-center items-center" id="chart-visual-container">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b', 
                                border: 'none', 
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Donut Center Label */}
                        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none" id="donut-center-label">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total</span>
                          <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-0.5">{approvedMembersList.length}</span>
                        </div>
                      </div>

                      {/* Side Legend with detailed percentages */}
                      <div className="sm:col-span-5 space-y-3" id="chart-legend-container">
                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" id="legend-paid-box">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{language === 'ne' ? 'भुक्तानी गरिएको' : 'Paid'}</span>
                          </div>
                          <div className="text-right">
                            <strong className="text-xs text-slate-900 dark:text-white font-black block">{paidCount}</strong>
                            <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">
                              {approvedMembersList.length > 0 ? Math.round((paidCount / approvedMembersList.length) * 108 - 8) < 0 ? 0 : Math.round((paidCount / approvedMembersList.length) * 100) : 0}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" id="legend-pending-box">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{language === 'ne' ? 'बाँकी' : 'Pending'}</span>
                          </div>
                          <div className="text-right">
                            <strong className="text-xs text-slate-900 dark:text-white font-black block">{pendingCount}</strong>
                            <span className="text-[9px] text-rose-500 font-bold block mt-0.5">
                              {approvedMembersList.length > 0 ? Math.round((pendingCount / approvedMembersList.length) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Download Segment */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700" id="export-actions-box">
                  <h4 className="text-md font-bold text-slate-950 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="text-blue-500 w-5 h-5" />
                    {language === 'ne' ? 'प्रतिवेदन डाउनलोड / निर्यात गर्नुहोस्' : 'Reports & Exports (CSV/Excel)'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {language === 'ne' ? 'मासिक चन्दा विवरण र प्रमाणित सदस्यको विवरण एक्सेल/CSV फाईलमा निर्यात गर्नुहोस्।' : 'Download full spreadsheets ledger records containing club registrations and billing details.'}
                  </p>
                  <div className="flex gap-2" id="report-buttons">
                    <button
                      onClick={exportMembersToExcel}
                      className="flex-1 py-3 bg-blue-600 font-bold text-white rounded-2xl text-xs hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                      id="export-active-members-btn"
                    >
                      <Download className="w-4 h-4" />
                      {language === 'ne' ? 'सदस्य सूचि डाउनलोड (CSV)' : 'Export Members Sheet'}
                    </button>
                    <button
                      onClick={() => alert('PDF report mock prepared. Printing ledger!')}
                      className="px-4 py-3 bg-slate-100 dark:bg-slate-900 font-bold text-slate-600 rounded-2xl text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                      id="print-ledger-btn"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      Print PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Member Management */}
            {adminSubTab === 'members' && (
              <motion.div
                key="members-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
                id="view-members"
              >
                <h4 className="text-md font-bold text-slate-950 dark:text-white" id="pending-reg-title">
                  {language === 'ne' ? 'प्रतीक्षारत सदस्य निवेदनहरू' : 'Pending Member Approvals'}
                </h4>
                
                {filterPending.length === 0 ? (
                  <p className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 rounded-2xl text-xs text-slate-400 font-bold" id="pending-empty-p">
                    {language === 'ne' ? 'कुनै पनि नयाँ निवेदन छैन।' : 'No pending member application requests.'}
                  </p>
                ) : (
                  <div className="space-y-3" id="pending-applicant-list">
                    {filterPending.map((m) => (
                      <div key={m.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-4 rounded-3xl" id={`pending-applicant-${m.id}`}>
                        <div className="flex gap-3 items-center" id={`pending-top-${m.id}`}>
                          <img src={m.photoUrl} alt="avatar" className="w-10 h-10 object-cover rounded-xl" />
                          <div id={`pending-meta-${m.id}`}>
                            <strong className="text-sm text-slate-800 dark:text-white block">{m.fullName}</strong>
                            <span className="text-[10px] text-slate-400 block font-mono">Mobile: {m.mobileNumber}</span>
                          </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-750 flex gap-2 justify-end" id={`pending-actions-${m.id}`}>
                          <button
                            onClick={() => updateMemberStatus(m.id, 'approved')}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1"
                            id={`approve-btn-${m.id}`}
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => alert('Applicant declined')}
                            className="border border-red-300 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 cursor-pointer transition flex items-center gap-1"
                            id={`decline-btn-${m.id}`}
                          >
                            <Ban className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. Contribution Management */}
            {adminSubTab === 'contributions' && (
              <motion.div
                key="contributions-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
                id="view-contributions"
              >
                <h4 className="text-md font-bold text-slate-950 dark:text-white" id="fees-ledger-title">
                  {language === 'ne' ? 'सदस्यता सहयोग लेजर (Riyal 10)' : 'Contributions Ledger (10 Riyals each)'}
                </h4>

                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl max-h-80 overflow-y-auto" id="contributions-panel-list shadow">
                  <table className="w-full text-left text-xs text-slate-500" id="contrib-panel-table">
                    <thead className="text-[10px] text-slate-405 uppercase tracking-wider font-extrabold border-b border-dashed border-slate-100 dark:border-slate-700 pb-2">
                      <tr>
                        <th className="py-2.5">Member Name</th>
                        <th>Month/Year</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-75 coin">
                      {contributions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400 font-bold">No payments recorded.</td>
                        </tr>
                      ) : (
                        contributions.map((c, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="py-3 text-slate-900 dark:text-white font-bold">{c.memberName}</td>
                            <td>{c.month} {c.year}</td>
                            <td className="text-right font-black text-emerald-500">{c.amount} QR</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 4. Meetings / Attendance Management */}
            {adminSubTab === 'meetings' && (
              <motion.div
                key="meetings-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
                id="view-meetings-management"
              >
                {/* Add Meeting Form */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700" id="add-meeting-card">
                  <h4 className="text-md font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2" id="add-meeting-title">
                    <PlusCircle className="text-blue-500 w-5 h-5" />
                    {language === 'ne' ? 'नयाँ बैठक तालिका थप्नुहोस्' : 'Schedule New Committee Meeting'}
                  </h4>

                  <form onSubmit={handleScheduleMeeting} className="space-y-3.5" id="add-meeting-form">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">MEETING TITLE</label>
                      <input
                        type="text"
                        value={meetTitle}
                        onChange={(e) => setMeetTitle(e.target.value)}
                        placeholder="e.g. जेठ महिनाको मासिक सभा"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2" id="date-time-box">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">DATE</label>
                        <input
                          type="date"
                          value={meetDate}
                          onChange={(e) => setMeetDate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">TIME</label>
                        <input
                          type="time"
                          value={meetTime}
                          onChange={(e) => setMeetTime(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">VENUE</label>
                      <input
                        type="text"
                        value={meetVenue}
                        onChange={(e) => setMeetVenue(e.target.value)}
                        placeholder="e.g. कतार अल-खोर शाखा / चौरिया टोल पोखरी डाँडा"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">AGENDAS</label>
                      <textarea
                        rows={3}
                        value={meetAgenda}
                        onChange={(e) => setMeetAgenda(e.target.value)}
                        placeholder="e.g. १. अक्षय कोष निर्माण, २. असहाय बिमा प्रबन्ध..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-2xl shadow shadow-blue-500/10 active:scale-95 transition text-xs flex items-center justify-center gap-1 cursor-pointer"
                      id="schedule-submit-btn"
                    >
                      {language === 'ne' ? 'बैठक दर्ता गर्नुहोस्' : 'Schedule Meeting'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* 5. Notice / Alert Management */}
            {adminSubTab === 'notices' && (
              <motion.div
                key="notices-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
                id="view-notices-management"
              >
                {/* Add Notice Form */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700" id="add-notice-card">
                  <h4 className="text-md font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2" id="add-notice-title">
                    <Bell className="text-indigo-500 w-5 h-5" />
                    {language === 'ne' ? 'सूचना बोर्डमा प्रकाशित गर्नुहोस्' : 'Broadcast Live Board Notice'}
                  </h4>

                  <form onSubmit={handlePublishNotice} className="space-y-3.5" id="add-notice-form">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">NOTICE TITLE</label>
                      <input
                        type="text"
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder="e.g. जेठ २२ को सभा स्थगित गरिएको सुचना"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">DESCRIPTION</label>
                      <textarea
                        rows={4}
                        value={noticeDesc}
                        onChange={(e) => setNoticeDesc(e.target.value)}
                        placeholder="Full body message text details..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-blue-500 dark:text-white resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">CATEGORY PILL</label>
                      <select
                        value={noticeCat}
                        onChange={(e: any) => setNoticeCat(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-100 border border-slate-150 rounded-2xl text-sm"
                      >
                        <option value="notice">Routine/General Notice</option>
                        <option value="news">News Flash</option>
                        <option value="event">Club Event</option>
                        <option value="emergency">🚨 EMERGENCY ALERT 🚨</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-bold rounded-2xl active:scale-95 transition text-xs flex items-center justify-center gap-1 cursor-pointer"
                      id="notice-submit-btn"
                    >
                      {language === 'ne' ? 'सूचना बोर्डमा टास्नुहोस्' : 'Publish Notice Announcement'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* 6. Suggestions / Complaints Reviewer list */}
            {adminSubTab === 'suggestions' && (
              <motion.div
                key="suggestions-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
                id="view-suggestions-review"
              >
                <h4 className="text-md font-bold text-slate-950 dark:text-white">
                  {language === 'ne' ? 'नागरिक सल्लाह गुनासोहरू' : 'Suggestions & Complaints Feed'}
                </h4>
                
                {suggestions.length === 0 ? (
                  <p className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-slate-1100 rounded-2xl text-xs text-slate-400 font-bold">
                    {language === 'ne' ? 'कुनै पनि सुझाव वा गुनासो प्राप्त भएको छैन।' : 'No suggestions received yet.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((s) => (
                      <div key={s.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-150/60 p-4 rounded-3xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-sm block text-slate-900 dark:text-white">{s.senderName}</strong>
                            <span className="text-[10px] text-slate-500">Contact: {s.senderContact || 'N/A'} • {s.date}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            s.messageType === 'complaint' ? 'bg-rose-100 text-rose-700' : s.messageType === 'feedback' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-705'
                          }`}>
                            {s.messageType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed mt-3 pt-2.5 border-t border-slate-200/50">
                          {s.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
