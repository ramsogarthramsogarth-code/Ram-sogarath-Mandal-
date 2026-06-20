import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { Member, Contribution } from '../types';
import { Wallet, Search, Check, AlertTriangle, AlertCircle, Calendar, PlusCircle, ArrowUpRight } from 'lucide-react';

interface MonthlyContributionsProps {
  language: Language;
}

export function MonthlyContributions({ language }: MonthlyContributionsProps) {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'my_contributions' | 'pay_virtual'>('my_contributions');
  const [searchMobile, setSearchMobile] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Contribution[]>([]);
  const [dues, setDues] = useState<{ month: string; year: number; amount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick contribute state (for simulation of submit contribution requests or fake payments)
  const [payMonth, setPayMonth] = useState('January');
  const [payYear, setPayYear] = useState(2026);
  const [payAmount] = useState(10); // Fixed 10 Riyals
  const [payLoading, setPayLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const nepaliMonths = [
    'वैशाख (Baishakh)', 'जेठ (Jestha)', 'असार (Asar)', 'साउन (Shrawan)', 'भदौ (Bhadau)', 'असोज (Asoj)',
    'कात्तिक (Kartik)', 'मंसिर (Mangsir)', 'पुस (Poush)', 'माघ (Magh)', 'फागुन (Falgun)', 'चैत (Chaitra)'
  ];

  const activeMonths = language === 'ne' ? nepaliMonths : months;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMobile) return;

    setLoading(true);
    setMember(null);
    setPayments([]);
    setDues([]);
    setError(null);
    setSuccessMsg(null);

    try {
      // Find Member
      const memberQuery = query(collection(db, 'members'), where('mobileNumber', '==', searchMobile));
      const memberSnapshot = await getDocs(memberQuery);

      if (memberSnapshot.empty) {
        setError(language === 'ne' ? 'यो मोबाइल नम्बर भएको सदस्य भेटिएन।' : 'No verified member found.');
        setLoading(false);
        return;
      }

      const activeDoc = memberSnapshot.docs[0];
      const memberData = { id: activeDoc.id, ...activeDoc.data() } as Member;
      setMember(memberData);

      // Grab payments
      const paymentsQuery = query(collection(db, 'contributions'), where('memberId', '==', activeDoc.id));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      const paymentsList: Contribution[] = [];
      paymentsSnapshot.forEach((doc) => {
        paymentsList.push({ id: doc.id, ...doc.data() } as Contribution);
      });
      setPayments(paymentsList);

      // Compute Dues starting from 2026 for demonstration
      const potentialDues = [
        { month: 'January', year: 2026, amount: 10 },
        { month: 'February', year: 2026, amount: 10 },
        { month: 'March', year: 2026, amount: 10 },
        { month: 'April', year: 2026, amount: 10 },
        { month: 'May', year: 2026, amount: 10 },
        { month: 'June', year: 2026, amount: 10 },
      ];

      // Filter potential dues that have not been paid yet
      const unpaidDues = potentialDues.filter((due) => {
        return !paymentsList.some(
          (pay) => pay.month.toLowerCase() === due.month.toLowerCase() && pay.year === due.year && pay.status === 'paid'
        );
      });
      setDues(unpaidDues);

    } catch (err) {
      console.error(err);
      setError(language === 'ne' ? 'विवरण खोज्न समस्या भयो।' : 'Failed to search details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setPayLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Check if already paid
    const alreadyPaid = payments.some(
      (p) => p.month.toLowerCase() === payMonth.toLowerCase() && p.year === payYear && p.status === 'paid'
    );

    if (alreadyPaid) {
      setError(language === 'ne' ? `${payMonth} ${payYear} को शुल्क पहिले नै भुक्तानी भइसकेको छ।` : `Already paid for ${payMonth} ${payYear}.`);
      setPayLoading(false);
      return;
    }

    try {
      const newContribution: Omit<Contribution, 'id'> = {
        memberId: member.id,
        memberName: member.fullName,
        amount: payAmount,
        month: payMonth,
        year: payYear,
        datePaid: new Date().toISOString().split('T')[0],
        status: 'paid',
        paymentMethod: 'Online/Wallet',
        transactionId: 'TXN' + Math.floor(Math.random() * 10000000)
      };

      await addDoc(collection(db, 'contributions'), newContribution);

      setSuccessMsg(
        language === 'ne' 
          ? `सफलतापूर्वक १० रियाल (${payMonth}) को सहयोग दर्ता भयो!` 
          : `Successfully registered 10 Riyals monthly code for ${payMonth}!`
      );

      // Refresh data
      // Add local contribution list to state
      setPayments((prev) => [...prev, { id: 'temp-id', ...newContribution } as Contribution]);
      setDues((prev) => prev.filter((d) => !(d.month === payMonth && d.year === payYear)));

    } catch (err) {
      console.error(err);
      setError(language === 'ne' ? 'भुक्तानी दर्ता गर्न सकिएन।' : 'Failed to register contribution payment.');
    } finally {
      setPayLoading(false);
    }
  };

  // Automated dues reminder trigger notification mockup
  const triggerReminder = () => {
    if (!member || dues.length === 0) return;
    const totalDue = dues.length * 10;
    const alertText = language === 'ne'
      ? `🔔 क्लब अनुस्मारक: नमस्कार ${member.fullName}! तपाईंको महावीर युवा क्लब, चौरियामा मासिक १० रियालका दरले जम्मा ${dues.length} महिनाको ${totalDue} रियाल बाँकी देखिएको छ। कृपया समयमै बुझाउनुहोला।`
      : `🔔 Contribution Reminder: Dear ${member.fullName}, you have ${dues.length} month(s) contribution due totaling ${totalDue} Riyals for Shri Mahavir Yuva Club. Please deposit at your earliest convenience.`;
    
    alert(alertText);
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="contributions-container">
      {/* Sub Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 mb-6" id="contrib-tabs-wrapper">
        <button
          onClick={() => setActiveTab('my_contributions')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'my_contributions' 
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="contrib-search-tab"
        >
          <Wallet className="w-4 h-4" />
          {language === 'ne' ? 'भुक्तानी र बक्यौता खोज्नुहोस्' : 'Dues & Payment Search'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900 flex items-start gap-2 text-sm" id="contrib-err-box">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 flex items-start gap-2 text-sm" id="contrib-success-box">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {activeTab === 'my_contributions' && (
        <div className="space-y-6" id="my-contributions-section">
          {/* Mobile Search */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700" id="contrib-search-card">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4" id="contrib-search-title">
              {language === 'ne' ? 'सहयोग विवरण हेर्न मोबाइल नम्बर हाल्नुहोस्' : 'Enter Mobile to view Monthly Contributions'}
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2" id="contrib-search-form">
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
                className="px-5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-2xl cursor-pointer flex items-center gap-1 active:scale-95 transition-all text-sm"
                id="contrib-search-btn"
              >
                <Search className="w-4 h-4" />
                {language === 'ne' ? 'खोज्नुहोस्' : 'Search'}
              </button>
            </form>
          </div>

          {member && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="contrib-data-box"
            >
              {/* Member detail header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md" id="contrib-member-strip">
                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest">{language === 'ne' ? 'क्लब सदस्य' : 'MEMBER'}</span>
                <h4 className="text-lg font-bold mt-1 text-white">{member.fullName}</h4>
                <div className="flex gap-4 mt-3 text-xs opacity-90" id="contrib-member-contact">
                  <div>
                    <span className="block text-[10px] opacity-75">{language === 'ne' ? 'देश' : 'Country'}</span>
                    <strong className="text-white">{member.country}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] opacity-75">{language === 'ne' ? 'मोबाइल' : 'Mobile'}</span>
                    <strong className="text-white">{member.mobileNumber}</strong>
                  </div>
                </div>
              </div>

              {/* Dues Alert & Payment action */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700" id="contrib-dues-card">
                <div className="flex justify-between items-center mb-4" id="dues-header">
                  <h4 className="text-md font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="text-amber-500 w-5 h-5" />
                    {language === 'ne' ? 'बाँकी बक्यौता सूची (Dues)' : 'Outstanding Dues List'}
                  </h4>
                  {dues.length > 0 && (
                    <button 
                      onClick={triggerReminder} 
                      className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-xl font-bold hover:bg-amber-200 transition"
                      id="reminder-btn"
                    >
                      {language === 'ne' ? 'रिमाइन्डर पठाउनुहोस्' : 'Trigger Reminder'}
                    </button>
                  )}
                </div>

                {dues.length > 0 ? (
                  <div className="space-y-3" id="dues-list-items">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-2">
                      ⚠️ {language === 'ne' ? `तपाईंको जम्मा ${dues.length} महिनाको भुक्तानी बाँकी छ!` : `You have ${dues.length} months remaining unpaid!`}
                    </p>
                    <div className="grid gap-2 border-b border-dashed border-slate-100 dark:border-slate-700 pb-4" id="dues-grid">
                      {dues.map((due, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-rose-50/50 dark:bg-rose-950/10 px-4 py-2.5 rounded-xl" id={`due-item-${idx}`}>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-350">{due.month} {due.year}</span>
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{due.amount} Riyal</span>
                        </div>
                      ))}
                    </div>

                    {/* Virtual Payment Entry Form */}
                    <form onSubmit={handlePay} className="mt-4 pt-4 space-y-3" id="quick-pay-form">
                      <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {language === 'ne' ? 'तत्काल बक्यौता भुक्तानी रसिद रेकर्ड' : 'Record Direct Payment Contribution'}
                      </h5>
                      <div className="flex gap-2" id="quick-pay-fields">
                        <select 
                          value={payMonth} 
                          onChange={(e) => setPayMonth(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                        >
                          {months.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select 
                          value={payYear} 
                          onChange={(e) => setPayYear(Number(e.target.value))}
                          className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                        >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                        </select>
                        <button
                          type="submit"
                          disabled={payLoading}
                          className="px-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition-all text-sm flex items-center gap-1 shrink-0"
                          id="submit-pay-btn"
                        >
                          {payLoading ? '...' : (language === 'ne' ? 'तिर्नुहोस्' : 'Pay 10 Riyal')}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center" id="no-dues-box">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{language === 'ne' ? 'बधाई छ! तपाईंसँग कुनै बक्यौता छैन।' : 'No outstanding dues. All contributions paid!'}</p>
                    <span className="text-xs text-slate-500">{language === 'ne' ? 'सबै मासिक किस्ता बुझाउनुभएको छ।' : 'All monthly contributions fully up to date.'}</span>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700" id="contrib-history-card">
                <h4 className="text-md font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2" id="history-box-title">
                  <Calendar className="text-blue-500 w-5 h-5" />
                  {language === 'ne' ? 'भुक्तानी विवरण इतिहास' : 'Payment History Ledger'}
                </h4>
                
                {payments.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto" id="payments-history-items">
                    {payments.map((pay, index) => (
                      <div key={index} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl" id={`payment-row-${index}`}>
                        <div id={`payment-row-left-${index}`}>
                          <strong className="text-sm text-slate-800 dark:text-white">{pay.month} {pay.year}</strong>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            ID: {pay.transactionId || 'C-MOCK'} • Paid on {pay.datePaid}
                          </span>
                        </div>
                        <div className="text-right" id={`payment-row-right-${index}`}>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                            {pay.amount} Riyal
                          </span>
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                            <Check className="w-2.5 h-2.5" />
                            Success
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-sm text-slate-500 leading-relaxed" id="history-empty-box">
                    {language === 'ne' ? 'अहिलेसम्म कुनै भुक्तानी विवरण फेला परेन।' : 'No transaction records found.'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
