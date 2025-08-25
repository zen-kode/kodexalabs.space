# Sparks - Trae IDE Rules Configuration

This directory contains the AI-powered rules and configuration for the Sparks AI Prompt Engineering Toolkit when used with Trae IDE.

## 📁 Directory Structure

```
.codellm/
├── trae-config.json          # Main Trae IDE configuration
├── README.md                 # This documentation
└── rules/                    # AI rules directory
    ├── 666_rule_-_advanced_task_list_orchestrator.mdc
    ├── ai_project_health_oracle.mdc
    ├── debug_&_organize_master.mdc
    ├── guide_me.mdc
    ├── smart_backup_with_versioning.mdc
    ├── theme_style_guide.mdc
    ├── uiexpert.mdc
    └── x2_rule_checker.mdc
```

## 🚀 Quick Start

### 1. Trae IDE Integration

The `trae-config.json` file automatically configures Trae IDE to:
- Recognize and load all rule files
- Set up proper file pattern matching
- Configure AI context for the Sparks project
- Enable workflow automation

### 2. Available Rules

#### 🎯 **Task Management**
- **`666_rule_-_advanced_task_list_orchestrator.mdc`**
  - **Trigger**: `@666` (exact match, case-insensitive)
  - **Purpose**: Ultra-precise task list synchronization with enterprise-grade robustness
  - **Features**: Dependency management, conflict resolution, progress tracking

#### 🔍 **Project Guidance**
- **`guide_me.mdc`**
  - **Trigger**: Keywords like "guide me", "help", "lost", "stuck"
  - **Purpose**: Analyzes current status and provides clear direction
  - **Features**: Workflow analysis, blocker detection, personalized guidance

#### 🏥 **Health Monitoring**
- **`ai_project_health_oracle.mdc`**
  - **Trigger**: On project open or manual activation
  - **Purpose**: Advanced project monitoring and predictive maintenance
  - **Features**: Machine learning analytics, automated issue detection

#### 🎨 **UI & Design**
- **`uiexpert.mdc`**
  - **Purpose**: Interactive UI design system with aesthetic selection
  - **Features**: iOS/Material/Windows design paradigms, accessibility compliance

- **`theme_style_guide.mdc`**
  - **Purpose**: Ensures styling consistency across the application
  - **Auto-applies**: To all CSS and UI component files

#### 🔧 **Development Tools**
- **`smart_backup_with_versioning.mdc`**
  - **Purpose**: Automated backup system with intelligent versioning
  - **Schedule**: Daily, weekly, monthly backups
  - **Features**: Google Drive integration, conflict resolution

- **`debug_&_organize_master.mdc`**
  - **Purpose**: Advanced debugging and code organization

- **`x2_rule_checker.mdc`**
  - **Purpose**: Rule validation and consistency checking

## 🎮 Usage Examples

### Task Management
```bash
# Activate advanced task orchestrator
@666
```

### Get Guidance
```bash
# Any of these will trigger guidance
"I'm feeling lost"
"guide me"
"I need help"
"I'm stuck"
```

### Health Check
- Automatically runs when opening the project
- Can be manually triggered through Trae IDE

## 🔧 Configuration Details

### File Patterns
The rules are configured to monitor:
- **Source Code**: `src/**/*.{ts,tsx,js,jsx}`
- **Components**: `components/**/*.{ts,tsx}`
- **AI Flows**: `ai/flows/**/*.ts`
- **Configuration**: `*.config.{ts,js,mjs}`, `package.json`
- **Documentation**: `docs/**/*.md`, `README.md`
- **Tasks**: `task-list.md`, `memory-bank/**/*.md`

### AI Context
The configuration provides Trae IDE with context about:
- **Project Type**: AI Prompt Engineering Toolkit
- **Technologies**: Next.js 15, TypeScript, Firebase Genkit, Google AI
- **Architecture**: App Router, Server Actions, Component-based UI
- **Core Features**: Interactive Playground, AI-Powered Tools, Analysis

### Development Workflow
- **Enhanced Dev Server**: Interactive CLI with backend selection (`npm run dev`)
- **Auto-Detection**: Automatic backend detection (`npm run dev:auto`)
- **Direct Selection**: Firebase (`npm run dev:firebase`) or Supabase (`npm run dev:supabase`)
- **Development Utilities**: Status check (`npm run dev:status`) and setup (`npm run dev:setup`)
- **Fallback Options**: Simple server on port 9002 (`npm run dev:simple`)
- **Genkit Dev**: Auto-port (`npm run genkit:dev`)
- **Backup**: Daily automated backups enabled

## 🛠️ Customization

### Adding New Rules
1. Create a new `.mdc` file in the `rules/` directory
2. Follow the existing format with frontmatter:
   ```markdown
   ---
   description: Your rule description
   globs: file patterns to match
   alwaysApply: true/false
   ---
   
   Your rule content here
   ```
3. Update `trae-config.json` priority order if needed

### Modifying Triggers
Edit the `triggers` section in `trae-config.json`:
```json
{
  "triggers": {
    "your_trigger": {
      "pattern": "your_pattern",
      "type": "exact_match|regex|keyword",
      "case_sensitive": false
    }
  }
}
```

## 📊 Project Context

### Sparks AI Toolkit Overview
- **Framework**: Next.js 15 with App Router
- **AI Integration**: Firebase Genkit + Google AI (Gemini 2.0 Flash)
- **UI**: Tailwind CSS + Radix UI components
- **Authentication**: Firebase Auth (mock system for demo)
- **Core Features**:
  - Interactive Playground for prompt engineering
  - AI-powered prompt analysis, enhancement, cleaning
  - Prompt organization and categorization
  - Dashboard with recent prompts and guidance
  - Community features for prompt sharing

### Key Directories
- `src/ai/flows/` - AI processing workflows
- `src/components/` - React components (auth, dashboard, playground, shared, ui)
- `src/app/` - Next.js App Router pages
- `src/lib/` - Utilities and type definitions

## 🔄 Version History

- **v1.0.0** (2024-12-19): Initial Trae IDE configuration setup
  - Created base configuration file
  - Documented all existing rules
  - Set up file patterns and triggers
  - Configured AI context and workflow

## 🤝 Contributing

When adding or modifying rules:
1. Test the rule with relevant file patterns
2. Update this README with new rule documentation
3. Increment version in `trae-config.json`
4. Add version history entry

## 📞 Support

For issues with:
- **Rule execution**: Check file patterns in `trae-config.json`
- **Trigger activation**: Verify trigger patterns and case sensitivity
- **Performance**: Review `globs` patterns for efficiency
- **Integration**: Ensure Trae IDE recognizes the configuration

---

*This configuration is optimized for the Sparks AI Prompt Engineering Toolkit and Trae IDE integration.*