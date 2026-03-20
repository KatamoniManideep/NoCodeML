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
        filename: 'active_dataset.parquet', // keep dummy name or adjust as needed
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Data Preprocessing</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Missing Values Strategy</label>
          <select 
            value={missingStrategy} 
            onChange={e => setMissingStrategy(e.target.value)}
            className="w-full sm:w-64 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            <option value="drop">Drop Rows with Nulls</option>
            <option value="mean">Impute with Mean (Numeric)</option>
            <option value="median">Impute with Median (Numeric)</option>
          </select>
        </div>

        {catCols.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Encode Categorical Columns</label>
            <div className="flex flex-wrap gap-3">
              {catCols.map(col => (
                <label key={col} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input 
                    type="checkbox" 
                    checked={selectedEncode.includes(col)}
                    onChange={() => handleCheckbox(col, selectedEncode, setSelectedEncode)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {numCols.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2 max-w-2xl">
              <label className="block text-sm font-medium text-gray-700">Scale Numeric Columns</label>
              <select 
                value={scaleMethod} 
                onChange={e => setScaleMethod(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5"
              >
                <option value="Standard">StandardScaler</option>
                <option value="MinMax">MinMaxScaler</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 max-w-2xl">
              {numCols.map(col => (
                <label key={col} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input 
                    type="checkbox" 
                    checked={selectedScale.includes(col)}
                    onChange={() => handleCheckbox(col, selectedScale, setSelectedScale)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center shadow-sm w-full sm:w-auto disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Apply Preprocessing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreprocessingForm;
