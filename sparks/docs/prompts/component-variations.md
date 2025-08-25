# Sparks Component-Specific Branding Variations

This file contains Whisk prompts for generating branded UI components based on actual Sparks application components with different color schemes, typography, and visual treatments.

## 1. Welcome Banner Component

### Original Sparks Fire Theme
```jsx
<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-lg shadow-primary/5 backdrop-blur-sm">
  <div className="absolute inset-0 opacity-5">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_0%,transparent_50%)]" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
  </div>
  <CardContent className="relative p-6 sm:p-8">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome!</h1>
    </div>
  </CardContent>
</Card>
```

**Whisk Prompt:**
```
Create a modern welcome banner component with fire gradient theme. Use orange-red gradient (#FF6B35 to #F7931E), Space Grotesk font for heading, glass morphism effect with backdrop blur, floating flame icon, subtle particle effects, rounded corners, and warm glow shadows. Include sparkles icon and "Welcome!" text. Modern UI design, clean layout.
```

### Ocean Blue Variation
**Whisk Prompt:**
```
Create a modern welcome banner component with ocean blue theme. Use blue gradient (#0EA5E9 to #3B82F6), Inter font for heading, glass morphism effect with backdrop blur, floating wave icon, subtle bubble effects, rounded corners, and cool blue glow shadows. Include water droplet icon and "Welcome!" text. Clean modern UI design.
```

### Purple Innovation Variation
**Whisk Prompt:**
```
Create a modern welcome banner component with purple innovation theme. Use purple gradient (#8B5CF6 to #A855F7), Orbitron font for heading, glass morphism effect with backdrop blur, floating crystal icon, subtle energy effects, rounded corners, and purple glow shadows. Include gem icon and "Welcome!" text. Futuristic UI design.
```

## 2. Settings Card Component

### Original Sparks Fire Theme
```jsx
<Card className="bg-card backdrop-blur-xl border border-border shadow-xl rounded-2xl overflow-hidden">
  <CardHeader className="bg-muted border-b border-border">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary shadow-lg">
        <User className="w-5 h-5 text-primary-foreground" />
      </div>
      <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
    </div>
  </CardHeader>
  <CardContent className="p-6 space-y-6">
    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6">
      Save Changes
    </Button>
  </CardContent>
</Card>
```

**Whisk Prompt:**
```
Create a modern settings card component with fire gradient theme. Use orange-red colors (#FF6B35), Space Grotesk font, glass morphism card with backdrop blur, rounded icon container with flame gradient, "Profile Information" title, form inputs with rounded corners, and gradient save button. Clean professional layout with subtle shadows.
```

### Forest Green Variation
**Whisk Prompt:**
```
Create a modern settings card component with forest green theme. Use green colors (#10B981 to #059669), Inter font, glass morphism card with backdrop blur, rounded icon container with leaf gradient, "Profile Information" title, form inputs with rounded corners, and gradient save button. Natural clean layout with soft shadows.
```

### Monochrome Variation
**Whisk Prompt:**
```
Create a modern settings card component with monochrome theme. Use grayscale colors (#374151 to #111827), Helvetica Neue font, glass morphism card with backdrop blur, rounded icon container with subtle gradient, "Profile Information" title, form inputs with rounded corners, and elegant save button. Minimalist professional layout.
```

## 3. Stats Overview Component

### Original Sparks Fire Theme
```jsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <span className="text-lg">📊</span>
      Statistics Overview
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        12%
      </Badge>
      <Progress value={75} className="h-2" />
    </div>
  </CardContent>
</Card>
```

**Whisk Prompt:**
```
Create a modern statistics overview card with fire gradient theme. Use orange-red colors (#FF6B35), Space Grotesk font for title, glass morphism card, chart emoji icon, progress bars with flame gradient, trending badges with fire colors, clean data visualization layout with rounded corners and subtle shadows.
```

### Cyberpunk Variation
**Whisk Prompt:**
```
Create a futuristic statistics overview card with cyberpunk theme. Use neon colors (#00FFFF to #FF00FF), JetBrains Mono font, dark glass morphism card, holographic chart icon, progress bars with neon gradient, glowing trending badges, sci-fi data visualization with sharp edges and neon glow effects.
```

### Rose Gold Variation
**Whisk Prompt:**
```
Create an elegant statistics overview card with rose gold theme. Use rose gold colors (#E91E63 to #F8BBD9), Playfair Display font, luxury glass morphism card, elegant chart icon, progress bars with rose gold gradient, sophisticated trending badges, premium layout with soft curves and warm metallic shadows.
```

## 4. Button Component Variations

### Original Fire Theme Button
**Whisk Prompt:**
```
Create modern button components with fire gradient theme. Primary button: orange-red gradient (#FF6B35 to #F7931E), white text, rounded corners, hover glow effect. Secondary button: transparent with fire border, fire text color. Ghost button: subtle fire background on hover. Include all states: default, hover, active, disabled.
```

### Ocean Blue Button
**Whisk Prompt:**
```
Create modern button components with ocean blue theme. Primary button: blue gradient (#0EA5E9 to #3B82F6), white text, rounded corners, wave hover effect. Secondary button: transparent with blue border, blue text. Ghost button: subtle blue background on hover. Include all states with water-inspired animations.
```

### Arctic Blue Button
**Whisk Prompt:**
```
Create modern button components with arctic blue theme. Primary button: ice blue gradient (#60A5FA to #93C5FD), dark text, rounded corners, frost hover effect. Secondary button: transparent with ice border, ice blue text. Ghost button: subtle frost background on hover. Include all states with ice-inspired effects.
```

## 5. Badge Component Variations

### Original Fire Theme Badge
**Whisk Prompt:**
```
Create modern badge components with fire gradient theme. Default badge: fire gradient background (#FF6B35), white text, rounded pill shape. Secondary badge: muted fire background, dark text. Outline badge: fire border, fire text. Include status badges for success, warning, error with flame-inspired colors.
```

### Purple Innovation Badge
**Whisk Prompt:**
```
Create modern badge components with purple innovation theme. Default badge: purple gradient background (#8B5CF6), white text, rounded pill shape. Secondary badge: muted purple background, dark text. Outline badge: purple border, purple text. Include status badges with crystal-inspired purple variations.
```

### Sunset Orange Badge
**Whisk Prompt:**
```
Create modern badge components with sunset orange theme. Default badge: sunset gradient background (#FB923C to #F97316), white text, rounded pill shape. Secondary badge: muted orange background, dark text. Outline badge: orange border, orange text. Include status badges with warm sunset color variations.
```

## 6. Card Component Layout Variations

### Dashboard Card Grid - Fire Theme
**Whisk Prompt:**
```
Create a dashboard card grid layout with fire gradient theme. 3x2 grid of cards, each with glass morphism effect, fire gradient borders, Space Grotesk typography, flame icons, orange-red color scheme (#FF6B35), backdrop blur, rounded corners, hover glow effects, and subtle fire particle animations.
```

### Dashboard Card Grid - Forest Theme
**Whisk Prompt:**
```
Create a dashboard card grid layout with forest green theme. 3x2 grid of cards, each with glass morphism effect, green gradient borders, Inter typography, leaf icons, forest green color scheme (#10B981), backdrop blur, rounded corners, hover grow effects, and subtle nature-inspired animations.
```

### Dashboard Card Grid - Luxury Theme
**Whisk Prompt:**
```
Create a dashboard card grid layout with luxury rose gold theme. 3x2 grid of cards, each with premium glass morphism effect, rose gold gradient borders, Crimson Text typography, elegant icons, rose gold color scheme (#E91E63), backdrop blur, rounded corners, hover shimmer effects, and sophisticated metallic animations.
```

## 7. Navigation Component Variations

### Sidebar Navigation - Fire Theme
**Whisk Prompt:**
```
Create a modern sidebar navigation with fire gradient theme. Vertical layout, glass morphism background, fire gradient accent (#FF6B35), Space Grotesk font, flame icons for menu items, hover fire glow effects, active state with fire background, rounded menu items, and subtle fire particle trail animations.
```

### Sidebar Navigation - Cyberpunk Theme
**Whisk Prompt:**
```
Create a futuristic sidebar navigation with cyberpunk theme. Vertical layout, dark glass morphism background, neon accent (#00FFFF), JetBrains Mono font, holographic icons, hover neon glow effects, active state with neon background, sharp edges, and electric pulse animations.
```

## Implementation Guidelines

### Color System Integration
- Each variation maintains the same component structure
- Color tokens are swapped systematically
- Gradients follow the same direction and opacity patterns
- Hover states maintain consistent interaction patterns

### Typography Consistency
- Font weights remain consistent across variations
- Line heights and spacing maintain readability
- Font sizes scale proportionally
- Letter spacing adjusted per font family

### Animation & Effects
- Transition durations remain consistent (300ms)
- Hover effects scale appropriately to theme
- Focus states maintain accessibility standards
- Loading states adapt to color scheme

### Accessibility Compliance
- All color combinations meet WCAG AA contrast ratios
- Focus indicators remain visible in all themes
- Color is not the only means of conveying information
- Text remains readable in all variations

### Usage Context
- **Fire Theme**: Default brand identity, energy, innovation
- **Ocean Blue**: Trust, stability, professional services
- **Purple Innovation**: Creativity, technology, premium features
- **Forest Green**: Sustainability, growth, natural products
- **Monochrome**: Elegance, simplicity, accessibility
- **Cyberpunk**: Gaming, tech, futuristic applications
- **Rose Gold**: Luxury, premium, fashion applications
- **Arctic Blue**: Clean, minimal, healthcare applications

These component variations maintain the core Sparks design system while offering flexibility for different brand expressions and use cases.