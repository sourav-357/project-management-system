import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { MessageSquare, ThumbsUp, ThumbsDown, Info } from 'lucide-react';

export const StudentFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const projRes = await api.get('/student/project');
      if (projRes.data.data.project) {
        const fbRes = await api.get(`/student/feedback/${projRes.data.data.project._id}`);
        setFeedback(fbRes.data.data.feedback || []);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Supervisor Feedback History</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review constructive feedback and evaluation remarks from your supervisor.</p>
      </div>

      <div className="space-y-4">
        {feedback.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No supervisor feedback recorded yet.
          </div>
        ) : (
          feedback.map((fb, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fb.type === 'positive' ? (
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <ThumbsUp className="w-4 h-4" />
                    </div>
                  ) : fb.type === 'negative' ? (
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
                      <ThumbsDown className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{fb.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">{fb.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
