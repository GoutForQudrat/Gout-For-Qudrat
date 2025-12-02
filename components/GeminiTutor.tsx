
import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const GeminiTutor: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      // API Key must be obtained exclusively from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const model = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
            systemInstruction: "أنت (القوت)، معلم خبير وقوي في اختبار القدرات العامة السعودي. ساعد الطالب في فهم السؤال وشرح طريقة الحل بوضوح وبساطة باللهجة السعودية. ركز على استراتيجيات الحل السريع والذكاء. لا تحل واجبات مدرسية، بل اشرح المفاهيم.",
        }
      });

      setResponse(model.text || "عذراً، لم أتمكن من الرد حالياً.");
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء الاتصال بالمساعد الذكي. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl border border-white/50 dark:border-slate-700 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-secondary dark:bg-amber-600 flex items-center justify-center text-white shadow-lg">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المساعد الذكي (القوت)</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">اسألني أي سؤال في الكمي أو اللفظي</p>
        </div>
      </div>

      <form onSubmit={handleAsk} className="relative mb-6">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="اكتب سؤالك هنا... مثلاً: كيف أحسب نسبة الربح؟"
          className="w-full p-4 pl-14 h-32 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-amber-500 dark:focus:border-amber-500 focus:ring-0 outline-none resize-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            className="absolute left-4 bottom-4 p-2 bg-secondary dark:bg-amber-600 text-white rounded-xl hover:bg-black dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2 mb-4 animate-fadeIn border border-red-100 dark:border-red-900/50">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 animate-fadeIn">
            <h3 className="font-bold text-gray-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600 dark:text-amber-400"/>
                الإجابة المقترحة:
            </h3>
            <div className="prose prose-amber dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {response}
            </div>
        </div>
      )}
    </div>
  );
};

export default GeminiTutor;
