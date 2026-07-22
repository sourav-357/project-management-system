import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UploadCloud, File, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;
    if (!project) {
      setError('You must create a project proposal first before uploading files');
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Project Documents & Deliverables</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload project SRS reports, thesis PDFs, source code ZIPs, and presentations.</p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Upload New Document (Max 10MB per file)</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            multiple
            onChange={(e) => setSelectedFiles(e.target.files)}
            className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
          />
          <button
            type="submit"
            disabled={uploading || !selectedFiles}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950 disabled:opacity-40 flex items-center gap-2"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> Upload Documents
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded Files Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Uploaded Documents Library</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {!project || !project.files || project.files.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 dark:text-slate-500 text-center">No documents uploaded yet</p>
          ) : (
            project.files.map((file) => (
              <div key={file._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <File className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{file.originalName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Download
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
