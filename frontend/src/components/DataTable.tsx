import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Database, AlertTriangle } from 'lucide-react';

interface DataTableProps {
  columns: string[];
}

const DataTable: React.FC<DataTableProps> = ({ columns }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/preview");
        if (response.data.status === "success") {
          setData(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || "Failed to fetch data preview");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreview();
  }, [columns]);

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200/80 flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div>
        <p className="text-[14px]">Loading data preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-red-100 flex flex-col items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <p className="text-[14px] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200/80 overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-zinc-400" />
          <h3 className="text-[14px] font-semibold text-zinc-900 tracking-tight">Data Preview</h3>
        </div>
        <span className="text-[12px] font-medium text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200/60">First 20 rows</span>
      </div>
      <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-200">
        <table className="w-full text-[13px] text-left whitespace-nowrap">
          <thead className="text-zinc-500 bg-white sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-5 py-3 font-medium tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100/80">
            {data.map((row, i) => (
              <tr key={i} className="bg-white hover:bg-zinc-50/80 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-5 py-3 text-zinc-600">
                    {row[col] !== null ? (
                      <span className={typeof row[col] === 'number' ? 'font-mono text-zinc-900' : ''}>
                        {String(row[col])}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic bg-zinc-50 px-1.5 py-0.5 rounded text-[11px] border border-zinc-100">null</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-zinc-500 italic text-[13px]">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
