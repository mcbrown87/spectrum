# Spectrum - Jackbox-Style Ranking Game

## Project Overview

A multiplayer web-based game where players join using their phones to rank each other on various spectrums/superlatives (like high school yearbook categories). Players see prompts like "Most likely to become famous" and drag other players onto a spectrum from least to most likely.

## Game Flow

1. **Unified Entry**: Players visit main page and choose to host or join a game
2. **Host Setup**: Host enters their name and creates a game room, automatically becoming first player
3. **Player Join**: Players navigate to the site, enter room code and name to join
4. **Lobby**: All players (including host) see real-time player list with crown badge for host
5. **Round Structure** (Coming Soon):
   - Display prompt (e.g., "Most likely to survive a zombie apocalypse")
   - Players rank ALL other players on the spectrum
   - Timer countdown for responses
   - Show aggregated results/voting patterns
6. **Multiple Rounds**: Continue with different prompts
7. **Final Results**: Show overall patterns and "awards"

## Technical Architecture

### Frontend
- **Unified Interface**: Single-page application with responsive design
  - Homepage with host/join choice options
  - Unified game flows for both hosting and joining
  - Real-time lobby with player list and host identification
- **Host Experience**: Integrated host-as-player system
  - Host enters name and becomes first player
  - Administrative controls while participating in game
  - Crown badge visual distinction
- **Player Experience**: Mobile-optimized interface
  - Simple room code entry and name registration
  - Touch-friendly design for mobile devices
  - Real-time updates and synchronization

### Backend
- **Server**: Node.js + Express + Socket.io (implemented)
- **Real-time Communication**: WebSocket connections for instant updates
- **Game Management**: In-memory game state with GameManager class
  - Room code generation and validation
  - Player management with host-as-player support
  - Real-time synchronization across all clients
- **Session Management**: Socket-based player tracking with disconnect handling
- **Database**: Currently in-memory, SQLite/PostgreSQL planned for persistence

### Current Project Structure
```
/public
  index.html - Unified homepage with host/join flows
  /host/index.html - Legacy host interface (maintained for compatibility)
  /player/index.html - Legacy player interface (maintained for compatibility)
  style.css - Responsive CSS with glassmorphism design
/server
  index.js - Express server with Socket.io integration
  gameManager.js - Game state management and player tracking
/.claude
  /agents - Project-specific Claude Code agents
  settings.local.json - Local development settings
PROJECT_PLAN.md - This file
FEATURES.md - User-facing feature documentation
```

## Database Schema

### Planned Database Schema (Future Implementation)
- **games**: id, code, host_id, status, created_at, settings
- **players**: id, game_id, name, socket_id, joined_at, is_host
- **rounds**: id, game_id, prompt, round_number, status, timer_end
- **rankings**: id, round_id, player_id, ranked_player_id, position, submitted_at
- **prompts**: id, category, text, description

### Current In-Memory Structure
```javascript
// Game object structure
{
  code: "ABC123",
  hostId: "socket_id",
  players: [
    { id: "socket_id", name: "PlayerName", joinedAt: Date, isHost: true/false }
  ],
  status: "waiting",
  createdAt: Date
}
```

## Development Phases

### Phase 1: Core Infrastructure ✅ COMPLETED
- [x] Project setup and basic server (Node.js + Express + Socket.io)
- [x] In-memory game state management with GameManager class
- [x] Real-time Socket.io communication for all game events
- [x] Unified homepage with host/join game flows
- [x] Host-as-player system with name registration
- [x] Responsive UI with glassmorphism design
- [x] Real-time lobby with player list and host identification
- [x] Input validation and error handling
- [x] Legacy URL support for backward compatibility

### Phase 2: Game Mechanics ✅ COMPLETED
- [x] Round management system with game state transitions
- [x] Prompt delivery to all players simultaneously  
- [x] Mobile-friendly ranking interface with drag-and-drop
- [x] Consensus-based scoring system for ranking accuracy
- [x] Real-time result aggregation and display system
- [x] Player ranking submission and validation
- [x] Multi-round game flow (2 rounds implemented)
- [x] Final results and game completion handling

### Phase 3: User Experience ✅ COMPLETED
- [x] Polished UI/UX for mobile and desktop ranking
- [x] Host dashboard with complete game controls
- [x] Real-time result visualization with scoring
- [x] Comprehensive error handling and state management
- [x] Smooth transitions between game phases
- [x] Visual feedback for all user interactions

### Phase 4: Polish & Features (FUTURE)
- [ ] Expanded prompt library with more categories
- [ ] Custom prompt creation by hosts
- [ ] Game history and statistics tracking
- [ ] Advanced scoring modes and variations
- [ ] Timer functionality for rounds
- [ ] Improved result analysis and insights
- [ ] Team-based gameplay modes

## Key Technical Decisions

### Technology Stack
- **Frontend**: Vanilla JavaScript/HTML/CSS (implemented)
  - No framework dependencies for faster loading
  - Responsive CSS Grid and Flexbox layouts
  - Glassmorphism design with CSS backdrop-filter
- **Backend**: Node.js + Express + Socket.io (implemented)
- **State Management**: In-memory with GameManager class (implemented)
- **Database**: Currently in-memory, SQLite planned for persistence
- **Deployment**: Ready for Heroku, Railway, or Vercel

### Mobile Interface Design
- Touch-friendly drag and drop for ranking
- Large touch targets
- Minimal scrolling required
- Fast loading times
- Works across iOS/Android browsers

### Real-time Requirements
- Instant updates when players join/leave
- Synchronized timers across all clients
- Real-time result updates during reveal phase
- Handle network disconnections gracefully

## Prompt Categories

### Starting Categories
- **Personality**: Most likely to become famous, Most adventurous, Biggest introvert
- **Future**: Most likely to become rich, Most likely to travel the world
- **Quirky**: Most likely to survive in the wild, Best at giving advice
- **Social**: Life of the party, Most trustworthy, Funniest

### Custom Prompts
- Allow hosts to create custom prompts for their group
- Moderation considerations for inappropriate content

## Current Status

- [x] Initial project planning and documentation
- [x] Technology stack implementation (Vanilla JS + Node.js + Socket.io)
- [x] Development environment setup and testing
- [x] Complete multiplayer lobby system with real-time updates
- [x] Host-as-player integration with visual distinction
- [x] Unified user interface with responsive design
- [x] **Full gameplay implementation with ranking mechanics**
- [x] **Multi-round game flow with 2 complete rounds**
- [x] **Consensus-based scoring system**
- [x] **Real-time result visualization and final standings**
- [x] Comprehensive testing and validation
- [ ] Database persistence layer (optional for current functionality)

## Next Steps

1. **Performance Optimization**: Optimize for larger player groups (4-8 players)
2. **Prompt Library Expansion**: Add more diverse ranking categories and prompts
3. **Custom Prompt Creation**: Allow hosts to create personalized ranking questions
4. **Game Analytics**: Add statistics tracking and game history features
5. **Enhanced Scoring**: Implement different scoring modes and bonus systems
6. **Database Integration**: Add persistence layer for game history (optional)
7. **Deployment**: Prepare for production deployment and scaling

## Notes

- Keep initial scope small - focus on core ranking mechanic
- Prioritize mobile experience since players primarily use phones
- Consider offline/connection issues common in group gaming scenarios
- Plan for scalability but start simple
- Test with real groups early to validate game flow

---

*Project started: August 3, 2025*
*Last updated: August 3, 2025*

## Recent Accomplishments

**August 3, 2025:**
- ✅ Implemented unified homepage with host/join choice
- ✅ Added host-as-player system with name registration
- ✅ Created real-time multiplayer lobby with crown badge for hosts
- ✅ Built responsive design with glassmorphism effects
- ✅ **MAJOR FEATURE: Complete gameplay implementation**
  - ✅ Multi-round ranking system (2 rounds)
  - ✅ Drag-and-drop ranking interface
  - ✅ Consensus-based scoring algorithm
  - ✅ Real-time result visualization
  - ✅ Final standings and game completion
- ✅ Established comprehensive testing with UI validation agent
- ✅ Documented all features and validated implementation accuracy