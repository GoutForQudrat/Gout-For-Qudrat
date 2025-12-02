
import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, XCircle, Clock, RotateCcw, Award, ChevronRight, ChevronLeft, HelpCircle, AlertCircle, List, Save, Flag, Lightbulb, Quote, Sparkles, Loader2, Grid, PenTool, StickyNote } from 'lucide-react';
import { Question, QuizResult } from '../types';
import { GoogleGenAI } from '@google/genai';

interface QuizEngineProps {
  questions: Question[];
  title: string;
  testId: number;
  onExit: () => void;
  onComplete: (result: QuizResult) => void;
}

// Simple Audio Synthesizer to avoid external assets
const playSound = (type: 'correct' | 'incorrect' | 'finish') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    if (type === 'correct') {
      // Pleasant high-pitched ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'incorrect') {
      // Low-pitched error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'finish') {
      // Victory Arpeggio
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.type = 'triangle';
         osc.frequency.value = freq;
         gain.gain.setValueAtTime(0.1, now + i * 0.1);
         gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
         osc.start(now + i * 0.1);
         osc.stop(now + i * 0.1 + 0.4);
      });
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const QuizEngine: React.FC<QuizEngineProps> = ({ questions, title, testId, onExit, onComplete }) => {
  // Settings State
  const [hasStarted, setHasStarted] = useState(false);
  const [instantFeedback, setInstantFeedback] = useState(true); // Default to true for better learning

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [notes, setNotes] = useState<{ [key: number]: string }>({}); // Scratchpad notes
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // AI State
  const [aiHelp, setAiHelp] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fixed Duration
  const TEST_DURATION_MINUTES = 80;
  const savedProgressKey = `quiz_progress_${testId}`;

  const timerRef = useRef<number | null>(null);

  const hasSavedProgress = typeof window !== 'undefined' && localStorage.getItem(savedProgressKey) !== null;

  useEffect(() => {
    if (hasStarted && timeLeft > 0 && !isFinished) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, timeLeft, isFinished]);

  // Reset AI help when question changes
  useEffect(() => {
    setAiHelp('');
    // Check if current question has notes to auto-open or keep state?
    // User preference: keep state as is to allow toggling
  }, [currentQuestionIndex]);

  const startQuiz = () => {
    localStorage.removeItem(savedProgressKey); // Clear previous progress if starting new
    setTimeLeft(TEST_DURATION_MINUTES * 60);
    setHasStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resumeQuiz = () => {
    const saved = localStorage.getItem(savedProgressKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedAnswers(parsed.answers);
      setCurrentQuestionIndex(parsed.currentQuestionIndex);
      setTimeLeft(parsed.timeLeft);
      if (parsed.notes) setNotes(parsed.notes);
      setHasStarted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveAndExit = () => {
    const progress = {
      answers: selectedAnswers,
      currentQuestionIndex,
      timeLeft,
      notes
    };
    localStorage.setItem(savedProgressKey, JSON.stringify(progress));
    onExit();
  };

  const finishQuiz = () => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    localStorage.removeItem(savedProgressKey); // Clear progress on finish
    
    // Play celebratory sound
    playSound('finish');

    const score = calculateScore();
    const result: QuizResult = {
      score,
      total: questions.length,
      answers: selectedAnswers,
      timeSpent: (TEST_DURATION_MINUTES * 60) - timeLeft
    };
    onComplete(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isFinished) return;
    if (instantFeedback && selectedAnswers[currentQuestionIndex] !== undefined) return;

    // Play immediate feedback sound if instant feedback is on
    if (instantFeedback) {
        const isCorrect = questions[currentQuestionIndex].correctAnswerIndex === optionIndex;
        playSound(isCorrect ? 'correct' : 'incorrect');
    }

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleAskAi = async () => {
    if (isAiLoading || aiHelp) return;
    setIsAiLoading(true);
    
    try {
        const currentQuestion = questions[currentQuestionIndex];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `السؤال: ${currentQuestion.text}\nالخيارات: ${currentQuestion.options.join(' - ')}`,
            config: {
                systemInstruction: "أنت معلم خبير في القدرات العامة (القوت). اشرح السؤال للطالب ووضح العلاقة المنطقية أو طريقة الحل بأسلوب مشجع ومبسط باللهجة السعودية. لا تعط الإجابة النهائية مباشرة، بل قدّم تلميحاً قوياً يساعده على الاستنتاج.",
            }
        });
        
        setAiHelp(model.text || "عذراً، لا يمكنني المساعدة حالياً.");
    } catch (error) {
        console.error(error);
        setAiHelp("حدث خطأ في الاتصال بالمساعد الذكي.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });
    return score;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDER: START SCREEN ---
  if (!hasStarted) {
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-slate-700 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 text-center mb-12">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20 mx-auto mb-6 transform rotate-3">
                    <List size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">{title}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold">
                    <span>عدد الأسئلة: {questions.length}</span>
                    <span>•</span>
                    <span>النوع: تناظر لفظي</span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
                {/* Time Setting Card */}
                <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-600 flex flex-col items-center text-center group hover:border-amber-400 transition-colors">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">مدة الاختبار</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">الوقت المخصص للاختبار</p>
                    <div className="px-6 py-2 bg-white dark:bg-slate-800 rounded-xl font-black text-xl text-gray-900 dark:text-white shadow-sm w-full border border-gray-200 dark:border-slate-600">
                        {TEST_DURATION_MINUTES} دقيقة
                    </div>
                    <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ لا يمكن تغيير الوقت</p>
                </div>

                {/* Feedback Setting Card */}
                <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-600 flex flex-col items-center text-center group hover:border-green-400 transition-colors cursor-pointer" onClick={() => setInstantFeedback(!instantFeedback)}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4 transition-colors ${instantFeedback ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400'}`}>
                        {instantFeedback ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">التصحيح الفوري</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">إظهار الإجابة والعلاقة مباشرة</p>
                    
                    <div className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${instantFeedback ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${instantFeedback ? 'right-1' : 'right-9'}`} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <button onClick={onExit} className="px-8 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                    العودة للقائمة
                </button>
                
                {hasSavedProgress ? (
                  <>
                     <button onClick={startQuiz} className="flex-1 py-4 rounded-2xl font-bold text-gray-700 dark:text-white bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 transition-all flex items-center justify-center gap-3 text-lg">
                        <RotateCcw size={20} />
                        بدء جديد
                    </button>
                    <button onClick={resumeQuiz} className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl shadow-green-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                        <Play size={24} fill="currentColor" />
                        استكمال الاختبار المحفوظ
                    </button>
                  </>
                ) : (
                  <button onClick={startQuiz} className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-amber-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                      <Play size={24} fill="currentColor" />
                      ابدأ الاختبار الآن
                  </button>
                )}
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER: RESULTS SCREEN ---
  if (isFinished) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-xl border border-gray-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
            
            <div className="w-28 h-28 mx-auto bg-gradient-to-b from-amber-100 to-orange-100 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center text-amber-500 mb-6 shadow-inner border-4 border-white dark:border-slate-600">
                <Award size={56} />
            </div>
            
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">نتيجة الاختبار</h2>
            <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-8 ${percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {percentage >= 80 ? 'مستوى ممتاز! 🌟' : 'حاول مرة أخرى لتحسين مستواك 💪'}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="p-5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-600">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">الدرجة</div>
                    <div className="text-4xl font-black text-primary">{percentage}%</div>
                </div>
                <div className="p-5 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">صحيحة</div>
                    <div className="text-4xl font-black text-green-600 dark:text-green-500">{score}</div>
                </div>
                <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">خاطئة</div>
                    <div className="text-4xl font-black text-red-600 dark:text-red-500">{questions.length - score}</div>
                </div>
                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">الوقت</div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-500 mt-1">
                        {Math.floor(((TEST_DURATION_MINUTES * 60) - timeLeft) / 60)}د
                    </div>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <button onClick={onExit} className="px-8 py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    العودة للقائمة
                </button>
                <button onClick={() => {
                    setIsFinished(false);
                    setHasStarted(false);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setTimeLeft(TEST_DURATION_MINUTES * 60);
                }} className="px-8 py-3 rounded-xl font-bold bg-primary text-white hover:bg-amber-600 shadow-lg transition-colors flex items-center gap-2">
                    <RotateCcw size={20} />
                    إعادة الاختبار
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER: RUNNING QUIZ ---
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-7xl mx-auto px-2">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-24 z-20">
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold font-mono text-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl">
               <Clock size={20} />
               {formatTime(timeLeft)}
             </div>
             <button 
              onClick={saveAndExit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Save size={18} />
              <span className="hidden md:inline">خروج</span>
            </button>
         </div>

        <div className="flex items-center gap-3">
             <button 
                onClick={handleAskAi}
                disabled={isAiLoading || !!aiHelp}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
             >
                {isAiLoading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                مساعدة الذكاء الاصطناعي
            </button>
            <button
                onClick={() => setIsNoteOpen(!isNoteOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    isNoteOpen 
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400' 
                    : 'bg-white border-gray-200 text-gray-600 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'
                }`}
            >
                <PenTool size={18} />
                مسودة
            </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* MAIN QUESTION CARD (First in Grid for Desktop/Mobile, but order tweaked via classes if needed) */}
        {/* Note: In RTL, col-span-9 comes first (Right), col-span-3 comes second (Left) */}
        {/* We swap the divs so the sidebar is on the visual LEFT (which is the END of the row in RTL) */}
        
        <div className="lg:col-span-9 bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-10 shadow-xl border border-gray-100 dark:border-slate-700 min-h-[500px] flex flex-col relative overflow-hidden order-1">
            
            {/* Progress Bar */}
            <div className="w-full mb-8">
                <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 px-1">
                    <span className="flex items-center gap-1"><Play size={10} fill="currentColor" /> البداية</span>
                    <span className="text-primary">{Math.round(progressPercentage)}% منجز</span>
                    <span className="flex items-center gap-1">النهاية <Flag size={10} fill="currentColor"/></span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700/50 h-3 rounded-full overflow-hidden relative shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-amber-300 via-amber-500 to-orange-600 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${progressPercentage}%` }}
                    >
                        {progressPercentage > 0 && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)] translate-x-1/2"></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center mb-8">
                
                {/* Scratchpad (Notes) */}
                {isNoteOpen && (
                    <div className="mb-8 animate-slideUp">
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-1 rounded-2xl border-2 border-yellow-200 dark:border-yellow-900/50 shadow-sm transform -rotate-1">
                            <div className="bg-yellow-50 dark:bg-slate-800 rounded-xl p-4">
                                <div className="flex items-center justify-between text-yellow-600 dark:text-yellow-500 font-bold mb-2 text-sm border-b border-yellow-200 dark:border-yellow-900/50 pb-2">
                                    <div className="flex items-center gap-2">
                                        <StickyNote size={16} />
                                        مسودة السؤال {currentQuestionIndex + 1}
                                    </div>
                                    <span className="text-xs opacity-70">يتم الحفظ تلقائياً</span>
                                </div>
                                <textarea
                                    value={notes[currentQuestionIndex] || ''}
                                    onChange={(e) => setNotes({...notes, [currentQuestionIndex]: e.target.value})}
                                    placeholder="اكتب ملاحظاتك، حساباتك، أو استنتاجاتك هنا..."
                                    className="w-full h-32 bg-transparent border-none focus:ring-0 resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400 text-lg leading-relaxed font-handwriting"
                                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Help Section */}
                {aiHelp && (
                    <div className="mb-8 bg-blue-50 dark:bg-slate-900/50 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 animate-fadeIn relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500"></div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-500">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">تلميح من مساعد القوت الذكي</h4>
                                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{aiHelp}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Rendering */}
                {currentQuestion.image && (
                    <div className="mb-8 flex justify-center animate-fadeIn">
                        <img 
                            src={currentQuestion.image} 
                            alt="Question Diagram" 
                            className="max-h-64 md:max-h-80 w-auto rounded-2xl border border-gray-200 dark:border-slate-600 shadow-md object-contain bg-white"
                        />
                    </div>
                )}

                {/* Testimonial Style Question */}
                <div className="relative mb-12 px-8 py-6">
                    <Quote className="absolute top-0 right-0 text-amber-200 dark:text-amber-900/30 transform -translate-y-1/2 translate-x-1/2" size={80} fill="currentColor" />
                    <Quote className="absolute bottom-0 left-0 text-amber-200 dark:text-amber-900/30 transform translate-y-1/2 -translate-x-1/2 rotate-180" size={80} fill="currentColor" />
                    
                    <h3 className="relative z-10 text-4xl md:text-5xl font-black text-gray-900 dark:text-white text-center leading-relaxed tracking-tight font-serif italic">
                        {currentQuestion.text}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options.map((option, idx) => {
                    if (!option) return null;

                    const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                    const isCorrect = currentQuestion.correctAnswerIndex === idx;
                    
                    let buttonClass = "border-2 border-gray-100 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700/50";
                    let icon = <div className={`w-6 h-6 rounded-full border-2 transition-colors ${isSelected ? 'border-current bg-current' : 'border-gray-300 dark:border-gray-500'}`} >{isSelected && <div className="w-full h-full transform scale-50 rounded-full bg-white" />}</div>;
                    
                    if (isSelected) {
                        buttonClass = "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500";
                    }

                    // Instant Feedback Logic
                    if (instantFeedback && isAnswered) {
                        if (isCorrect) {
                            buttonClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-500";
                            icon = <CheckCircle size={24} className="text-green-500" />;
                        } else if (isSelected) {
                            buttonClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-1 ring-red-500";
                            icon = <XCircle size={24} className="text-red-500" />;
                        } else {
                            buttonClass = "opacity-50 border-gray-100 dark:border-slate-700";
                        }
                    }

                    return (
                    <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={instantFeedback && isAnswered}
                        className={`p-8 rounded-2xl text-2xl font-bold transition-all duration-200 text-right flex items-center justify-between group ${buttonClass} text-gray-700 dark:text-gray-200 shadow-sm`}
                    >
                        <span>{option}</span>
                        <div className="flex-shrink-0 ml-2">{icon}</div>
                    </button>
                    );
                })}
                </div>
                
                {/* Mobile AI Button */}
                <button 
                    onClick={handleAskAi}
                    disabled={isAiLoading || !!aiHelp}
                    className="mt-6 md:hidden w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transition-all disabled:opacity-50"
                >
                    {isAiLoading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                    مساعدة الذكاء الاصطناعي
                </button>
            </div>
            
            {/* Relationship / Explanation Box */}
            {instantFeedback && isAnswered && (
                <div className="mt-8 animate-fadeIn">
                    {(() => {
                        const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswerIndex;
                        return (
                            <div className={`border-r-4 p-6 rounded-2xl flex items-start gap-4 shadow-sm transition-colors ${
                                isCorrect 
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-500' 
                                : 'bg-red-50 dark:bg-red-900/10 border-red-500'
                            }`}>
                                <div className={`p-3 rounded-xl flex-shrink-0 ${
                                    isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                }`}>
                                    {isCorrect ? <CheckCircle size={28} /> : <XCircle size={28} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-lg mb-2 ${
                                        isCorrect ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100'
                                    }`}>
                                        {isCorrect ? 'إجابة صحيحة! أحسنت' : 'إجابة خاطئة، حظاً أوفر'}
                                    </h4>
                                    
                                    <div className="bg-white/60 dark:bg-slate-800/50 rounded-xl p-4 mt-2 border border-gray-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400 text-sm font-bold">
                                            <Lightbulb size={16} className="text-amber-500" />
                                            العلاقة والتوضيح:
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed font-medium">
                                            {currentQuestion.explanation || "العلاقة غير محددة، حاول استنتاجها."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100 dark:border-slate-700">
            <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
                <ChevronRight size={20} />
                السابق
            </button>

            {!isLastQuestion ? (
                <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-primary text-white hover:bg-amber-600 shadow-lg hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5"
                >
                التالي
                <ChevronLeft size={20} />
                </button>
            ) : (
                <button
                onClick={finishQuiz}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5"
                >
                إنهاء الاختبار
                <CheckCircle size={20} />
                </button>
            )}
            </div>
        </div>

        {/* SIDEBAR NAVIGATION (Moved to Visual Left in RTL, meaning second child in flex/grid order) */}
        <div className="lg:col-span-3 lg:sticky lg:top-40 order-2">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl border border-gray-100 dark:border-slate-700 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-bold">
                    <Grid size={20} className="text-primary"/>
                    <span>خريطة الأسئلة</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, idx) => {
                        const isCurrent = currentQuestionIndex === idx;
                        const isDone = selectedAnswers[idx] !== undefined;
                        const hasNote = notes[idx] && notes[idx].trim().length > 0;
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-10 h-10 rounded-full font-bold text-xs transition-all flex items-center justify-center border-2 relative ${
                                    isCurrent 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 z-10 scale-110 shadow-md' 
                                        : isDone 
                                            ? 'border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'border-transparent bg-gray-50 text-gray-500 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                                }`}
                            >
                                {idx + 1}
                                {isDone && !isCurrent && <CheckCircle size={8} className="absolute top-0 right-0 opacity-50" />}
                                {hasNote && (
                                    <div className="absolute bottom-0 left-0">
                                         <StickyNote size={8} className="text-yellow-500 fill-yellow-500" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-6 space-y-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-slate-700 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500"></div>
                        <span>السؤال الحالي</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-100"></div>
                        <span>تمت الإجابة</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <StickyNote size={12} className="text-yellow-500 fill-yellow-500" />
                        <span>يوجد ملاحظة</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default QuizEngine;
