import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, File, Download, Trash2, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

export const StudentFiles = () => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectFiles();
  }, []);

  const fetchProjectFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/project');
      const p = res.data.data.project;
      setProject(p);
      setSupervisor(res.data.data.user?.supervisor);
      setFiles(p?.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !project) return;

    setMessage(null);
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile); // Append single file key to prevent duplicate uploads

    try {
      const res = await api.post(`/student/upload/${project._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message || 'File uploaded successfully!');
      setSelectedFile(null);
      fetchProjectFiles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Upload qualification: Proposal must be approved/assigned AND student must have an assigned supervisor
  const isApproved = project && (project.status === 'approved' || project.status === 'assigned');
  const hasSupervisor = !!supervisor;
  const canUploadFiles = isApproved && hasSupervisor && project?.status !== 'completed';

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Deliverables Repository</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Project Documents & Files</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upload SRS documents, system architecture diagrams, and source code archives.</p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lock Notice or Upload Form */}
      {!canUploadFiles ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <strong className="block text-amber-800 dark:text-amber-200 font-bold">Document Upload Locked</strong>
            You can only upload deliverable documents once your project proposal is <b>APPROVED</b> and you have an <b>ASSIGNED SUPERVISOR</b>.
            {!isApproved && <span> Current status: <b className="uppercase text-amber-600 dark:text-amber-400">{project?.status || 'No Proposal'}</b>.</span>}
            {!hasSupervisor && <span> No supervisor assigned yet.</span>}
          </div>
        </div>
      ) : (
        <form onSubmit={handleFileUpload} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Upload Project Deliverable
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
            />
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0 shadow-sm"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      )}

      {/* Files Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Uploaded Documents ({files.length})</h3>

        {files.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No project files uploaded yet.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {files.map((file, idx) => {
              const fileUrl = file.fileUrl || file.url || file.path;
              const fileName = file.originalName || file.filename || file.name || `Document #${idx + 1}`;

              return (
                <div key={file._id || idx} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <File className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-200">{fileName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Uploaded'}</p>
                    </div>
                  </div>

                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
                      title="Click to download file"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
