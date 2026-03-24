import React, { useState } from 'react';

interface ModelSelectionFormProps {
  columns: string[];
}

const ModelSelectionForm: React.FC<ModelSelectionFormProps> = ({ columns }) => {
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [modelType, setModelType] = useState<string>('LogisticRegression');
  
  // Hyperparameters
  const [lrC, setLrC] = useState<number>(1.0);
  const [rfEstimators, setRfEstimators] = useState<number>(100);
  const [rfMaxDepth, setRfMaxDepth] = useState<number | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFeatureToggle = (col: string) => {
    if (featureColumns.includes(col)) {
      setFeatureColumns(featureColumns.filter(c => c !== col));
    } else {
      setFeatureColumns([...featureColumns, col]);
    }
  };

  const trainModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColumn) {
      setError('Please select a target column.');
      return;
    }
    if (featureColumns.length === 0) {
      setError('Please select at least one feature column.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    const hyperparameters: any = {};
    if (modelType === 'LogisticRegression') {
      hyperparameters['C'] = lrC;
    } else if (modelType === 'RandomForestClassifier') {
      hyperparameters['n_estimators'] = rfEstimators;
      if (rfMaxDepth !== '') {
        hyperparameters['max_depth'] = Number(rfMaxDepth);
      }
    }

    try {
      const response = await fetch('http://localhost:8000/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_column: targetColumn,
          feature_columns: featureColumns,
          model_type: modelType,
          hyperparameters: hyperparameters
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Training failed');
      }

      setResults(data.results);
    } catch (err: any) {
      setError(err.message || 'An error occurred during training.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Train Classification Model</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={trainModel} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Variable</label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="">-- Select Target --</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="LogisticRegression">Logistic Regression</option>
              <option value="RandomForestClassifier">Random Forest</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
          <div className="flex flex-wrap gap-2">
            {columns.filter(c => c !== targetColumn).map(col => (
              <label key={col} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={featureColumns.includes(col)}
                  onChange={() => handleFeatureToggle(col)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{col}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Hyperparameters</h3>
          {modelType === 'LogisticRegression' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inverse Regularization (C)</label>
              <input
                type="number"
                step="0.1"
                min="0.01"
                value={lrC}
                onChange={(e) => setLrC(parseFloat(e.target.value))}
                className="w-full sm:w-64 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              />
              <p className="mt-1 text-xs text-gray-500">Smaller values specify stronger regularization.</p>
            </div>
          )}
          {modelType === 'RandomForestClassifier' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Estimators</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rfEstimators}
                  onChange={(e) => setRfEstimators(parseInt(e.target.value))}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Depth (Optional)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rfMaxDepth}
                  onChange={(e) => setRfMaxDepth(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="None"
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 rounded-lg text-center shadow-sm disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Training...' : 'Train Model'}
          </button>
        </div>
      </form>

      {results && (
        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            Training Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{(results.metrics.accuracy * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Precision</p>
              <p className="text-2xl font-bold text-gray-900">{(results.metrics.precision * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Recall</p>
              <p className="text-2xl font-bold text-gray-900">{(results.metrics.recall * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">F1 Score</p>
              <p className="text-2xl font-bold text-gray-900">{(results.metrics.f1_score * 100).toFixed(2)}%</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 flex justify-between">
            <span>Model: <span className="font-semibold text-gray-900">{results.model}</span></span>
            <span>Classes: <span className="font-semibold text-gray-900">{results.classes}</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelectionForm;
