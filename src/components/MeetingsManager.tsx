import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { translations, Language } from '../translations';
import { Meeting, Member } from '../types';
import { Users, Calendar, Clock, MapPin, ClipboardList, BookOpen, UserCheck, Check, PlusCircle, Notebook } from 'lucide-react';

interface MeetingsManagerProps {
  language: Language;
}

export function MeetingsManager({ language }: MeetingsManagerProps) {
  const t = translations[language];

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Active meeting toggle for checking attendance or details
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [markedMe, setMarkedMe] = useState(false);
  const [checkInMobile, setCheckInMobile] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  useEffect(() => {
    // Sync meetings real-time
    const unsubscribeMeetings = onSnapshot(collection(db, 'meetings'), (snapshot) => {
      const list: Meeting[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Meeting);
      });
      // Sort: upcoming first
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMeetings(list);
      setLoading(false);
    });

    // Load active members (needed to map attendance checklist)
    const unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const mList: Member[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Member, 'id'>;
        if (data.status === 'approved') {
          mList.push({ id: doc.id, ...data } as Member);
        }
      });
      setMembers(mList);
    });

    return () => {
      unsubscribeMeetings();
      unsubscribeMembers();
    };
  }, []);

  const handleSelfCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting || !checkInMobile) return;

    setCheckInMessage(null);

    // Look up member
    const targetMember = members.find((m) => m.mobileNumber === checkInMobile);
    if (!targetMember) {
      setCheckInMessage(language === 'ne' ? 'त्रुटि! तपाईं यो क्लबको स्वीकृत सदस्य हुनुहुन्न वा मोबाइल नम्बर मिलेन।' : 'Error! You are either pending or not a registered member.');
      return;
    }

    // Check if already in attendance
    if (selectedMeeting.attendance.includes(targetMember.id)) {
      setCheckInMessage(language === 'ne' ? 'तपाईंले पहिले नै हाजिरी गरिसक्नुभएको छ।' : 'You are already marked present.');
      return;
    }

    try {
      const updatedAttendance = [...selectedMeeting.attendance, targetMember.id];
      const meetingRef = doc(db, 'meetings', selectedMeeting.id);
      
      await updateDoc(meetingRef, {
        attendance: updatedAttendance
      });

      // Update local state
      setSelectedMeeting({
        ...selectedMeeting,
        attendance: updatedAttendance
      });

      setCheckInMessage(language === 'ne' ? `सफलतापूर्वक हाजिरी भयो! ${targetMember.fullName} उपस्थित हुनुभयो।` : `Attendance verified! Welcome ${targetMember.fullName}.`);
      setCheckInMobile('');
    } catch (err) {
      console.error(err);
      setCheckInMessage('Verification failed.');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24" id="meetings-container">
      {loading ? (
        <div className="flex justify-center items-center py-20" id="meetings-loading">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6" id="meetings-list-wrapper">
          {meetings.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-md border border-slate-100 dark:border-slate-700 text-center" id="no-meetings">
              <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-slate-700 dark:text-slate-350 font-semibold">{language === 'ne' ? 'कुनै बैठकहरू तालिकाबद्ध गरिएको छैन।' : 'No meetings currently scheduled.'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">{language === 'ne' ? 'नयाँ बैठकको सूचना यहाँ देखाइनेछ।' : 'New notices will be broadcasted live.'}</p>
            </div>
          ) : (
            <div className="space-y-4" id="meetings-cards-grid">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2" id="meetings-grid-title">
                <Users className="text-blue-600 w-5 h-5" />
                {t.upcomingMeetings}
              </h3>
              
              {meetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  onClick={() => { setSelectedMeeting(meeting); setCheckInMessage(null); }}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
                    selectedMeeting?.id === meeting.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-700'
                  }`}
                  id={`meeting-card-${meeting.id}`}
                >
                  <div className="flex justify-between items-start" id={`meeting-card-top-${meeting.id}`}>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      meeting.status === 'upcoming' 
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' 
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {meeting.status}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">{meeting.date}</span>
                  </div>

                  <h4 className="text-md font-bold text-slate-950 dark:text-white mt-3" id={`meeting-card-title-${meeting.id}`}>
                    {meeting.title}
                  </h4>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-350" id={`meeting-card-details-${meeting.id}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{meeting.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">{meeting.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-slate-400" />
                      <span className="line-clamp-1 italic">{meeting.agenda}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-slate-100 dark:border-slate-750 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400" id={`meeting-card-footer-${meeting.id}`}>
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 rounded-lg py-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <strong>{meeting.attendance.length}</strong> {language === 'ne' ? 'सहभागी' : 'Attended'}
                    </span>
                    <span className="text-blue-600 font-bold hover:underline">
                      {language === 'ne' ? 'विवरण र हाजिरी थप्नुहोस् »' : 'Details & Attend »'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Drawer / Section when Meeting is selected */}
          <AnimatePresence>
            {selectedMeeting && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-t-4 border-blue-600"
                id="selected-meeting-details"
              >
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-4 mb-4" id="selected-meeting-header">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white leading-tight">
                      {selectedMeeting.title}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">{selectedMeeting.date} ({selectedMeeting.time})</span>
                  </div>
                  <button 
                    onClick={() => setSelectedMeeting(null)}
                    className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-bold bg-slate-100 dark:bg-slate-900 p-2 rounded-full cursor-pointer leading-none"
                    id="close-meeting-detail-btn"
                  >
                    ✕
                  </button>
                </div>

                {/* Meeting Agenda & Minutes */}
                <div className="space-y-4" id="meeting-agenda-minutes-box">
                  <div id="selected-agenda">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <ClipboardList className="w-4 h-4 text-blue-500" />
                      {language === 'ne' ? 'बैठकको एजेन्डा' : 'Agenda'}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl mt-1.5 leading-relaxed font-semibold">
                      {selectedMeeting.agenda}
                    </p>
                  </div>

                  {selectedMeeting.minutes && (
                    <div id="selected-minutes">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        <Notebook className="w-4 h-4 text-indigo-500" />
                        {language === 'ne' ? 'बैठकको निर्णयहरू (Minutes)' : 'Meeting Minutes'}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-indigo-50/50 dark:bg-blue-950/10 p-4 border border-indigo-100/50 dark:border-slate-750 rounded-2xl mt-1.5 leading-relaxed whitespace-pre-line">
                        {selectedMeeting.minutes}
                      </p>
                    </div>
                  )}

                  {/* Attendance List */}
                  <div id="selected-attendance-box">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4 text-amber-500" />
                      {language === 'ne' ? 'बैठकमा सहभागी सदस्यहरू' : 'Attendance Checklist'}
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1" id="attendance-bubble-list">
                      {selectedMeeting.attendance.length > 0 ? (
                        members.filter((m) => selectedMeeting.attendance.includes(m.id)).map((m) => (
                          <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800" id={`att-bubble-${m.id}`}>
                            <Check className="w-3.5 h-3.5" />
                            {m.fullName}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">{language === 'ne' ? 'हाजिरी रेकर्ड खाली छ।' : 'No verified check-ins recorded yet.'}</span>
                      )}
                    </div>
                  </div>

                  {/* Digital Self Check-In Mechanism */}
                  {selectedMeeting.status === 'upcoming' && (
                    <div className="border-t border-dashed border-slate-100 dark:border-slate-750 pt-4" id="self-checkin-form-box">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        {language === 'ne' ? 'बैठक हाजिरी प्रणाली (Scan/Code Check-In)' : 'Digital Self Check-In'}
                      </h4>

                      {checkInMessage && (
                        <div className="mb-3 p-3 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center gap-1.5" id="checkin-notice">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{checkInMessage}</span>
                        </div>
                      )}

                      <form onSubmit={handleSelfCheckIn} className="flex gap-2" id="self-checkin-form">
                        <input
                          type="tel"
                          value={checkInMobile}
                          onChange={(e) => setCheckInMobile(e.target.value)}
                          placeholder={language === 'ne' ? 'तपाईंको दर्ता मोबाइल नम्बर' : 'Enter registered mobile'}
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition"
                          id="checkin-submit-btn"
                        >
                          {language === 'ne' ? 'हाजिरी गर्नुहोस्' : 'Check In'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
