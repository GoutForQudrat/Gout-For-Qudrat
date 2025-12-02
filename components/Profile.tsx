
import React, { useState } from 'react';
import { User, LogOut, Crown, Shield, Activity, Moon, Sun, Edit, Camera, Mail, Calendar, Settings, Check, X } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpdateProfile: (data: { name: string; avatar: string }) => void;
  stats: {
    streak: number;
    totalTests: number;
    averageScore: number;
    league: string;
  };
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '🚀', '🦁', '🦉', '💡', '🎯', '👑', '🌟'];

const Profile: React.FC<ProfileProps> = ({ user, onLogout, isDarkMode, toggleDarkMode, onUpdateProfile, stats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar || '👤');

  const handleSave = () => {
      onUpdateProfile({ name: editName, avatar: editAvatar });
      setIsEditing(false);
  };

  const handleCancel = () => {
      setEditName(user.name);
      setEditAvatar(user.avatar || '👤');
      setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-8">
      
      {/* User Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-slate-700 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-amber-400 to-orange-600"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 mb-4">
            <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-800 p-1.5 shadow-xl -mt-16 md:mt-0 z-10 relative group">
                <div className="w-full h-full rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-4xl overflow-hidden border-4 border-white dark:border-slate-800">
                    {isEditing ? editAvatar : (user.avatar || '👤')}
                </div>
                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs text-center p-2 backdrop-blur-sm">
                        اختر<br/>أدناه
                    </div>
                )}
            </div>
            
            <div className="text-center md:text-right flex-1 pb-2 w-full">
                {isEditing ? (
                    <div className="flex flex-col gap-2 animate-fadeIn">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">تعديل الاسم</label>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-2xl font-black bg-gray-50 dark:bg-slate-900 border-2 border-amber-500 rounded-xl px-4 py-2 text-center md:text-right focus:outline-none text-gray-900 dark:text-white w-full md:w-auto"
                        />
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{user.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center md:justify-start gap-2">
                            <Mail size={16} /> {user.email}
                        </p>
                    </>
                )}
            </div>

            <div className="flex gap-3">
                {isEditing ? (
                     <>
                        <button onClick={handleSave} className="p-3 rounded-2xl bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30" title="حفظ">
                            <Check size={24} />
                        </button>
                        <button onClick={handleCancel} className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors" title="إلغاء">
                            <X size={24} />
                        </button>
                     </>
                ) : (
                    <>
                        <button onClick={toggleDarkMode} className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-slate-600 transition-colors">
                            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                        </button>
                        <button onClick={() => setIsEditing(true)} className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-slate-600 transition-colors">
                            <Edit size={24} />
                        </button>
                    </>
                )}
            </div>
        </div>

        {/* Avatar Selection Area (Only when editing) */}
        {isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 animate-fadeIn">
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">اختر صورة شخصية جديدة:</label>
                <div className="flex flex-wrap justify-center gap-4">
                    {AVATAR_OPTIONS.map((av) => (
                        <button 
                            key={av} 
                            onClick={() => setEditAvatar(av)}
                            className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all ${editAvatar === av ? 'bg-amber-500 text-white scale-110 shadow-lg' : 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                        >
                            {av}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Account Status Badge */}
        {!isEditing && (
            <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                    <Crown size={20} className="fill-current" />
                    <div>
                        <div className="text-xs font-bold opacity-70">نوع الاشتراك</div>
                        <div className="font-bold">باقة القوت برو (مجاني)</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    <Calendar size={20} />
                    <div>
                        <div className="text-xs font-bold opacity-70">تاريخ الانضمام</div>
                        <div className="font-bold">{new Date(user.joinedDate).toLocaleDateString('ar-SA')}</div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-3">
                 <Activity size={24} />
             </div>
             <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats.streak}</div>
             <div className="text-sm font-bold text-gray-500 dark:text-gray-400">أيام متتالية</div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-3">
                 <Shield size={24} />
             </div>
             <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats.totalTests}</div>
             <div className="text-sm font-bold text-gray-500 dark:text-gray-400">اختبار منجز</div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-3">
                 <Activity size={24} />
             </div>
             <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats.averageScore}%</div>
             <div className="text-sm font-bold text-gray-500 dark:text-gray-400">معدل الدرجات</div>
         </div>
      </div>

      {/* Logout Action */}
      <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 text-center">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">منطقة الخطر</h3>
        <p className="text-red-600/70 dark:text-red-400/70 mb-6 text-sm">تسجيل الخروج سيحفظ بياناتك محلياً، تأكد من العودة قريباً!</p>
        <button 
            onClick={onLogout}
            className="px-8 py-3 bg-white dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
            <LogOut size={20} />
            تسجيل الخروج
        </button>
      </div>

    </div>
  );
};

export default Profile;
