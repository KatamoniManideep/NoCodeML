import React, { useState, useEffect } from 'react';

interface PreprocessingFormProps {
  onPreprocessSuccess: (data: any) => void;
}

const PreprocessingForm: React.FC<PreprocessingFormProps> = ({ onPreprocessSuccess }) => {
  const [numCols, setNumCols] = useState<string[]>([]);
  const [catCols, setCatCols] = useState<string[]>([]);
  
  const [missingStrategy, setMissingStrategy] = useState<string>('drop');
  const [scaleMethod, setScaleMethod] = useState<string>('Standard');
  const [selectedEncode, setSelectedEncode] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/columns')
      .then(res => res.json())
      .then(data => {
        setNumCols(data.numerical_columns || []);
        setCatCols(data.categorical_columns || []);
      })
      .catch(err => console.error("Error fetching columns", err));
  }, []);

  const handleCheckbox = (col: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(col)) {
      setList(list.filter(c => c !== col));
    } else {
      setList([...list, col]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missing_strategy: missingStrategy,
          encode_columns: selectedEncode,
          scale_columns: selectedScale,
          scale_method: scaleMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to preprocess data');
      }

      onPreprocessSuccess({
        filename: 'active_dataset.parquet',
        rows: data.rows,
        columns: data.columns,
        column_names: data.column_names
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200/80">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Data Preprocessing</h2>
        <p className="text-[13px] text-zinc-500 mt-1">Clean and prepare your dataset for modeling</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-[13px] font-medium border border-red-100/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[13px] font-medium text-zinc-700 mb-2">Missing Values Strategy</label>
          <select 
            value={missingStrategy} 
            onChange={e => setMissingStrategy(e.target.value)}
            className="w-full sm:w-64 bg-zinc-50 border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2.5 transition-all outline-none"
          >
            <option value="drop">Drop Rows with Nulls</option>
            <option value="mean">Impute with Mean (Numeric)</option>
            <option value="median">Impute with Median (Numeric)</option>
          </select>
        </div>

        {catCols.length > 0 && (
          <div>
            <label className="block text-[13px] font-medium text-zinc-700 mb-2">Encode Categorical Columns</label>
            <div className="flex flex-wrap gap-2.5">
              {catCols.map(col => (
                <label key={col} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${selectedEncode.includes(col) ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedEncode.includes(col)}
                    onChange={() => handleCheckbox(col, selectedEncode, setSelectedEncode)}
                    className="hidden"
                  />
                  <span className="text-[13px] font-medium">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {numCols.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 max-w-2xl gap-3">
              <label className="block text-[13px] font-medium text-zinc-700">Scale Numeric Columns</label>
              <select 
                value={scaleMethod} 
                onChange={e => setScaleMethod(e.target.value)}
                className="w-full sm:w-40 bg-zinc-50 border border-zinc-200 text-zinc-900 text-[13px] rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 block p-2 transition-all outline-none"
              >
                <option value="Standard">StandardScaler</option>
                <option value="MinMax">MinMaxScaler</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2.5 max-w-2xl">
              {numCols.map(col => (
                <label key={col} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${selectedScale.includes(col) ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedScale.includes(col)}
                    onChange={() => handleCheckbox(col, selectedScale, setSelectedScale)}
                    className="hidden"
                  />
                  <span className="text-[13px] font-medium">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-zinc-100 flex items-center justify-end">
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-5 py-2.5 text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-lg text-center shadow-sm w-full sm:w-auto disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-[1.5px] border-zinc-700"></div>}
            {isLoading ? 'Processing...' : 'Apply Preprocessing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreprocessingForm;
