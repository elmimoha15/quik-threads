import { motion } from 'framer-motion';
import { Upload, Link, FileText, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { validateUrl, getPlatformDisplayName } from '../../utils/urlValidator';

interface ContentSourceStepProps {
  setContentSource: (source: 'file' | 'url' | null) => void;
  file: File | null;
  url: string;
  setUrl: (url: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  removeFile: () => void;
  setCurrentStep: (step: number) => void;
}

export default function ContentSourceStep({
  setContentSource,
  file,
  url,
  setUrl,
  handleFileUpload,
  handleFileDrop,
  removeFile,
  setCurrentStep
}: ContentSourceStepProps) {
  // Validate URL in real-time
  const urlValidation = url.trim() ? validateUrl(url) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Topic Input */}
      <div className="p-8 rounded-2xl bg-white" style={{
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: '#0f1a14' }}>Content Source</h3>
            <p className="text-base" style={{ color: '#6b7280' }}>Select a content source</p>
          </div>
        </div>

        {/* Content Source - URL and File Upload Combined */}
        <div className="p-8 rounded-2xl bg-white" style={{
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
        }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#d1fae5' }}>
              <Link className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#0f1a14' }}>Content Source (Optional)</h3>
              <p className="text-sm" style={{ color: '#6b7280' }}>Add a URL or file to enhance your topic</p>
            </div>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--primary)' }} />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Automatically set content source to 'url' when URL is pasted
                  if (e.target.value.trim()) {
                    setContentSource('url');
                  } else if (!file) {
                    setContentSource(null);
                  }
                }}
                className="modern-input pl-14 text-base py-4"
                placeholder="Paste your YouTube, TikTok, Spotify, or podcast link here..."
              />
            </div>
            
            {/* URL Validation Feedback */}
            {urlValidation && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2"
              >
                {urlValidation.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                    <span className="text-sm" style={{ color: 'var(--success)' }}>
                      Valid {getPlatformDisplayName(urlValidation.platform)} URL detected
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" style={{ color: 'var(--error)' }} />
                    <span className="text-sm" style={{ color: 'var(--error)' }}>
                      {urlValidation.error}
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-6 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#e5e7eb' }}></div>
            <span className="text-base font-medium" style={{ color: '#6b7280' }}>OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#e5e7eb' }}></div>
          </div>

          {/* File Upload */}
          {file ? (
            <div className="border-2 rounded-2xl p-8 text-center" style={{
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }}>
              <div className="flex items-center justify-center gap-4 mb-4">
                <CheckCircle className="w-10 h-10" style={{ color: '#10b981' }} />
                <div className="text-left">
                  <p className="font-semibold text-base" style={{ color: '#0f1a14' }}>{file.name}</p>
                  <p className="text-sm" style={{ color: '#10b981' }}>File uploaded successfully</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="mt-3 text-sm font-medium transition flex items-center gap-2 mx-auto hover:underline"
                style={{ color: '#6b7280' }}
              >
                <AlertCircle className="w-5 h-5" />
                Remove file
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={(e) => handleFileDrop(e as any)}
              className="block border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer hover:border-emerald-400"
              style={{
                borderColor: '#e5e7eb',
                backgroundColor: '#f9fafb'
              }}
            >
              <input
                type="file"
                onChange={(e) => {
                  handleFileUpload(e);
                  setContentSource('file');
                }}
                accept="audio/*,video/*"
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
              <p className="text-base font-medium mb-2" style={{ color: '#0f1a14' }}>Drop files here or click to browse</p>
              <p className="text-sm" style={{ color: '#6b7280' }}>MP3, MP4, MOV up to 500MB</p>
            </label>
          )}
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={() => setCurrentStep(3)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-bold text-base transition text-white"
          style={{
            backgroundColor: '#10b981',
            boxShadow: '0 4px 6px -1px rgb(16 185 129 / 0.3), 0 2px 4px -2px rgb(16 185 129 / 0.2)'
          }}
        >
          Continue to Customization
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.div>
  );
}
