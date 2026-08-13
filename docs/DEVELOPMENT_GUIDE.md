# Development Guide

This guide covers how to set up, develop, test, and contribute to the Suspension Cable Analyzer project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Development Workflow](#development-workflow)
4. [Code Organization](#code-organization)
5. [Coding Standards](#coding-standards)
6. [Adding New Features](#adding-new-features)
7. [Testing](#testing)
8. [Building for Production](#building-for-production)
9. [Contributing](#contributing)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.0+ | JavaScript runtime |
| npm | 9.0+ | Package manager |
| Git | 2.30+ | Version control |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code | IDE with TypeScript support |
| ESLint extension | Code linting |
| Prettier extension | Code formatting |
| React DevTools | Browser debugging |

---

## Project Setup

### Clone Repository

```bash
git clone https://github.com/your-org/suspension-cable-analyzer.git
cd suspension-cable-analyzer
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Development Workflow

### Daily Development

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Make changes** — hot reload updates the browser automatically

5. **Test your changes** in the browser

6. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: description of change"
   ```

7. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```
feat(solver): add temperature effect calculation
fix(diagram): correct cable endpoint positioning
docs(api): update pulley calculator documentation
```

---

## Code Organization

### Directory Structure

```
src/
├── components/          # React UI components
│   ├── layout/          # App-level layout
│   ├── inputs/          # Input form components
│   ├── diagrams/        # SVG visualization
│   ├── charts/          # Recharts graphs
│   ├── results/         # Results display
│   └── calculations/    # Calculation trace
│
├── engine/              # Pure calculation engine
│   ├── cable/           # Cable solver
│   ├── pulley/          # Pulley forces
│   ├── deadBlock/       # Dead block stability
│   ├── temperature/     # Thermal effects
│   ├── stress/          # Stress calculations
│   └── checks/          # Engineering checks
│
├── models/              # TypeScript interfaces
│   └── types.ts
│
├── store/               # State management
│   └── useProjectStore.ts
│
└── utils/               # Utility functions
```

### Module Guidelines

#### Components (`src/components/`)

- One component per file
- Use functional components with hooks
- Keep components focused (single responsibility)
- Use Tailwind CSS for styling

```typescript
// Good: Focused component
const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="mb-2">
      <label className="text-xs font-medium">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
};
```

#### Engine (`src/engine/`)

- Pure functions only (no side effects)
- No React or browser dependencies
- Explicit input/output interfaces
- Include calculation steps for transparency

```typescript
// Good: Pure calculation function
export function calculateHorizontalTension(
  load: number,
  span: number,
  loadPosition: number,
  sag: number
): { H: number; steps: CalculationStep[] } {
  const a = loadPosition;
  const b = span - loadPosition;
  const H = (load * a * b) / (span * sag);
  
  return {
    H,
    steps: [{
      title: 'Horizontal Tension',
      equation: 'H = \\frac{P \\cdot a \\cdot b}{L \\cdot f}',
      variables: [...],
      result: { name: 'H', value: H, unit: 'kN' }
    }]
  };
}
```

#### Store (`src/store/`)

- Use Zustand for state management
- Keep actions close to state
- Trigger analysis automatically on input changes

```typescript
// Action pattern
updateGeometry: (geo) => {
  set((state) => ({
    project: {
      ...state.project,
      geometry: { ...state.project.geometry, ...geo },
    },
  }));
  get().runAnalysis();  // Auto-trigger analysis
},
```

---

## Coding Standards

### TypeScript

- Use strict mode
- Define explicit interfaces for all data structures
- Avoid `any` type (use `unknown` if needed)
- Document public functions with JSDoc

```typescript
/**
 * Calculates cable profile for given horizontal tension.
 * @param geometry - Cable geometry definition
 * @param H - Horizontal tension (kN)
 * @returns Array of profile points
 */
function computeProfile(geometry: CableGeometry, H: number): ProfilePoint[] {
  // ...
}
```

### React

- Use functional components
- Use hooks for state and effects
- Memoize expensive computations
- Keep render logic simple

```typescript
// Good: Memoized computation
const cablePath = useMemo(() => {
  if (!solverResult) return '';
  return solverResult.points.map(p => `${p.x},${p.y}`).join(' ');
}, [solverResult]);
```

### CSS (Tailwind)

- Use Tailwind utility classes
- Group related classes logically
- Use consistent spacing scale
- Create reusable patterns

```tsx
// Good: Organized Tailwind classes
<div className={`
  flex items-center justify-between
  px-3 py-2
  bg-white border border-slate-200 rounded-lg
  hover:bg-slate-50 transition
`}>
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CableDiagram.tsx` |
| Utilities | camelCase | `cableSolver.ts` |
| Types | PascalCase | `types.ts` |
| Tests | `*.test.ts` | `cableSolver.test.ts` |

---

## Adding New Features

### Adding a New Calculation

1. **Define interfaces** in `src/models/types.ts`:
   ```typescript
   export interface NewCalculationResult {
     value1: number;
     value2: number;
   }
   ```

2. **Implement calculation** in `src/engine/newModule/newCalc.ts`:
   ```typescript
   export function calculateNewThing(input: Input): {
     result: NewCalculationResult;
     steps: CalculationStep[];
   } {
     // Pure calculation logic
   }
   ```

3. **Add to store** in `src/store/useProjectStore.ts`:
   ```typescript
   // Add state
   newResult: NewCalculationResult | null;
   
   // Add to runAnalysis()
   const newCalc = calculateNewThing(input);
   set({ newResult: newCalc.result });
   ```

4. **Create UI component** to display results

5. **Add tests** (when test framework added)

### Adding a New Input Field

1. **Update interface** if needed:
   ```typescript
   interface CableProperties {
     // ... existing
     newProperty: number;  // Add new property
   }
   ```

2. **Update defaults** in store

3. **Add input component**:
   ```tsx
   <NumberInput
     label="New Property"
     value={cable.newProperty}
     onChange={(v) => updateCable({ newProperty: v })}
     unit="units"
   />
   ```

4. **Use in calculations**

### Adding a New Chart

1. **Create chart component** in `src/components/charts/`:
   ```typescript
   const NewChart: React.FC = () => {
     const { solverResult } = useProjectStore();
     
     const data = useMemo(() => {
       // Transform data for chart
     }, [solverResult]);
     
     return (
       <ResponsiveContainer>
         <LineChart data={data}>
           {/* Chart elements */}
         </LineChart>
       </ResponsiveContainer>
     );
   };
   ```

2. **Add to ChartsPanel.tsx**

3. **Add tab button**

---

## Testing

### Testing Strategy

| Layer | Test Type | Tools |
|-------|-----------|-------|
| Engine | Unit tests | Vitest |
| Components | Component tests | Vitest + React Testing Library |
| Integration | E2E tests | Playwright (future) |

### Writing Unit Tests

```typescript
// src/engine/cable/__tests__/cableSolver.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePointLoadCable } from '../cableSolver';

describe('calculatePointLoadCable', () => {
  it('calculates correct H for centered load', () => {
    const result = calculatePointLoadCable(100, 500, 50, 10);
    expect(result.H).toBeCloseTo(1250, 1);
  });

  it('satisfies equilibrium', () => {
    const result = calculatePointLoadCable(100, 500, 30, 10);
    expect(result.Va + result.Vb).toBeCloseTo(500, 1);
  });
});
```

### Benchmark Cases

Validate against known analytical solutions:

| Case | Parameters | Expected H |
|------|------------|------------|
| Centered point load | P=550kN, L=104m, f=10.4m | 1375 kN |
| UDL only | w=1kN/m, L=100m, f=5m | 250 kN |
| Eccentric load | P=500kN, L=100m, a=30m, f=10m | 1050 kN |

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- cableSolver.test.ts
```

---

## Building for Production

### Build Command

```bash
npm run build
```

### Build Output

```
dist/
└── index.html    # Single-file application (inlined JS/CSS)
```

### Optimization Notes

- Vite bundles and minifies all code
- `vite-plugin-singlefile` inlines everything into one HTML file
- Tree-shaking removes unused code

### Verifying Build

```bash
npm run preview
```

Check:
- All features work
- No console errors
- Performance is acceptable

---

## Contributing

### Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what and why
- **Tests**: Include tests for new features
- **Documentation**: Update docs if needed

### Code Review Checklist

- [ ] Code follows project style
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Documentation updated

### Reporting Issues

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser/Node version

---

## Debugging Tips

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Inspect component props and state

### Zustand DevTools

```typescript
// Add devtools middleware (development only)
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({
    // ... store
  }))
);
```

### Console Debugging

```typescript
// In store's runAnalysis
console.log('Analysis input:', { geometry, cable, pointLoads });
console.log('Solver result:', solverResult);
```

### Performance Profiling

1. Open DevTools → Performance tab
2. Record while interacting
3. Analyze flame chart

---

## Environment Variables

Currently none required. Future considerations:

```env
# .env.local
VITE_API_URL=https://api.example.com
VITE_DEBUG_MODE=true
```

---

## Deployment

### Static Hosting

The built `dist/index.html` can be hosted on:
- GitHub Pages
- Netlify
- Vercel
- Any static file server

### Example: GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Resources

### Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Recharts Documentation](https://recharts.org/)

### Engineering References

- *Structural Analysis* by Hibbeler
- *Cable Structures* by Buchholdt
- *Theory of Elastic Stability* by Timoshenko

---

*Happy coding! 🚀*
