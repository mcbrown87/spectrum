# Prompt System Documentation

## Overview

The Spectrum prompt system provides an abstract, extensible interface for managing game prompts. It supports multiple data sources, category-based organization, and intelligent selection algorithms to ensure varied and engaging gameplay.

## Architecture

### PromptManager Class

The `PromptManager` class serves as the primary interface for prompt management:

```javascript
const PromptManager = require('./server/promptManager');
const promptManager = new PromptManager();
```

### Key Features

- **Abstract Interface**: Works with any data source (JSON files, APIs, databases)
- **Category Organization**: Prompts organized into logical categories
- **Smart Selection**: Balances categories and avoids repetition
- **Fallback System**: Graceful degradation if data loading fails
- **Hot Reloading**: Runtime prompt updates without server restart

## Data Structure

### Prompt Object Format

```json
{
  "id": "unique_identifier",
  "category": "category_name", 
  "text": "The prompt text shown to players",
  "description": "Optional detailed description"
}
```

### Categories Structure

```json
{
  "category_id": {
    "name": "Human Readable Name",
    "description": "Category description"
  }
}
```

## Current Categories

| Category | Count | Examples |
|----------|-------|----------|
| **Physical** | 1 | Height ranking |
| **Personality** | 5 | Most optimistic, biggest morning person |
| **Future** | 3 | Most likely to become famous/billionaire |
| **Skills** | 6 | Best cooking skills, most tech-savvy |
| **Social** | 2 | Party energy, karaoke confidence |
| **Humor** | 3 | Zombie survival, Netflix binging |

## API Reference

### Core Methods

#### `getPromptsForGame(roundCount)`
Returns an array of prompts for a complete game, ensuring variety and category balance.

```javascript
const gamePrompts = promptManager.getPromptsForGame(3);
// Returns 3 different prompts from varied categories
```

#### `getRandomPrompts(count, excludeIds)`
Get random prompts with optional exclusions.

```javascript
const randomPrompts = promptManager.getRandomPrompts(5, ['height', 'fame_likelihood']);
```

#### `getPromptsByCategory(category)`
Filter prompts by specific category.

```javascript
const personalityPrompts = promptManager.getPromptsByCategory('personality');
```

#### `getStats()`
Get comprehensive statistics about the prompt collection.

```javascript
const stats = promptManager.getStats();
console.log(stats.totalPrompts); // 20
console.log(stats.promptsByCategory); // Category breakdown
```

### Utility Methods

- `getAllPrompts()` - Get all available prompts
- `getPromptById(id)` - Find specific prompt by ID
- `getCategories()` - Get category information
- `reload()` - Hot reload prompts from data source

## GameManager Integration

The `GameManager` automatically uses the prompt system:

```javascript
// During game start
const gamePrompts = this.promptManager.getPromptsForGame(game.totalRounds);
game.gamePrompts = gamePrompts; // Store for entire game

// Each round uses pre-selected prompts
const currentPrompt = game.gamePrompts[game.currentRound - 1];
```

## Adding New Prompts

### Method 1: JSON File (Recommended)

Edit `/server/data/prompts.json`:

```json
{
  "id": "new_prompt_id",
  "category": "existing_category",
  "text": "Your prompt text here",
  "description": "Optional description"
}
```

### Method 2: Runtime Addition

```javascript
// For custom data sources, override loadPrompts() method
class CustomPromptManager extends PromptManager {
    loadPrompts() {
        // Load from API, database, etc.
        this.prompts = await fetchPromptsFromAPI();
    }
}
```

## Selection Algorithm

The prompt selection uses intelligent algorithms to ensure variety:

1. **Category Balancing**: Tracks usage by category, prioritizes underused categories
2. **Duplicate Avoidance**: Prevents repeating prompts within a game
3. **Fallback Logic**: Handles edge cases gracefully

```javascript
// Example selection for 3-round game:
// Round 1: "Most optimistic" (personality)  
// Round 2: "Best cooking skills" (skills)
// Round 3: "Zombie survival" (humor)
```

## Error Handling

- **File Loading Errors**: Falls back to basic prompts
- **Invalid Prompts**: Automatically filtered out during validation
- **Insufficient Prompts**: Allows repeats when necessary

## Testing

Run the prompt system test:

```bash
node test_prompts.js
```

Expected output:
- ✅ PromptManager created successfully
- 📊 Statistics showing 20+ prompts across 6 categories
- 🎮 Sample game prompts with category diversity
- 🧠 Category filtering examples

## Performance Considerations

- Prompts loaded once at startup
- In-memory operations for fast access
- Hot reload available for development
- Minimal memory footprint (~20KB for full prompt set)

## Future Enhancements

- **Custom Prompt Creation**: Allow hosts to create temporary prompts
- **Prompt Difficulty Levels**: Easy/Medium/Hard categories
- **Multiplayer Voting**: Let players vote on next prompt
- **Theme-based Games**: Christmas, Work, Friends themes
- **Localization Support**: Multi-language prompt support

## Troubleshooting

### Common Issues

**Q: No prompts showing up**
A: Check that `/server/data/prompts.json` exists and is valid JSON

**Q: Same prompts repeating**
A: Increase prompt pool size or check `getPromptsForGame()` parameters

**Q: Categories not balanced**
A: Review category distribution in prompts.json

### Debug Commands

```javascript
// Check prompt loading
console.log(promptManager.getStats());

// Validate prompts
console.log(promptManager.getAllPrompts().length);

// Test selection
console.log(promptManager.getPromptsForGame(5));
```