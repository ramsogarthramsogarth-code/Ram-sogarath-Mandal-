import { motion } from 'motion/react';
import { translations, Language } from '../translations';
import { Shield, BookOpen, Clock, HandCoins, Users, HeartHandshake, Eye, Award, Landmark, CheckCircle2 } from 'lucide-react';

interface AboutClubProps {
  language: Language;
}

export function AboutClub({ language }: AboutClubProps) {
  const t = translations[language];

  const objectiveIcons = [
    <Users className="w-6 h-6 text-blue-600" id="icon-obj1" key="obj1" />,
    <HeartHandshake className="w-6 h-6 text-blue-600" id="icon-obj2" key="obj2" />,
    <HandCoins className="w-6 h-6 text-blue-600" id="icon-obj3" key="obj3" />,
    <Shield className="w-6 h-6 text-blue-600" id="icon-obj4" key="obj4" />,
    <Eye className="w-6 h-6 text-blue-600" id="icon-obj5" key="obj5" />,
    <Landmark className="w-6 h-6 text-blue-600" id="icon-obj6" key="obj6" />,
    <Award className="w-6 h-6 text-blue-600" id="icon-obj7" key="obj7" />,
  ];

  const objectives = [
    t.obj1,
    t.obj2,
    t.obj3,
    t.obj4,
    t.obj5,
    t.obj6,
    t.obj7,
  ];

  const rules = [
    t.rule1,
    t.rule2,
    t.rule3,
    t.rule4,
    t.rule5,
    t.rule6,
    t.rule7,
    t.rule8,
    t.rule9,
    t.rule10,
  ];

  return (
    <div className="space-y-8 p-4 max-w-lg mx-auto pb-24" id="about-club-container">
      {/* Club History Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
        id="club-history-card"
      >
        <div className="flex items-center gap-3 mb-4" id="club-history-header">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600" id="history-icon-box">
            <BookOpen className="w-6 h-6" id="history-icon" />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white" id="history-title">
            {t.history}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line" id="history-content">
          {t.historyText}
        </p>
      </motion.div>

      {/* Club Objectives Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
        id="club-objectives-card"
      >
        <div className="flex items-center gap-3 mb-6" id="club-objectives-header">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600" id="objectives-icon-box">
            <Shield className="w-6 h-6" id="objectives-icon" />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white" id="objectives-title">
            {t.objectives}
          </h2>
        </div>

        <div className="grid gap-4" id="objectives-grid">
          {objectives.map((obj, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl" id={`objective-item-${index}`}>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl" id={`objective-icon-wrapper-${index}`}>
                {objectiveIcons[index] || <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </div>
              <div id={`objective-text-${index}`}>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-250">
                  {language === 'ne' ? `${index + 1}. ` : ''}{obj}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Club Rules Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-700"
        id="club-rules-card"
      >
        <div className="flex items-center gap-3 mb-6" id="club-rules-header">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-600" id="rules-icon-box">
            <Clock className="w-6 h-6" id="rules-icon" />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white" id="rules-title">
            {t.rules}
          </h2>
        </div>

        <div className="space-y-3" id="rules-list">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-3 items-start border-b border-dashed border-slate-100 dark:border-slate-700/60 pb-3 last:border-0 last:pb-0" id={`rule-row-${index}`}>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0 mt-0.5" id={`rule-number-${index}`}>
                {index + 1}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed" id={`rule-desc-${index}`}>
                {rule}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
