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
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p>Loading data preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl shadow-sm border border-red-100 flex flex-col items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ring-1 ring-black/5">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-800">Data Preview</h3>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">Showing first 20 rows</span>
      </div>
      <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-300">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3 font-semibold tracking-wider text-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="bg-white hover:bg-blue-50/50 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 text-gray-600">
                    {row[col] !== null ? (
                      <span className={typeof row[col] === 'number' ? 'font-mono text-blue-700' : ''}>
                        {String(row[col])}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic bg-gray-100 px-1 rounded text-xs">null</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 italic">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
