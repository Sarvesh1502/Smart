# Vidya Vahini - Government Education Platform Guidelines

## Project Overview
Vidya Vahini is a Government of Rajasthan education initiative providing free quality education to rural students, connecting them with urban teachers through low-bandwidth optimized technology.

## Core Principles

### 1. Low Bandwidth Optimization (20-50 KB/s)
- Minimize animations and transitions
- Use simple, lightweight UI components
- Avoid complex gradients and heavy visual effects
- Optimize images and compress all assets
- Implement progressive loading for content
- Display data usage indicators where appropriate

### 2. Government Initiative Branding
- Always emphasize this is a FREE government service
- Include "Government of Rajasthan Education Initiative" in appropriate places
- Avoid commercial language or paid service references
- Use terminology appropriate for public service

### 3. Language Requirements
- All content must be in English
- Clear, simple language for rural users
- Avoid complex technical terms
- Use educational terminology aligned with RBSE curriculum

### 4. Accessibility & Rural User Focus
- Large, clear buttons for touch interaction
- High contrast colors for visibility in various lighting
- Simple navigation structure
- Minimal learning curve for digital literacy

## Technical Guidelines

### Component Design
- Use solid colors instead of gradients where possible
- Minimize hover effects and animations
- Keep component sizes optimized for mobile-first design
- Use standard border-radius (rounded-lg) instead of complex shapes

### Buttons
- Primary: Solid colors (bg-primary, bg-success, etc.)
- Minimal padding and margins
- Clear, action-oriented labels
- No complex transitions or hover effects

### Cards and Layouts
- Clean, simple designs with standard shadows
- Avoid backdrop-blur and complex visual effects
- Use standard Tailwind spacing utilities
- Keep layouts responsive but simple

### Color Usage
- Stick to defined Rajasthani color palette
- Avoid overuse of gradients
- Ensure accessibility compliance
- Use colors meaningfully (success=green, warning=amber, etc.)

## Content Guidelines

### Text Content
- Government service messaging
- Rural-friendly language
- Educational focus
- Clear benefit statements about free access

### Data and Bandwidth Messaging
- Always show data usage awareness
- Emphasize 2G/3G compatibility
- Display file sizes for downloads
- Include network status indicators

## Performance Requirements
- Components should load quickly on slow connections
- Minimize JavaScript bundle size
- Use efficient CSS without complex animations
- Progressive enhancement approach