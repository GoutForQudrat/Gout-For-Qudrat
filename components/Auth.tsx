
import React, { useState } from 'react';
import { User, Lock, Mail, ChevronLeft, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        const usersDb = JSON.parse(localStorage.getItem('app_users') || '[]');

        if (isLogin) {
          // LOGIN LOGIC
          const user = usersDb.find((u: UserType) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
          if (user) {
            // Remove password before passing up
            const safeUser = { ...user };
            delete safeUser.password;
            localStorage.setItem('current_user', JSON.stringify(safeUser));
            onLogin(safeUser);
          } else {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }
        } else {
          // REGISTRATION LOGIC
          if (!name.trim()) throw new Error('الاسم مطلوب');
          if (usersDb.find((u: UserType) => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('البريد الإلكتروني مستخدم بالفعل');
          }

          const newUser: UserType = {
            id: Date.now().toString(),
            name,
            email,
            password, // Storing purely for simulation purposes
            joinedDate: Date.now(),
            avatar: ['👨‍🎓', '👩‍🎓', '🧑‍💻', '🚀', '🦁'][Math.floor(Math.random() * 5)]
          };

          usersDb.push(newUser);
          localStorage.setItem('app_users', JSON.stringify(usersDb));
          
          setSuccess('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
          setTimeout(() => {
             const safeUser = { ...newUser };
             delete safeUser.password;
             localStorage.setItem('current_user', JSON.stringify(safeUser));
             onLogin(safeUser);
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع');
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-12 transition-colors duration-500" dir="rtl">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-300/20 dark:bg-amber-900/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl text-white shadow-xl mb-6 transform rotate-3">
                <span className="font-black text-4xl">ق</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                القوت <span className="text-amber-500">للقدرات</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
                {isLogin ? 'مرحباً بعودتك يا بطل!' : 'انضم إلينا وابدأ رحلة التفوق'}
            </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-slate-700 backdrop-blur-xl">
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              تسجيل دخول
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1">الاسم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="اسمك الكريم"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium animate-fadeIn">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium animate-fadeIn">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-primary hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'دخول' : 'إنشاء حساب'}
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة القوت.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
