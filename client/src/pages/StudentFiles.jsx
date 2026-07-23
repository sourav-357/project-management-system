import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UploadCloud, File, Download, AlertCircle, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export const StudentFiles = () => {
  const [project, setProject] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      setFetching(true);
      const res = await api.get('/student/project');
      setProject(res.data.data.project);
    } catch (err) {
      console.error('Error fetching project files:', err);
    } finally {
      setFetching(false);
    }
  };

  const isCompleted = project?.status === 'completed';

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;
    if (!project) {
      setError('You must create a project proposal first before uploading files');
      return;
    }

    if (isCompleted) {
      setError('This project is completed and finalized into history. File uploads are disabled.');
      return;
    }

    setUploading(true);
    setMsg('');
    setError('');

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      const res = await api.post(`/student/upload/${project._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(res.data.message);
      setSelectedFiles(null);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      if (file.fileUrl && (file.fileUrl.startsWith('http://') || file.fileUrl.startsWith('https://'))) {
        window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const res = await api.get(`/student/download/${project._id}/${file._id}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: file.fileType || 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.originalName || 'project-document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert(err.response?.data?.message || 'Failed to download file.');
    }
  };

  if (fetching) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Documents Library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <UploadCloud className="w-3.5 h-3.5 text-indigo-300" /> Document Repository
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Project Documents & Deliverables</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Upload and archive SRS documentation, architecture diagrams, research papers, and source code packages.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {isCompleted && (
        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-2.5 shadow-sm">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span><strong>Project Finalized:</strong> This project is completed and locked into read-only history. Existing files can be downloaded below.</span>
        </div>
      )}

      {/* Upload Zone */}
      {!isCompleted && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Upload New Document (Max 10MB per file)</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="file"
              multiple
              disabled={isCompleted}
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-3 file:px-5 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-all cursor-pointer"
            />
            <button
              type="submit"
              disabled={uploading || !selectedFiles || isCompleted}
              className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-40 flex items-center gap-2"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Upload Selected Documents
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Uploaded Files Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Uploaded Documents Library</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {!project || !project.files || project.files.length === 0 ? (
            <p className="p-8 text-xs text-slate-400 text-center font-medium">No project documents uploaded yet</p>
          ) : (
            project.files.map((file) => (
              <div key={file._id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                    <File className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{file.originalName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Download
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
