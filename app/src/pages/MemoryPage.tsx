import { useEffect, useState } from 'react';
import { FileText, Folder, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchMemoryFile, fetchMemoryIndex, type MemoryFileEntry } from '@/lib/openclaw-api';

export function MemoryPage() {
  const [files, setFiles] = useState<MemoryFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadIndex = async () => {
    setLoading(true);
    const result = await fetchMemoryIndex();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setFiles([]);
      return;
    }

    const markdownFiles = result.data.files.filter((file) => file.path.endsWith('.md') && !file.isDirectory);
    setFiles(markdownFiles);
    setError(null);
    setSelectedPath((prev) => prev ?? markdownFiles[0]?.path ?? null);
  };

  useEffect(() => {
    void loadIndex();
  }, []);

  useEffect(() => {
    if (!selectedPath) return;

    void (async () => {
      const result = await fetchMemoryFile(selectedPath);
      if (!result.ok) {
        setError(result.error);
        setContent('');
        return;
      }
      setContent(result.data.content);
      setError(null);
    })();
  }, [selectedPath]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Memory</span> Explorer</h1>
          <p className="text-xs text-slate-400">Read-only memory and markdown files from runtime</p>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => void loadIndex()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800/50 p-2 overflow-auto">
          {files.map((file) => (
            <button key={file.path} onClick={() => setSelectedPath(file.path)} className={`w-full text-left p-3 rounded-lg mb-1 ${selectedPath === file.path ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-900/40'}`}>
              <div className="flex items-center gap-2 text-slate-200"><FileText className="w-4 h-4 text-cyan-400" />{file.name}</div>
              <p className="text-xs text-slate-500 mt-1">{file.path}</p>
            </button>
          ))}
          {!files.length && !loading && <div className="p-3 text-sm text-slate-500 flex items-center gap-2"><Folder className="w-4 h-4" />No markdown files found</div>}
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {error ? <p className="text-red-400 text-sm">{error}</p> : <pre className="whitespace-pre-wrap text-sm text-slate-200">{content || 'Select a file to view content.'}</pre>}
        </div>
      </div>
    </div>
  );
}

export default MemoryPage;
