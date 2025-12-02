
import React, { useState, useMemo } from 'react';
import { Clock, Calendar, Search, Filter, Award, BarChart2 } from 'lucide-react';
import { QuizResult } from '../types';
import { TEST_TITLES } from '../constants';

interface HistoryLogProps {
  quizHistory: { [testId: number]: QuizResult };
}

const HistoryLog: React.FC<HistoryLogProps> = ({ quizHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc');

  const historyItems = useMemo(() => {
    return Object.entries(quizHistory).map(([testId, result]) => ({
      testId: parseInt(testId),
      result,
      title: TEST_TITLES[parseInt(testId)] || `اختبار رقم ${testId}`,
    }));
  }, [quizHistory]);

  const filteredItems = useMemo(() => {
    let items = historyItems.filter(item => 
      item.title.includes(searchTerm) || 
      item.testId.toString().includes(searchTerm)
    );

    switch (sortOption) {
      case 'date-desc':
        items.sort((a, b) => (b.result.timestamp || 0) - (a.result.timestamp || 0));
        break;
      case 'date-asc':
        items.sort((a, b) => (a.result.timestamp || 0) - (b.result.timestamp || 0));
        break;
      case 'score-desc':
        items.sort((a, b) => (b.result.score / b.result.total) - (a.result.score / a.result.total));
        break;
      case 'score-asc':
        items.sort((a, b) => (a.result.score / a.result.total) - (b.result.score / b.result.total));
        break;
    }

    return items;
  }, [historyItems, searchTerm, sortOption]);

  const totalTests = historyItems.length;
  const averageScore = totalTests > 0 
    ? Math.round(historyItems.reduce((acc, item) => acc + (item.result.score / item.result.total) * 100, 0) / totalTests)
    : 0;

  if (totalTests === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
          <BarChart2 size={40} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا يوجد سجل اختبارات</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          لم تقم بإكمال أي اختبارات تفاعلية بعد. ابدأ الاختبارات وسجل تقدمك هنا!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Award size={32} />
            </div>
            <div>
              <div className="text-sm font-medium opacity-90">معدل الدرجات</div>
              <div className="text-3xl font-black">{averageScore}%</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <BarChart2 size={32} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">عدد الاختبارات المنجزة</div>
              <div className="text-3xl font-black text-gray-900 dark:text-white">{totalTests}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن اختبار..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all dark:text-white"
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="w-full appearance-none pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white cursor-pointer"
          >
            <option value="date-desc">الأحدث أولاً</option>
            <option value="date-asc">الأقدم أولاً</option>
            <option value="score-desc">الأعلى درجة</option>
            <option value="score-asc">الأقل درجة</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="grid gap-4">
        {filteredItems.map((item) => {
          const scorePercentage = Math.round((item.result.score / item.result.total) * 100);
          const date = item.result.timestamp ? new Date(item.result.timestamp).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير مسجل';
          
          return (
            <div key={item.testId} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Info */}
                <div className="flex-grow">
                   <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">
                     {item.title}
                   </h4>
                   <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                     <span className="flex items-center gap-1">
                       <Calendar size={14} />
                       {date}
                     </span>
                     <span className="flex items-center gap-1">
                       <Clock size={14} />
                       {Math.floor(item.result.timeSpent / 60)} دقيقة
                     </span>
                   </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-gray-400 uppercase">الدرجة النهائية</div>
                    <div className={`text-xl font-bold ${scorePercentage >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                       {item.result.score} / {item.result.total}
                    </div>
                  </div>
                  
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-black border-4 shadow-sm ${
                      scorePercentage >= 80 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600' 
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600'
                  }`}>
                      {scorePercentage}%
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryLog;
