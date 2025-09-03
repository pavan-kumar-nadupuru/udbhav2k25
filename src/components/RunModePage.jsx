import React, { useState } from 'react';

const RunModePage = () => {
  // Mock data for the initial state of the runs table
  const initialRuns = [
    { id: crypto.randomUUID(), name: 'Bug Classifier', priority: 'High', status: 'idle', inputFile: null },
    { id: crypto.randomUUID(), name: 'Customer Support Analyzer', priority: 'High', status: 'idle', inputFile: null },
    { id: crypto.randomUUID(), name: 'Sentiment Analysis Chain', priority: 'Medium', status: 'idle', inputFile: null },
    { id: crypto.randomUUID(), name: 'Marketing Copy Generator', priority: 'Medium', status: 'idle', inputFile: null },
  ];

  const [runs, setRuns] = useState(initialRuns);
  const priorities = ['High', 'Medium', 'Low'];

  // --- Mock Handlers ---

  /**
   * Handles the file selection to update the run's state.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   * @param {string} runId - The ID of the run to update.
   */
  const handleFileChange = (event, runId) => {
    const file = event.target.files[0];
    if (file) {
      setRuns(currentRuns =>
        currentRuns.map(run =>
          run.id === runId ? { ...run, status: 'file_uploaded', inputFile: file } : run
        )
      );
    }
  };

  /**
   * Simulates starting a run, showing a loader, and completing after a delay.
   * @param {string} runId - The ID of the run to start.
   */
  const handleRun = (runId) => {
    // 1. Set the status to 'running'
    setRuns(currentRuns =>
      currentRuns.map(run =>
        run.id === runId ? { ...run, status: 'running' } : run
      )
    );

    // 2. Simulate a 10-second processing delay
    setTimeout(() => {
      // 3. Set the status to 'complete'
      setRuns(currentRuns =>
        currentRuns.map(run =>
          run.id === runId ? { ...run, status: 'complete' } : run
        )
      );
    }, 10000); // 10 seconds delay
  };

  /**
   * Simulates downloading a result file.
   * @param {string} runName - The name of the run to use in the downloaded filename.
   */
  const handleDownload = (runName) => {
    // Dummy CSV content for the file
    const dummyContent = "id,input_text,output_response\n1,first query,mock llm response 1\n2,second query,mock llm response 2";
    
    // Create a Blob from the content
    const blob = new Blob([dummyContent], { type: 'text/csv;charset=utf-s8;' });
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    if (link.download !== undefined) { // Check for browser support
      const url = URL.createObjectURL(blob);
      const sanitizedName = runName.replace(/\s+/g, '_').toLowerCase();
      link.setAttribute('href', url);
      link.setAttribute('download', `output_${sanitizedName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  return (
  <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="p-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Run Configurations at Scale</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload a file with inputs (e.g., CSV) for a saved prompt configuration to run them in parallel.
        </p>
      </header>

      <div className="flex justify-center w-full">
        <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md max-w-4xl w-full">
          <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">Prompt Config Name</th>
              <th scope="col" className="px-6 py-3 font-semibold">Priority</th>
              <th scope="col" className="px-6 py-3 font-semibold text-center">Input</th>
              <th scope="col" className="px-6 py-3 font-semibold text-center">Run</th>
              <th scope="col" className="px-6 py-3 font-semibold text-center">Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{run.name}</td>
                <td className="px-6 py-4">
                  <select
                    defaultValue={run.priority}
                    className="p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="relative">
                        <input
                        type="file"
                        id={`file-upload-${run.id}`}
                        className="hidden"
                        onChange={(e) => handleFileChange(e, run.id)}
                        accept=".csv,.json"
                        />
                        <label
                            htmlFor={`file-upload-${run.id}`}
                            className="cursor-pointer px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs font-semibold"
                        >
                        {run.inputFile ? run.inputFile.name : 'Upload File'}
                        </label>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                    {run.status === 'running' ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Running...</span>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleRun(run.id)}
                            disabled={!run.inputFile || run.status === 'running'}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Run
                        </button>
                    )}
                </td>
                 <td className="px-6 py-4 text-center">
                    {run.status === 'complete' && (
                        <button
                            onClick={() => handleDownload(run.name)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-semibold"
                        >
                            Download
                        </button>
                    )}
                 </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RunModePage;

