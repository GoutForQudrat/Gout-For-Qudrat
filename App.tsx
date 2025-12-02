
import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Calculator, ClipboardCheck, Home, FileText, ChevronLeft, Sparkles, Lightbulb, Moon, Sun, Star, ArrowUp, CheckCircle, Quote, Mail, MapPin, Phone, Instagram, Twitter, Youtube, Clock, AlertTriangle, History, Trophy, Crown, Medal, TrendingUp, Target, User, Award, Check, Flame, Shield, Zap, LogOut, X, Menu } from 'lucide-react';
import { VERBAL_LINKS, ANALOGY_TESTS, SENTENCE_TESTS, CONTEXT_TESTS, READING_TESTS, TEST_TITLES } from './constants';
import { Section, ResourceLink, QuizResult, Question, Badge, User as UserType } from './types';
import GeminiTutor from './components/GeminiTutor';
import QuizEngine from './components/QuizEngine';
import HistoryLog from './components/HistoryLog';
import Profile from './components/Profile';
import { ANALOGY_QUESTIONS_DATA, ANALOGY_QUESTIONS_DATA_2, ANALOGY_QUESTIONS_DATA_3 } from './data/questions';

const MOTIVATIONAL_QUOTES = [
  "النجاح لا يأتي بالصدفة، بل بالعمل الجاد والمثابرة.",
  "كل دقيقة تقضيها في المذاكرة تقربك خطوة نحو حلمك.",
  "لا تؤجل عمل اليوم إلى الغد، ابدأ الآن.",
  "ثق بقدراتك، فأنت قادر على تحقيق المستحيل.",
  "الاستمرارية هي سر النجاح، واصل المسير مهما كانت الصعوبات.",
  "تذكر دائمًا: ألم الدراسة لحظة، ولكن مجد النجاح يستمر للأبد.",
  "القمة تتسع للجميع، لكنها تحتاج لمن يتسلق إليها.",
  "لا تتوقف عندما تتعب، توقف عندما تنتهي.",
  "العلم نور، والقدرات هي مفتاح المستقبل.",
  "أفضل طريقة للتنبؤ بالمستقبل هي صناعته.",
  "إيمانك بنفسك هو نصف الطريق نحو النجاح.",
  "التدريب المستمر يكسر حاجز الخوف ويزيد الثقة."
];

// --- BADGES DATA ---
const AVAILABLE_BADGES: Badge[] = [
    { 
        id: 'streak_30', 
        name: 'أسطورة الاستمرار', 
        description: 'دخول متواصل لمدة 30 يوم', 
        icon: <Flame size={20} className="text-orange-500" />, 
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        condition: 'streak >= 30'
    },
    { 
        id: 'league_1', 
        name: 'بطل الدوري', 
        description: 'المركز الأول في الدوري الأسبوعي', 
        icon: <Crown size={20} className="text-yellow-500" />, 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        condition: 'rank === 1'
    },
    { 
        id: 'league_2', 
        name: 'وصيف البطل', 
        description: 'المركز الثاني في الدوري الأسبوعي', 
        icon: <Medal size={20} className="text-gray-400" />, 
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        condition: 'rank === 2'
    },
    { 
        id: 'high_score', 
        name: 'العقل المدبر', 
        description: 'الحصول على درجة كاملة في اختبار', 
        icon: <Zap size={20} className="text-blue-500" />, 
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        condition: 'score === 100%'
    },
];

// --- GAMIFICATION LOGIC ---

interface League {
    id: string;
    name: string;
    minPoints: number;
    color: string;
    icon: React.ReactNode;
    description: string;
}

const LEAGUES: League[] = [
    { id: 'bronze', name: 'برونزي', minPoints: 0, color: 'text-amber-700', icon: <Medal size={32} className="text-amber-700" />, description: "بداية الطريق نحو القمة" },
    { id: 'silver', name: 'فضي', minPoints: 500, color: 'text-gray-400', icon: <Medal size={32} className="text-gray-400" />, description: "مستوى جيد، استمر في التقدم" },
    { id: 'gold', name: 'ذهبي', minPoints: 1500, color: 'text-yellow-500', icon: <Trophy size={32} className="text-yellow-500" />, description: "أداء رائع ومميز" },
    { id: 'platinum', name: 'بلاتيني', minPoints: 3000, color: 'text-cyan-400', icon: <Award size={32} className="text-cyan-400" />, description: "أنت من النخبة الآن" },
    { id: 'diamond', name: 'ماسي', minPoints: 5000, color: 'text-indigo-400', icon: <Crown size={32} className="text-indigo-400" />, description: "أسطورة القدرات!" },
];

const calculateTotalPoints = (history: { [testId: number]: QuizResult }) => {
    let points = 0;
    Object.values(history).forEach(result => {
        points += result.score * 10;
        const percentage = result.score / result.total;
        if (percentage >= 1) points += 100;
        else if (percentage >= 0.8) points += 50;
    });
    return points;
};

const getCurrentLeague = (points: number) => {
    return LEAGUES.slice().reverse().find(l => points >= l.minPoints) || LEAGUES[0];
};

// --- COMPONENTS ---

const NavButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string;
}> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
            active 
            ? 'bg-primary text-white shadow-md transform scale-105 ring-2 ring-amber-200 dark:ring-amber-900' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary'
        }`}
    >
        {icon}
        <span className="text-sm md:text-base">{label}</span>
    </button>
);

const LinkCard: React.FC<{ link: ResourceLink }> = ({ link }) => (
    <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 mb-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl hover:translate-x-[-5px] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group border border-gray-200 dark:border-slate-700 glass-card hover:border-primary"
    >
        <span className="font-medium text-lg">{link.title}</span>
        <span className="bg-amber-100 dark:bg-slate-700 text-amber-600 dark:text-amber-400 p-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronLeft size={20} />
        </span>
    </a>
);

const TestCard: React.FC<{ 
  title: string; 
  questionsCount: number; 
  bestScore?: number; 
  onClick: () => void; 
  isNew?: boolean;
}> = ({ title, questionsCount, bestScore, onClick, isNew }) => (
  <div 
    onClick={onClick}
    className="glass-card bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 hover:scale-[1.02] hover:border-primary transition-all duration-300 cursor-pointer group relative overflow-hidden"
  >
    {isNew && (
      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-sm z-10">
        جديد
      </div>
    )}
    
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
        <ClipboardCheck size={32} />
      </div>
      {bestScore !== undefined && (
        <div className="text-left">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">أفضل نتيجة</div>
          <div className={`text-lg font-black ${bestScore >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
            {bestScore}%
          </div>
        </div>
      )}
    </div>

    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
      {title}
    </h3>
    
    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
      <span className="flex items-center gap-1">
        <ClipboardCheck size={14} />
        {questionsCount} سؤال
      </span>
      <span className="flex items-center gap-1">
        <Clock size={14} />
        {Math.round(questionsCount * 0.8)} دقيقة
      </span>
    </div>

    <button className="w-full py-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 font-bold group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-2">
      {bestScore !== undefined ? 'إعادة الاختبار' : 'ابدأ الاختبار'}
      <ChevronLeft size={18} />
    </button>
  </div>
);

const FeatureCard: React.FC<{ icon: string; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
    <div 
        onClick={onClick}
        className="glass-card p-8 rounded-3xl text-center cursor-pointer hover:scale-[1.02] hover:border-amber-500 transition-all duration-300 border border-white/60 dark:border-white/10 shadow-lg hover:shadow-amber-100 dark:hover:shadow-none group relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/10 transition-colors duration-300"></div>
        <div className="relative z-10">
            <div className="text-5xl mb-6 filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 font-medium">{desc}</p>
        </div>
    </div>
);

const StatCard: React.FC<{ icon: React.ReactNode | string; number: string; label: string }> = ({ icon, number, label }) => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center hover:scale-105 transition-transform duration-300 shadow-lg border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center">
        <div className="text-5xl mb-4 text-amber-500">{icon}</div>
        <div className="text-4xl font-black mb-2 text-primary drop-shadow-sm">
            {number}
        </div>
        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{label}</div>
    </div>
);

const DailyWisdom: React.FC = () => {
    const [quote, setQuote] = useState('');

    useEffect(() => {
        const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setQuote(MOTIVATIONAL_QUOTES[index]);
    }, []);
  
    if (!quote) return null;

    return (
      <div className="max-w-4xl mx-auto px-4 mt-16 mb-20 animate-fadeIn">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 md:p-10 text-center shadow-2xl border border-gray-700 dark:border-slate-700 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
          <div className="relative z-10">
            <h3 className="text-amber-500 font-bold text-lg md:text-xl mb-6 flex items-center justify-center gap-3">
                <Sparkles size={20} />
                حكمة اليوم
                <Sparkles size={20} />
            </h3>
            <p className="text-white text-xl md:text-3xl font-bold leading-relaxed font-sans drop-shadow-md">
                "{quote}"
            </p>
          </div>
        </div>
      </div>
    );
};

const MistakesLog: React.FC<{ 
  quizHistory: { [testId: number]: QuizResult },
  allQuestions: { [testId: number]: Question[] }
}> = ({ quizHistory, allQuestions }) => {
  const [mistakes, setMistakes] = useState<{question: Question, userAnswer: number}[]>([]);

  useEffect(() => {
    const allMistakes: {question: Question, userAnswer: number}[] = [];
    Object.entries(quizHistory).forEach(([testIdStr, testResultRaw]) => {
        const testId = parseInt(testIdStr);
        const questions = allQuestions[testId];
        const testResult = testResultRaw as QuizResult;
        
        if (questions && testResult.answers) {
            Object.entries(testResult.answers).forEach(([qIndex, answerIndex]) => {
                const qIdx = parseInt(qIndex);
                const question = questions[qIdx];
                if (question && answerIndex !== question.correctAnswerIndex) {
                    allMistakes.push({ question: question, userAnswer: answerIndex as number });
                }
            });
        }
    });
    setMistakes(allMistakes);
  }, [quizHistory, allQuestions]);

  if (mistakes.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
        <CheckCircle size={32} className="mx-auto mb-4 text-green-500"/>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">سجلك نظيف!</h3>
        <p className="text-gray-500 dark:text-gray-400">لم يتم تسجيل أي أخطاء.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" />
            سجل الأخطاء ({mistakes.length})
        </h3>
      </div>
      <div className="grid gap-4">
        {mistakes.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden glass-card hover:border-red-500 transition-colors">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4 pl-4">{item.question.text}</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
               <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                 <span className="block text-red-600 dark:text-red-400 font-bold mb-1 text-xs">إجابتك الخاطئة</span>
                 <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <CheckCircle size={16} className="text-red-500 rotate-45" />
                    {item.question.options[item.userAnswer]}
                 </div>
               </div>
               <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                 <span className="block text-green-600 dark:text-green-400 font-bold mb-1 text-xs">الإجابة الصحيحة</span>
                 <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <CheckCircle size={16} className="text-green-500" />
                    {item.question.options[item.question.correctAnswerIndex]}
                 </div>
               </div>
            </div>
            {item.question.explanation && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
                    <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p>{item.question.explanation}</p>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const BackgroundBlobs: React.FC = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-50 dark:opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-300/30 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-300/30 dark:bg-amber-900/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-pink-300/30 dark:bg-pink-900/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
    </div>
);

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  // Default user state (Guest)
  const [currentUser, setCurrentUser] = useState<UserType>({
      id: 'guest',
      name: 'البطل',
      email: 'guest@alqut.com',
      avatar: '🦁',
      joinedDate: Date.now()
  });

  const [activeSection, setActiveSection] = useState<Section>(Section.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTestId, setActiveTestId] = useState<number | null>(null);
  const [quizHistory, setQuizHistory] = useState<{ [testId: number]: QuizResult }>({});
  
  const [streak, setStreak] = useState(0);

  // Load Initial State
  useEffect(() => {
    // Dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Load custom user data if exists (for profile edits)
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
        try {
            setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
            console.error("Failed to parse user", e);
        }
    }

    // Quiz History
    const savedHistory = localStorage.getItem('quiz_history');
    if (savedHistory) {
        try {
            setQuizHistory(JSON.parse(savedHistory));
        } catch (e) { console.error(e); }
    }

    // Streak Logic
    const lastVisit = localStorage.getItem('last_visit_date');
    const savedStreak = parseInt(localStorage.getItem('user_streak') || '0');
    const today = new Date().toDateString();

    if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisit === yesterday.toDateString()) {
            const newStreak = savedStreak + 1;
            setStreak(newStreak);
            localStorage.setItem('user_streak', newStreak.toString());
        } else {
            setStreak(1);
            localStorage.setItem('user_streak', '1');
        }
        localStorage.setItem('last_visit_date', today);
    } else {
        setStreak(savedStreak || 1);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
      // In guest mode, "logout" just resets profile changes really, 
      // but for now we'll just reload to reset state or clear local storage if we wanted a hard reset.
      // For this user flow, we just keep them on the page.
      alert("تم حفظ بياناتك محلياً.");
  };

  const handleUpdateProfile = (data: { name: string; avatar: string }) => {
    if (currentUser) {
        const updatedUser = { ...currentUser, ...data };
        setCurrentUser(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    if (activeTestId === null) return;
    
    const newHistory = {
      ...quizHistory,
      [activeTestId]: { ...result, timestamp: Date.now() }
    };
    
    setQuizHistory(newHistory);
    localStorage.setItem('quiz_history', JSON.stringify(newHistory));
    setActiveTestId(null);
    setActiveSection(Section.HOME); 
  };

  // Helper to aggregate questions
  const allQuestionsMap = useMemo(() => ({
    1: ANALOGY_QUESTIONS_DATA,
    2: ANALOGY_QUESTIONS_DATA_2,
    3: ANALOGY_QUESTIONS_DATA_3,
    // 4 Removed Quantitative
  }), []);

  const activeQuestions = activeTestId ? allQuestionsMap[activeTestId as keyof typeof allQuestionsMap] : [];

  const totalPoints = calculateTotalPoints(quizHistory);
  const currentLeague = getCurrentLeague(totalPoints);


  if (activeTestId && activeQuestions.length > 0) {
    return (
      <div className={`min-h-screen font-sans bg-gray-50 dark:bg-slate-900 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`} dir="rtl">
        <BackgroundBlobs />
        <div className="relative z-10 p-4 md:p-8">
             <QuizEngine
                questions={activeQuestions}
                title={TEST_TITLES[activeTestId] || "اختبار"}
                testId={activeTestId}
                onExit={() => setActiveTestId(null)}
                onComplete={handleQuizComplete}
             />
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className={`min-h-screen font-sans bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`} dir="rtl">
      <BackgroundBlobs />
      
      {/* Sidebar (Desktop) */}
      <aside className="fixed right-0 top-0 h-full w-72 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-l border-gray-200 dark:border-slate-800 z-50 hidden lg:flex flex-col p-6 shadow-2xl">
        <div className="flex items-center gap-3 px-2 mb-10">
           <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
               <span className="font-black text-xl">ق</span>
           </div>
           <h1 className="text-2xl font-extrabold tracking-tight">القوت <span className="text-amber-500">للقدرات</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
            {[
                { id: Section.HOME, label: 'الرئيسية', icon: <Home size={22} /> },
                // Quantitative removed
                { id: Section.VERBAL, label: 'القسم اللفظي', icon: <BookOpen size={22} /> },
                { id: Section.TESTS, label: 'الاختبارات', icon: <ClipboardCheck size={22} /> },
                { id: Section.AI_TUTOR, label: 'المساعد الذكي', icon: <Sparkles size={22} /> },
                { id: Section.PROFILE, label: 'الملف الشخصي', icon: <User size={22} /> },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold ${
                        activeSection === item.id 
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 translate-x-[-4px]' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </nav>
        
        {/* User Mini Profile */}
        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" onClick={() => setActiveSection(Section.PROFILE)}>
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-slate-700 flex items-center justify-center text-xl border border-white dark:border-slate-600 shadow-sm">
                    {currentUser.avatar || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-xs text-amber-500 font-medium truncate">{currentLeague.name}</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:mr-72 min-h-screen relative z-10 pb-24 lg:pb-8">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">ق</div>
                <h1 className="font-bold text-lg">القوت</h1>
            </div>
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-100 dark:border-orange-900/30">
                    <Flame size={14} className="fill-orange-500" />
                    {streak} يوم
                </div>
                <button onClick={toggleDarkMode} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            
            {/* Header / Welcome (Desktop) */}
            <header className="hidden lg:flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                        مرحباً، {currentUser.name.split(' ')[0]} 👋
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">جاهز للتحدي اليوم؟ واصل تقدمك!</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <Flame size={20} className="text-orange-500 fill-orange-500 animate-pulse" />
                        <div>
                            <div className="text-xs text-gray-400 font-bold">الحماس</div>
                            <div className="font-black text-gray-900 dark:text-white">{streak} أيام</div>
                        </div>
                    </div>
                    <button onClick={toggleDarkMode} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-amber-500 transition-colors">
                        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                </div>
            </header>

            {/* SECTIONS RENDER */}
            {activeSection === Section.HOME && (
                <div className="space-y-10 animate-slideUp">
                    
                    {/* NEW LARGE HERO TITLE */}
                    <div className="text-center py-6 animate-fadeIn">
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 text-center mb-4 tracking-tighter filter drop-shadow-sm">
                            القوت للقدرات
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">منصتك الأولى للوصول إلى 100%</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={<CheckCircle />} number={Object.values(quizHistory).reduce((acc: number, curr: QuizResult) => acc + curr.score, 0).toString()} label="إجابة صحيحة" />
                        <StatCard icon={<ClipboardCheck />} number={Object.keys(quizHistory).length.toString()} label="اختبار منجز" />
                        <StatCard icon={<TrendingUp />} number={`${currentLeague.name}`} label="المستوى الحالي" />
                        <StatCard icon={<Clock />} number={Math.round(Object.values(quizHistory).reduce((acc: number, curr: QuizResult) => acc + curr.timeSpent, 0) / 60).toString()} label="دقيقة تدريب" />
                    </div>
                    
                    <DailyWisdom />

                    {/* Quick Access - Removed Quantitative */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <FeatureCard 
                            icon="📖" 
                            title="القسم اللفظي" 
                            desc="تناظر، استيعاب مقروء، وخطأ سياقي" 
                            onClick={() => setActiveSection(Section.VERBAL)} 
                         />
                         <FeatureCard 
                            icon="🤖" 
                            title="المساعد الذكي" 
                            desc="اسأل القوت أي سؤال يصعب عليك" 
                            onClick={() => setActiveSection(Section.AI_TUTOR)} 
                         />
                         <FeatureCard 
                            icon="📋" 
                            title="بنك الاختبارات" 
                            desc="تصفح جميع الاختبارات المتاحة" 
                            onClick={() => setActiveSection(Section.TESTS)} 
                         />
                    </div>
                </div>
            )}

            {/* Quantitative Section Removed */}

            {activeSection === Section.VERBAL && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">القسم اللفظي</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                                <FileText /> التناظر اللفظي (تفاعلي)
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map(id => (
                                    <TestCard 
                                        key={id}
                                        title={TEST_TITLES[id]} 
                                        questionsCount={allQuestionsMap[id as keyof typeof allQuestionsMap]?.length || 0}
                                        bestScore={quizHistory[id] ? Math.round((quizHistory[id].score / quizHistory[id].total) * 100) : undefined}
                                        onClick={() => setActiveTestId(id)}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-xl font-bold mb-6">ملفات التأسيس</h3>
                                {VERBAL_LINKS.map((link, idx) => <LinkCard key={idx} link={link} />)}
                            </div>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                                <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">نصيحة القسم اللفظي</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                                    ركز على فهم العلاقات في التناظر اللفظي بدلاً من الحفظ. ابحث عن العلاقة المشابهة في الاتجاه والنوع.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === Section.TESTS && (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">بنك الاختبارات</h2>
                    
                    {/* Tabs for different test types could go here */}
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {[...ANALOGY_TESTS, ...SENTENCE_TESTS].slice(0, 9).map((test, idx) => (
                             <LinkCard key={idx} link={test} />
                         ))}
                    </div>
                </div>
            )}
            
            {activeSection === Section.AI_TUTOR && (
                <div className="animate-fadeIn pt-4">
                    <GeminiTutor />
                </div>
            )}

            {activeSection === Section.PROFILE && (
                <Profile 
                    user={currentUser} 
                    onLogout={handleLogout} 
                    isDarkMode={isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                    onUpdateProfile={handleUpdateProfile}
                    stats={{
                        streak: streak,
                        totalTests: Object.keys(quizHistory).length,
                        averageScore: Object.keys(quizHistory).length > 0 
                            ? Math.round(Object.values(quizHistory).reduce((acc: number, curr: QuizResult) => acc + (curr.score / curr.total) * 100, 0) / Object.keys(quizHistory).length)
                            : 0,
                        league: currentLeague.name
                    }}
                />
            )}

            {/* SUBSCRIPTIONS SECTION UI (Content Only, No separate nav item to avoid layout break) */}
            {activeSection === Section.SUBSCRIPTIONS && (
                <div className="max-w-4xl mx-auto animate-fadeIn py-8">
                     <div className="text-center mb-12">
                         <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">باقات الاشتراك</h2>
                         <p className="text-xl text-gray-500 dark:text-gray-400">اختر الباقة المناسبة لطموحك</p>
                     </div>
                     
                     <div className="grid md:grid-cols-2 gap-8">
                         {/* Free Plan */}
                         <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-200 dark:border-slate-700 opacity-80 hover:opacity-100 transition-opacity">
                             <h3 className="text-2xl font-bold mb-2">الباقة الأساسية</h3>
                             <div className="text-4xl font-black mb-6">مجاناً</div>
                             <ul className="space-y-4 mb-8">
                                 <li className="flex gap-2"><Check size={20} className="text-green-500"/> اختبارات تجريبية محدودة</li>
                                 <li className="flex gap-2"><Check size={20} className="text-green-500"/> ملفات التأسيس</li>
                                 <li className="flex gap-2 text-gray-400"><X size={20}/> المساعد الذكي اللامحدود</li>
                                 <li className="flex gap-2 text-gray-400"><X size={20}/> إزالة الإعلانات</li>
                             </ul>
                             <button className="w-full py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-slate-700 text-gray-500">
                                 باقتك الحالية
                             </button>
                         </div>

                         {/* Pro Plan */}
                         <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-1 p-0.5 relative transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                             <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">الأكثر طلباً</div>
                             <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8 h-full">
                                 <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">باقة البرو</h3>
                                 <div className="flex items-end gap-1 mb-6">
                                     <div className="text-5xl font-black text-gray-900 dark:text-white">99</div>
                                     <div className="text-lg text-gray-500 font-bold mb-2">ريال / سنة</div>
                                 </div>
                                 <ul className="space-y-4 mb-8">
                                     <li className="flex gap-2 items-center font-medium"><div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full"><Check size={14} className="text-amber-600"/></div> بنك أسئلة لا محدود (5000+ سؤال)</li>
                                     <li className="flex gap-2 items-center font-medium"><div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full"><Check size={14} className="text-amber-600"/></div> مساعد ذكي (AI) يشرح لك كل سؤال</li>
                                     <li className="flex gap-2 items-center font-medium"><div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full"><Check size={14} className="text-amber-600"/></div> خطط مذاكرة مخصصة لمستواك</li>
                                     <li className="flex gap-2 items-center font-medium"><div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full"><Check size={14} className="text-amber-600"/></div> تجربة خالية من الإعلانات</li>
                                 </ul>
                                 <button className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all">
                                     اشترك الآن
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>
            )}

            {/* History Log Section inside Profile or separate */}
            {activeSection !== Section.HOME && activeSection !== Section.AI_TUTOR && activeSection !== Section.PROFILE && activeSection !== Section.SUBSCRIPTIONS && (
                <div className="mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History size={24} className="text-gray-400" />
                        سجل نشاطك الأخير
                    </h3>
                    <HistoryLog quizHistory={quizHistory} />
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-700">
                         <MistakesLog quizHistory={quizHistory} allQuestions={allQuestionsMap} />
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-3 z-50 lg:hidden flex justify-around items-center pb-safe">
            {[
                { id: Section.HOME, label: 'الرئيسية', icon: <Home size={24} /> },
                // Quantitative Removed
                { id: Section.TESTS, label: 'اختبارات', icon: <ClipboardCheck size={24} /> },
                { id: Section.VERBAL, label: 'لفظي', icon: <BookOpen size={24} /> },
                { id: Section.PROFILE, label: 'حسابي', icon: <User size={24} /> },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex flex-col items-center gap-1 transition-colors ${
                        activeSection === item.id 
                        ? 'text-amber-500' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                >
                    {item.icon}
                    <span className="text-[10px] font-bold">{item.label}</span>
                </button>
            ))}
      </nav>
    </div>
  );
};

export default App;
