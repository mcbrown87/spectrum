const fs = require('fs');
const path = require('path');

/**
 * Abstract interface for managing game prompts
 * Provides methods to retrieve, filter, and manage prompts for gameplay
 */
class PromptManager {
    constructor(dataSource = null) {
        this.prompts = [];
        this.categories = {};
        this.dataSource = dataSource || path.join(__dirname, 'data', 'prompts.json');
        this.loadPrompts();
    }

    /**
     * Load prompts from the data source
     * Can be overridden to load from different sources (API, database, etc.)
     */
    loadPrompts() {
        try {
            const data = fs.readFileSync(this.dataSource, 'utf8');
            const promptData = JSON.parse(data);
            this.prompts = promptData.prompts || [];
            this.categories = promptData.categories || {};
            
            // Validate loaded prompts
            this.validatePrompts();
        } catch (error) {
            console.error('Error loading prompts:', error.message);
            // Fallback to basic prompts if file loading fails
            this.loadFallbackPrompts();
        }
    }

    /**
     * Validate that all prompts have required fields
     */
    validatePrompts() {
        this.prompts = this.prompts.filter(prompt => {
            const isValid = prompt.id && prompt.text && prompt.category;
            if (!isValid) {
                console.warn('Invalid prompt found and removed:', prompt);
            }
            return isValid;
        });
    }

    /**
     * Fallback prompts in case of data loading failure
     */
    loadFallbackPrompts() {
        console.log('Loading fallback prompts...');
        this.prompts = [
            {
                id: 'height',
                category: 'physical',
                text: 'Rank players by height (tallest to shortest)',
                description: 'Order players from tallest to shortest based on their physical height'
            },
            {
                id: 'fame_likelihood',
                category: 'future',
                text: 'Rank players by how likely they are to become famous',
                description: 'Who is most likely to achieve fame or celebrity status?'
            }
        ];
    }

    /**
     * Get all available prompts
     * @returns {Array} Array of prompt objects
     */
    getAllPrompts() {
        return [...this.prompts];
    }

    /**
     * Get prompts by category
     * @param {string} category - Category name to filter by
     * @returns {Array} Array of prompts in the specified category
     */
    getPromptsByCategory(category) {
        return this.prompts.filter(prompt => prompt.category === category);
    }

    /**
     * Get a random selection of prompts
     * @param {number} count - Number of prompts to return
     * @param {Array} excludeIds - Array of prompt IDs to exclude
     * @returns {Array} Array of randomly selected prompts
     */
    getRandomPrompts(count, excludeIds = []) {
        const availablePrompts = this.prompts.filter(prompt => 
            !excludeIds.includes(prompt.id)
        );
        
        if (availablePrompts.length === 0) {
            return [];
        }
        
        const shuffled = [...availablePrompts].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    /**
     * Get prompts for a specific number of game rounds
     * Ensures variety by avoiding duplicates and balancing categories
     * @param {number} roundCount - Number of rounds to get prompts for
     * @returns {Array} Array of prompts for each round
     */
    getPromptsForGame(roundCount) {
        if (roundCount <= 0) {
            return [];
        }

        // If we need more prompts than available, allow repeats
        if (roundCount > this.prompts.length) {
            console.warn(`Requested ${roundCount} prompts but only ${this.prompts.length} available. Some may repeat.`);
        }

        const selectedPrompts = [];
        const usedIds = new Set();
        const categoryBalance = new Map();

        // Initialize category tracking
        Object.keys(this.categories).forEach(cat => categoryBalance.set(cat, 0));

        for (let i = 0; i < roundCount; i++) {
            let selectedPrompt;

            if (usedIds.size < this.prompts.length) {
                // Try to find a prompt from an underused category
                const leastUsedCategories = this.getLeastUsedCategories(categoryBalance);
                selectedPrompt = this.selectPromptFromCategories(leastUsedCategories, usedIds);
                
                // If no prompt found from preferred categories, pick any unused prompt
                if (!selectedPrompt) {
                    selectedPrompt = this.prompts.find(p => !usedIds.has(p.id));
                }
            } else {
                // All prompts used, start allowing repeats
                selectedPrompt = this.prompts[Math.floor(Math.random() * this.prompts.length)];
            }

            if (selectedPrompt) {
                selectedPrompts.push(selectedPrompt);
                usedIds.add(selectedPrompt.id);
                categoryBalance.set(selectedPrompt.category, 
                    (categoryBalance.get(selectedPrompt.category) || 0) + 1
                );
            }
        }

        return selectedPrompts;
    }

    /**
     * Get categories with the least usage for balanced selection
     * @param {Map} categoryBalance - Map of category usage counts
     * @returns {Array} Array of category names with lowest usage
     */
    getLeastUsedCategories(categoryBalance) {
        const minUsage = Math.min(...categoryBalance.values());
        return Array.from(categoryBalance.entries())
            .filter(([_, count]) => count === minUsage)
            .map(([category, _]) => category);
    }

    /**
     * Select a random prompt from specified categories, excluding used IDs
     * @param {Array} categories - Array of category names to choose from
     * @param {Set} usedIds - Set of prompt IDs to exclude
     * @returns {Object|null} Selected prompt or null if none available
     */
    selectPromptFromCategories(categories, usedIds) {
        const availablePrompts = this.prompts.filter(prompt => 
            categories.includes(prompt.category) && !usedIds.has(prompt.id)
        );
        
        if (availablePrompts.length === 0) {
            return null;
        }
        
        return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    }

    /**
     * Get prompt by ID
     * @param {string} id - Prompt ID
     * @returns {Object|null} Prompt object or null if not found
     */
    getPromptById(id) {
        return this.prompts.find(prompt => prompt.id === id) || null;
    }

    /**
     * Get all available categories
     * @returns {Object} Object containing category information
     */
    getCategories() {
        return { ...this.categories };
    }

    /**
     * Get statistics about the prompt collection
     * @returns {Object} Statistics object
     */
    getStats() {
        const categoryStats = {};
        Object.keys(this.categories).forEach(cat => {
            categoryStats[cat] = this.getPromptsByCategory(cat).length;
        });

        return {
            totalPrompts: this.prompts.length,
            totalCategories: Object.keys(this.categories).length,
            promptsByCategory: categoryStats,
            dataSource: this.dataSource
        };
    }

    /**
     * Reload prompts from data source
     * Useful for hot-reloading during development or runtime updates
     */
    reload() {
        this.loadPrompts();
        console.log('Prompts reloaded from data source');
    }
}

module.exports = PromptManager;