import React, { useState } from 'react';
import { chatWithLLM } from '../helpers/geminiChat';


const LLMInterface = () => {
  const [models] = useState(['Gemini', 'PaLI', 'BERT']);
  const [versions] = useState(['2.0', '2.5', '3.0']);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);

  const [modules, setModules] = useState([
    {
      id: crypto.randomUUID(),
      inputs: [], // Start with zero inputs
      prompt: '',
      renderedPrompt: '',
      isLoading: false,
      output: null,
      error: '',
    },
  ]);

  // --- Module and Input Management ---


  const addInput = (moduleIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].inputs.push('');
    setModules(newModules);
  };


  const removeInput = (moduleIndex, inputIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].inputs.splice(inputIndex, 1);
    setModules(newModules);
  };


  // Update renderedPrompt whenever input or prompt changes
  const updateRenderedPrompt = (moduleIndex, newModules) => {
    newModules[moduleIndex].renderedPrompt = getRenderedPrompt(moduleIndex, newModules);
  };


  const handleInputChange = (moduleIndex, inputIndex, value) => {
    const newModules = [...modules];
    newModules[moduleIndex].inputs[inputIndex] = value;
    updateRenderedPrompt(moduleIndex, newModules);
    setModules(newModules);
  };


  const handlePromptChange = (moduleIndex, value) => {
    const newModules = [...modules];
    newModules[moduleIndex].prompt = value;
    // Show error if prompt is empty
    newModules[moduleIndex].error = value.trim() === '' ? 'Prompt is required.' : '';
    updateRenderedPrompt(moduleIndex, newModules);
    setModules(newModules);
  };


  const addNextStep = (index) => {
    const newModule = {
      id: crypto.randomUUID(),
      inputs: [], // Start with zero inputs
      prompt: '',
      renderedPrompt: '',
      isLoading: false,
      output: null,
      error: '',
    };
    const newModules = [...modules];
    newModules.splice(index + 1, 0, newModule);
    setModules(newModules);
  };

  const removeModule = (index) => {
    const newModules = [...modules];
    newModules.splice(index, 1);
    setModules(newModules);
  };

  // --- Prompt Rendering and Execution ---

  const getValueByPath = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Helper to resolve input value (can reference @Module[n] or @Module[n].path)
  const resolveInputValue = (inputValue, moduleIndex, currentModules) => {
    // Only resolve if inputValue matches @Module[n] or @Module[n].path
    const moduleRefRegex = /^@Module\[(\d+)\](?:\.([\w\.]+))?$/;
    const match = inputValue.match(moduleRefRegex);
    if (match) {
      const refIndex = parseInt(match[1], 10);
      const jsonPath = match[2];
      if (refIndex >= 0 && refIndex < moduleIndex) {
        const referencedModule = currentModules[refIndex];
        if (referencedModule && referencedModule.output) {
          let displayValue = referencedModule.output;
          if (jsonPath) {
            try {
              const outputObj = JSON.parse(referencedModule.output);
              const value = getValueByPath(outputObj, jsonPath);
              if (value === undefined) {
                displayValue = `[Error: Path not found - ${jsonPath}]`;
              } else if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
              } else {
                displayValue = String(value);
              }
            } catch (e) {
              displayValue = '[Error: Invalid JSON for path access]';
            }
          }
          return displayValue;
        } else {
          return `[Error: No output for Module ${refIndex + 1}]`;
        }
      } else {
        return `[Error: Invalid Module index ${refIndex + 1}]`;
      }
    }
    return inputValue;
  };

  // Updated getRenderedPrompt: resolves @InputX using resolved input values
  const getRenderedPrompt = (moduleIndex, currentModules) => {
    const module = currentModules[moduleIndex];
    let rendered = module.prompt;

    // Replace @InputX references with resolved input values
    module.inputs.forEach((inputValue, i) => {
      const placeholder = `@Input${i + 1}`;
      const resolvedValue = resolveInputValue(inputValue, moduleIndex, currentModules);
      rendered = rendered.replace(
        new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'),
        resolvedValue
      );
    });

    // Replace @Module[index] or @Module[index].path references in prompt
    const moduleRefRegex = /@Module\[(\d+)\](?:\.([\w\.]+))?/g;
    let tempRendered = rendered;
    let match;
    while ((match = moduleRefRegex.exec(tempRendered)) !== null) {
      const [fullMatch, refIndexStr, jsonPath] = match;
      const refIndex = parseInt(refIndexStr, 10);

      if (refIndex >= 0 && refIndex < moduleIndex) {
        const referencedModule = currentModules[refIndex];
        if (referencedModule && referencedModule.output) {
          let displayValue = referencedModule.output;
          if (jsonPath) {
            try {
              const outputObj = JSON.parse(referencedModule.output);
              const value = getValueByPath(outputObj, jsonPath);
              if (value === undefined) {
                displayValue = `[Error: Path not found - ${jsonPath}]`;
              } else if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
              } else {
                displayValue = String(value);
              }
            } catch (e) {
              displayValue = '[Error: Invalid JSON for path access]';
            }
          }
          rendered = rendered.replace(fullMatch, displayValue);
        } else {
          rendered = rendered.replace(fullMatch, `[Error: No output for Module ${refIndex + 1}]`);
        }
      } else {
        rendered = rendered.replace(fullMatch, `[Error: Invalid Module index ${refIndex + 1}]`);
      }
    }
    return rendered;
  };
  
  const renderPrompt = (moduleIndex) => {
     const newModules = [...modules];
     newModules[moduleIndex].renderedPrompt = getRenderedPrompt(moduleIndex, newModules);
     setModules(newModules);
  }


  const runModule = async (moduleIndex, currentModules) => {
    // Always use the latest modules for input resolution
    const modulesToUse = currentModules || modules;
    const module = modulesToUse[moduleIndex];
    if (!module.prompt.trim()) {
      setModules(prev => prev.map((m, i) => i === moduleIndex ? { ...m, error: 'Prompt is required.' } : m));
      return;
    }
    // Resolve all input values before rendering prompt
    const resolvedInputs = module.inputs.map(inputValue => resolveInputValue(inputValue, moduleIndex, modulesToUse));
    // Create a shallow copy with resolved inputs for this run
    const modulesWithResolvedInputs = modulesToUse.map((m, idx) => idx === moduleIndex ? { ...m, inputs: resolvedInputs } : m);
    const finalPrompt = getRenderedPrompt(moduleIndex, modulesWithResolvedInputs);

    setModules(prev =>
      prev.map((m, i) => (i === moduleIndex ? { ...m, isLoading: true, output: null, error: '' } : m))
    );
    
    const result = await chatWithLLM(finalPrompt);

    setModules(prev =>
      prev.map((m, i) => (i === moduleIndex ? { ...m, isLoading: false, output: result } : m))
    );
  };
  

  const runAllModules = async () => {
    // Prevent running if any prompt is empty
    let hasError = false;
    setModules(prev => prev.map((m) => {
      if (!m.prompt.trim()) {
        hasError = true;
        return { ...m, error: 'Prompt is required.' };
      }
      return { ...m, error: '' };
    }));
    if (hasError) return;

    // Use a local copy to keep outputs up-to-date for prompt rendering and input resolution
    let localModules = [...modules];
    for (let i = 0; i < localModules.length; i++) {
      // Resolve all input values for this module
      const resolvedInputs = localModules[i].inputs.map(inputValue => resolveInputValue(inputValue, i, localModules));
      localModules = localModules.map((m, idx) => idx === i ? { ...m, inputs: resolvedInputs } : m);
      // Render prompt with latest outputs and resolved inputs
      const finalPrompt = getRenderedPrompt(i, localModules);
      // Set loading state in UI
      setModules(prev => prev.map((m, idx) => idx === i ? { ...m, isLoading: true, output: null, error: '' } : m));
      // Get output
      const result = await chatWithLLM(finalPrompt);
      // Update localModules and UI with output
      localModules = localModules.map((m, idx) => idx === i ? { ...m, isLoading: false, output: result, renderedPrompt: finalPrompt } : m);
      setModules(localModules);
    }
  };


  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <label htmlFor="llm-model" className="font-bold text-sm">LLM Model:</label>
          <select id="llm-model" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-sm">
            {models.map(model => <option key={model} value={model}>{model}</option>)}
          </select>

          <label htmlFor="model-version" className="font-bold text-sm">Version:</label>
          <select id="model-version" value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-sm">
            {versions.map(version => <option key={version} value={version}>{version}</option>)}
          </select>
        </div>
        <button
          onClick={runAllModules}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold"
          disabled={modules.some(m => !m.prompt.trim())}
        >
          Run All
        </button>
      </header>

      <div className="flex flex-col gap-4">
        {modules.map((module, i) => (
          <React.Fragment key={module.id}>
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 relative shadow-sm">
              {module.isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/50 flex justify-center items-center rounded-lg z-10">
                   <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Module {i + 1}</h3>
                <div className="flex gap-2">
                  <button onClick={() => addNextStep(i)} className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600">Add Next Step</button>
                  {modules.length > 1 && <button onClick={() => removeModule(i)} className="px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600">Remove</button>}
                </div>
              </div>

              {/* Inputs Section */}
              <div className="mb-3">
                <h4 className="font-semibold mb-2 text-sm">Inputs</h4>
                <div className="flex flex-col gap-2">
                  {module.inputs.length === 0 && (
                    <div className="text-xs text-gray-400 italic">No inputs. Add if needed.</div>
                  )}
                  {module.inputs.map((input, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <label htmlFor={`input-${i}-${j}`} className="text-xs min-w-[50px]">Input {j + 1}:</label>
                      <input
                        type="text"
                        id={`input-${i}-${j}`}
                        value={input}
                        onChange={(e) => handleInputChange(i, j, e.target.value)}
                        className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button onClick={() => removeInput(i, j)} className="w-6 h-6 text-center font-bold bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-red-400 dark:hover:bg-red-500">-</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addInput(i)} className="w-6 h-6 mt-2 text-center font-bold bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-blue-400 dark:hover:bg-blue-500">+</button>
              </div>

              {/* Prompt Section */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Prompt</h4>
                <textarea
                  value={module.prompt}
                  onChange={(e) => handlePromptChange(i, e.target.value)}
                  placeholder="Use @Input1, @Input2, and @Module[0].path etc."
                  className={`w-full min-h-[100px] p-2 border ${module.error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                ></textarea>
                {module.error && (
                  <div className="text-red-500 text-xs mt-1">{module.error}</div>
                )}
              </div>

              {/* Action Buttons & Outputs */}

              <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => runModule(i)}
                    disabled={module.isLoading || !module.prompt.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    Run
                  </button>
              </div>

              {module.renderedPrompt && (
                <div className="mt-4 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                  <h4 className="font-semibold text-xs mb-1">Rendered Prompt</h4>
                  <pre className="text-xs whitespace-pre-wrap break-words font-mono">{module.renderedPrompt}</pre>
                </div>
              )}

              {module.output && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 p-2 rounded-md">
                  <h4 className="font-semibold text-xs mb-1 text-blue-800 dark:text-blue-300">Output</h4>
                  <pre className="text-xs whitespace-pre-wrap break-words font-mono">{module.output}</pre>
                </div>
              )}
            </div>
            {i < modules.length - 1 && (
                <div className="flex justify-center items-center my-2">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-gray-400 dark:border-t-gray-600"></div>
                </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default LLMInterface;

