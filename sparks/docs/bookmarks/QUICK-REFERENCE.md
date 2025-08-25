# Quick Reference - Sparks Development

*Essential shortcuts and commands for efficient development*

## 🚀 Daily Startup Routine

```bash
# 1. Check backup status
.\scripts\backup-check.ps1

# 2. Start development server (if not running)
npx next dev

# 3. Open browser to http://localhost:3000
```

## ⚡ Essential Commands

### Git & Backup
```bash
# Quick backup before changes
git add . && git commit -m "Checkpoint - $(Get-Date -Format 'HH:mm')"

# Check what changed
git status
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Restore single file
git checkout -- [filename]

# See recent commits
git log --oneline -5
```

### Development
```bash
# Start dev server
npx next dev

# Build project (test for errors)
npm run build

# Install dependencies
npm install

# Clear Next.js cache (if issues)
rm -rf .next
```

### Task Management
```bash
# Simple task commands in chat:
@task [description]     # Add new task
@status                # Check progress
@complete [task]       # Mark completed
```

## 🎯 Keyboard Shortcuts

### Trae IDE
- `Ctrl + Shift + P` - Command palette
- `Ctrl + P` - Quick file open
- `Ctrl + /` - Toggle comment
- `Ctrl + D` - Select next occurrence
- `Ctrl + Shift + L` - Select all occurrences

### Browser DevTools
- `F12` - Open DevTools
- `Ctrl + Shift + C` - Inspect element
- `Ctrl + Shift + J` - Console
- `Ctrl + R` - Refresh page
- `Ctrl + Shift + R` - Hard refresh

## 📁 File Navigation

### Key Files (Quick Access)
```
# Main development files
src/app/page.tsx                    # Main page
src/components/playground/          # AI Dock Tools
src/hooks/use-ai-dock-settings.tsx  # Settings hook

# Documentation
TRAE-DEVELOPMENT-GUIDE.md           # Main guide
DOCUMENTATION-INDEX.md             # Find anything
task-list.md                       # Current tasks

# Configuration
package.json                       # Dependencies
next.config.ts                     # Next.js config
tailwind.config.ts                 # Styling
.env                              # Environment
```

## 🔧 Common Patterns

### React Component Template
```typescript
export function ComponentName() {
  // 1. Hooks
  const [state, setState] = useState()
  
  // 2. Effects
  useEffect(() => {
    // side effects
  }, [])
  
  // 3. Handlers
  const handleClick = () => {
    // event handling
  }
  
  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Custom Hook Template
```typescript
export function useFeatureName() {
  // 1. State
  const [data, setData] = useState()
  
  // 2. Effects
  useEffect(() => {
    // initialization
  }, [])
  
  // 3. Functions
  const updateData = (newData) => {
    setData(newData)
  }
  
  // 4. Return
  return {
    data,
    updateData
  }
}
```

## 🚨 Troubleshooting

### Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|----------|
| **Build fails** | `rm -rf .next && npm run build` |
| **Changes not showing** | Hard refresh browser (`Ctrl+Shift+R`) |
| **TypeScript errors** | Check imports and types |
| **Styles not applying** | Check Tailwind classes |
| **Server won't start** | Kill process and restart |
| **Git issues** | `git status` then follow prompts |

### Error Messages
```bash
# If port 3000 is busy
npx kill-port 3000
npx next dev

# If node_modules issues
rm -rf node_modules package-lock.json
npm install

# If TypeScript issues
npx tsc --noEmit  # Check types only
```

## 💡 Productivity Tips

### Development Flow
1. **One task at a time** - Focus prevents confusion
2. **Commit every 15-30 minutes** - Small, safe steps
3. **Test immediately** - Don't accumulate issues
4. **Use browser DevTools** - Debug in real-time
5. **Keep console clean** - Fix errors as they appear

### Code Organization
- **Group related files** - Keep components together
- **Use descriptive names** - `useAiDockSettings` not `useSettings`
- **Extract reusable logic** - Custom hooks for complex state
- **Keep components small** - Single responsibility

### Debugging Strategy
1. **Read the error message** - It usually tells you what's wrong
2. **Check the browser console** - Look for JavaScript errors
3. **Use `console.log()`** - Debug values and flow
4. **Check Network tab** - For API issues
5. **Isolate the problem** - Comment out code to narrow down

## 🎨 Current Project Context

### AI Dock Tools (Current Focus)
- **Location**: `src/components/playground/`
- **Key Files**: 
  - `enhanced-tools-dock.tsx` - Main component
  - `ai-dock-types.ts` - Type definitions
- **Hook**: `src/hooks/use-ai-dock-settings.tsx`
- **Features**: Color coding, icon packs, enable/disable

### Quick Test Checklist
- [ ] Color picker works
- [ ] Icon packs switch correctly
- [ ] Tools can be enabled/disabled
- [ ] Settings persist on refresh
- [ ] No console errors

## 📞 Getting Help

### Effective Questions
- ❌ "It's broken"
- ✅ "The color picker in AI Dock Tools doesn't save the selected color"

- ❌ "Help with the app"
- ✅ "How do I add a new icon pack to the AI Dock Tools?"

### Include This Info
1. **What you were trying to do**
2. **What happened instead**
3. **Any error messages** (exact text)
4. **Which file you were working on**
5. **Recent changes you made**

---

**Keep this reference handy! Bookmark it for quick access during development.**

*Remember: You're building something amazing. Take it step by step, and don't be afraid to experiment!* 🚀