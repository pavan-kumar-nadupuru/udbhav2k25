const CONFIG_INDEX_KEY = 'llm_configurations_index';
const CONFIG_PREFIX = 'llm_configuration_';

/**
 * Retrieves the index of all saved configurations from localStorage.
 * @returns {Array<{id: string, name: string, timestamp: string}>} An array of configuration metadata.
 */
export const getSavedConfigurations = () => {
  try {
    const index = localStorage.getItem(CONFIG_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error("Failed to retrieve saved configurations index:", error);
    return [];
  }
};

/**
 * Saves a new configuration to localStorage.
 * @param {string} name - The name for the new configuration.
 * @param {Array<object>} modules - The current array of modules.
 * @returns {{id: string, name: string, timestamp: string}|null} Metadata for the saved config.
 */
export const saveConfiguration = (name, modules) => {
  if (!name || !modules) return null;
  try {
    const savedModules = modules.map(module => ({
      id: crypto.randomUUID(),
      prompt: module.prompt,
      inputs: module.inputs, // Save the current inputs
      renderedPrompt: '',
      isLoading: false,
      output: null,
      error: '',
    }));
    const newConfig = {
      id: crypto.randomUUID(),
      name,
      timestamp: new Date().toISOString(),
      modules: savedModules,
    };
    localStorage.setItem(`${CONFIG_PREFIX}${newConfig.id}`, JSON.stringify(newConfig));
    const index = getSavedConfigurations();
    index.push({ id: newConfig.id, name: newConfig.name, timestamp: newConfig.timestamp });
    localStorage.setItem(CONFIG_INDEX_KEY, JSON.stringify(index));
    return { id: newConfig.id, name: newConfig.name, timestamp: newConfig.timestamp };
  } catch (error) {
    console.error("Failed to save configuration:", error);
    return null;
  }
};

/**
 * Loads a specific configuration by its ID from localStorage.
 * @param {string} id - The ID of the configuration to load.
 * @returns {object|null} The full configuration object, or null if not found.
 */
export const loadConfiguration = (id) => {
  if (!id) return null;
  try {
    const configString = localStorage.getItem(`${CONFIG_PREFIX}${id}`);
    return configString ? JSON.parse(configString) : null;
  } catch (error) {
    console.error(`Failed to load configuration with id ${id}:`, error);
    return null;
  }
};