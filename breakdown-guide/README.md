# Breakdown Guide - React Version

This is the refactored React version of the Go North East Breakdown Guide, converted from a single HTML file to a proper React application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
breakdown-guide/
├── public/          # Static files
├── src/
│   ├── components/  # React components
│   ├── wizards/     # Individual wizard components
│   ├── styles/      # CSS files
│   └── utils/       # Utility functions
└── package.json
```

## Implementation Status

### Fully Implemented
- ✅ InteriorLightsWizard - Complete with all 3 steps

### Placeholder Wizards (Need Implementation)
- 🚧 BrakesWizard
- 🚧 SteeringWizard
- 🚧 OilWarningLightWizard
- 🚧 LooseWheelNutsWizard
- 🚧 ABSLightWizard
- 🚧 And 12 more...

## How to Implement a Wizard

1. Find the wizard content in the original `guide.html` file
2. Copy the `WizardTemplate.js` file in `src/wizards/`
3. Replace the placeholder content with the actual wizard steps
4. Follow the pattern used in `InteriorLightsWizard.js`

## Key Features Maintained

- Same visual design and styling
- Same user flow and navigation
- Session persistence using localStorage
- All safety warnings and SDC compliance
- Print functionality for completion screens

## Next Steps

To complete the migration:
1. Extract the remaining wizard implementations from guide.html
2. Add any missing components
3. Test thoroughly to ensure functionality matches original
4. Deploy using `npm run build`