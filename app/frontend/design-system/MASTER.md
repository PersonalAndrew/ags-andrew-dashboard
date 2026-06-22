# Design System — SofaScore Player Dashboard

## Brand
- **Product:** Dashboard de Performance Esportiva (Futebol)
- **Tone:** Premium, analítico, moderno

## Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-color` | `#0f172a` | Background principal |
| `--text-main` | `#f8fafc` | Texto primário |
| `--text-muted` | `#94a3b8` | Texto secundário |
| `--accent` | `#10b981` | Cor de destaque (verde esmeralda) |
| `--accent-light` | `#34d399` | Variação clara do accent |
| `--panel-bg` | `rgba(30,41,59,0.7)` | Fundo dos painéis glassmorphism |
| `--panel-border` | `rgba(255,255,255,0.1)` | Borda dos painéis |

## Typography
- **Font:** Outfit (Google Fonts)
- **Weights:** 300 (light), 400 (regular), 600 (semibold), 800 (extrabold)

## Effects
- **Glassmorphism:** `backdrop-filter: blur(12px)` + bordas translúcidas
- **Hover:** Elevação em Y (-5px) + glow verde (`box-shadow`)
- **Animations:** `fadeInDown` (header), `fadeInUp` (painéis)

## Architecture
- **Stack:** Vanilla JS + ES Modules (sem bundler)
- **Charting:** Chart.js (CDN)
- **CSS:** Modular (base + components + animations)
- **JS:** OOP com classes (SOLID)

## Anti-Patterns (evitar)
- Emojis como ícones (usar SVGs)
- Dependência de build tooling desnecessário
- Acoplamento entre API e componentes de UI
