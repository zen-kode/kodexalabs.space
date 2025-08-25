# Trae IDE Development Guide - Sparks Project

*Your streamlined guide to efficient, confident development*

## 🚀 Quick Start Workflow

### New Chat Session Protocol
1. **State your goal clearly**: "I want to implement [feature]" or "Fix [issue]"
2. **Use simple commands**: 
   - `@task` - Add to task list
   - `@status` - Check current progress
   - `@backup` - Create backup before major changes
3. **Stay focused**: One feature/fix per chat session

### Essential Commands
```bash
# Development server (already running)
npx next dev

# Quick backup before changes
git add . && git commit -m "Backup before [change description]"

# Check project status
npm run build  # Verify everything works
npm test       # Run tests if available
```

## 📋 Task Management (Simplified)

### Current Task List Location
- **File**: `task-list.md`
- **Status**: Active project with AI Dock Tools enhancement
- **Focus**: Complete existing features before adding new ones

### Task Workflow
1. **Check current tasks**: Open `task-list.md`
2. **Pick ONE task**: Focus on single task completion
3. **Update status**: Mark as in-progress → completed
4. **Test changes**: Verify functionality works
5. **Commit changes**: Save progress with clear message

## 🛡️ Error Prevention & Recovery

### Before Making Changes
```bash
# Create safety checkpoint
git status                    # Check current state
git add .                     # Stage all changes
git commit -m "Checkpoint"    # Create restore point
```

### If Something Breaks
```bash
# Quick recovery options
git status                    # See what changed
git checkout -- [filename]   # Restore single file
git reset --hard HEAD~1       # Go back one commit
```

### Backup Verification
- **Git commits**: Your primary backup system
- **Check history**: `git log --oneline` shows recent commits
- **Restore point**: Every commit is a restore point

## 🎯 Development Best Practices

### File Organization
- **Components**: `src/components/[feature]/`
- **Hooks**: `src/hooks/use-[feature].tsx`
- **Types**: `src/lib/types.ts` or component-specific
- **Utilities**: `src/lib/utils.ts`

### Code Patterns
```typescript
// Component structure
export function ComponentName() {
  // 1. Hooks at top
  // 2. State management
  // 3. Event handlers
  // 4. Return JSX
}

// Hook structure
export function useFeatureName() {
  // 1. State
  // 2. Effects
  // 3. Functions
  // 4. Return object
}
```

### Testing Strategy
1. **Manual testing**: Use the running dev server
2. **Visual verification**: Check UI changes in browser
3. **Console check**: No errors in browser console
4. **Build test**: `npm run build` should succeed

## 🔧 Common Development Scenarios

### Adding New Feature
1. **Plan**: Write brief description in task-list.md
2. **Backup**: `git commit -m "Before adding [feature]"`
3. **Implement**: Create/modify files
4. **Test**: Verify in browser
5. **Commit**: `git commit -m "Add [feature]"`

### Fixing Bug
1. **Identify**: Reproduce the issue
2. **Backup**: Create checkpoint
3. **Debug**: Use browser dev tools
4. **Fix**: Make minimal changes
5. **Verify**: Test the fix
6. **Commit**: Save the fix

### Modifying Existing Feature
1. **Understand**: Read current implementation
2. **Backup**: Create restore point
3. **Modify**: Make incremental changes
4. **Test**: Verify each change
5. **Commit**: Save progress

## 📁 Project Structure Reference

### Key Files
- `src/app/page.tsx` - Main page
- `src/components/playground/` - AI Dock Tools
- `src/hooks/use-ai-dock-settings.tsx` - Settings management
- `task-list.md` - Current project tasks

### Configuration Files
- `package.json` - Dependencies
- `next.config.ts` - Next.js config
- `tailwind.config.ts` - Styling
- `.env` - Environment variables

## 🚨 When You Feel Lost

### Quick Recovery Steps
1. **Check task list**: What was I working on?
2. **Check git log**: What did I last do?
3. **Check browser**: What's currently broken?
4. **Start small**: Pick one simple task
5. **Ask for help**: Describe specific issue

### Effective Prompts
- ❌ "Help me with the app"
- ✅ "Fix the color picker not saving in AI Dock Tools"
- ❌ "Something is broken"
- ✅ "The build fails with error: [specific error message]"

## 🎨 Current Project Context

### What You're Building
- **App Name**: Sparks (AI Prompt Engineering Toolkit)
- **Current Feature**: AI Dock Tools Enhancement
- **Status**: Nearly complete, needs final testing

### Completed Features
- ✅ Color-coded AI tools
- ✅ Custom icon packs
- ✅ Individual tool enable/disable
- ✅ Settings persistence

### Next Steps
1. Test all AI Dock Tools features
2. Fix any remaining bugs
3. Update documentation
4. Plan next feature

## 💡 Pro Tips

### Efficiency Shortcuts
- **Hot reload**: Changes appear instantly in browser
- **Component isolation**: Test components individually
- **Git commits**: Commit early, commit often
- **Browser dev tools**: Your debugging friend

### Avoiding Common Pitfalls
- **Don't skip backups**: Always commit before major changes
- **Don't change too much**: Small, incremental changes
- **Don't ignore errors**: Fix console errors immediately
- **Don't work on multiple features**: Focus on one thing

---

**Remember**: You're building something great. Take it one step at a time, backup frequently, and don't be afraid to experiment. Every expert was once a beginner who kept going.

*This guide replaces all complex rule systems. Keep it simple, stay focused, and build amazing things.*