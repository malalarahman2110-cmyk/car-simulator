# Apex 3D Open World Car Simulator 🏎️💨

An ultra-realistic, fully playable 3D open-world car simulator built from the ground up using **HTML5**, **CSS3**, **JavaScript**, and **Three.js**.

---

## 🌟 Key Features

### 1. 🏙️ Massive Open World
- **Downtown City Grid**: Multi-lane avenues, pedestrian sidewalks, reflective glass skyscrapers, street lamps, and crosswalks.
- **Mountain Range & Tunnel**: High-elevation switchbacks, stone retaining walls, rocky cliffs, and a drivable mountain tunnel.
- **Grand Suspension Bridge**: Towering red suspension bridge spanning across a wide flowing river.
- **Lush Countryside & Forest**: Evergreen pine forests, oak trees, and scenic outer ring highway.
- **Water & Shorelines**: Animated river ripples with dynamic reflections.

### 2. 🚶 Realistic Animated Characters
- **Interactive Human Driver**: Sits inside the driver's bucket seat in a racing suit and helmet. Articulated arms and hands grip the 3D steering wheel and rotate synchronously as you steer left or right!
- **Front Passenger**: Sits in the passenger seat with dynamic head tilt reacting to cornering forces.
- **Pedestrians on Sidewalks**: 14+ animated human pedestrians with bipedal walk cycles (swinging legs, alternating arms) walking along downtown sidewalks, waiting at crosswalks, and strolling near buildings.

### 3. 🚗 4 Luxury & Exotic Supercars
1. **Lamborghini Aventador SVJ**: Stealth fighter wedge silhouette, scissor-door profile, massive rear carbon diffuser, high-pitched screaming V12 sound (350 KM/H top speed).
2. **Ferrari F8 Tributo**: Curvaceous aerodynamic S-Duct hood, twin circular LED taillights, agile drift dynamics, exotic V8 rasp (340 KM/H top speed).
3. **BMW M4 Competition**: Iconic dual kidney grille, sculpted hood bulge, quad exhaust tips, twin-turbo inline-6 engine (305 KM/H top speed).
4. **Mercedes-AMG GT R**: Long sweeping hood, Panamericana vertical chrome grille, muscular rear haunches, deep rumbling AMG bi-turbo V8 (318 KM/H top speed).

### 4. 🎮 True Arcade-Sim Physics & Drift
- Automatic 6-speed transmission + Reverse.
- Lateral tire friction slip: hold **Spacebar** or flick the wheel at high speed to initiate sustained drifts with tire smoke!
- Dynamic suspension roll: body leans into turns, dips on hard braking, and squats under heavy acceleration.
- **Nitro Boost**: Hold **Shift** for a surge of speed with dual exhaust plasma flames and camera FOV warp!
- Collision detection with buildings, bridge pylons, and trees.
- Emergency Reset (**R** key) to flip back upright if overturned.

### 5. 🔊 Procedural Web Audio Engine (100% Offline)
- Realistic multi-harmonic engine synthesizer that tracks RPM from an 800 RPM idle rumble to an 8,500 RPM screaming redline.
- Gear shift delays with momentary torque dip.
- Tire screech noise on drift and lockup.
- Dual-tone automotive horn (**H** key).
- Nitro whoosh and flame crackle.

### 6. 🎥 Dynamic Multi-Camera System
Switch camera angles anytime with the **C** key:
- **Cockpit View**: First-person interior camera behind the steering wheel looking over the dashboard, driver hands, and windshield.
- **Chase View**: Dynamic third-person trailing camera with speed-based distance and drift lag.
- **Hood View**: High-speed camera right on the front grille.
- **Orbit View**: 360-degree rotating drone view.

### 7. ⛅ Dynamic Day / Night & Weather Cycle
Cycle through weather anytime by clicking the weather widget on the HUD:
- ☀️ **Clear Sunny** (Bright noon sunlight with soft shadows)
- 🌅 **Golden Sunset** (Warm twilight hues across the skyline)
- 🌙 **Starry Night** (Dark night with illuminated headlights and street lamps)
- 🌧️ **Heavy Rain** (2,800 animated rain particles and screen water droplets)
- 🌫️ **Mountain Fog** (Atmospheric volumetric fog)

---

## 🕹️ Controls Guide

| Action | PC Keyboard | Mobile Touch |
| :--- | :--- | :--- |
| **Accelerate / Throttle** | `W` or `↑` Up Arrow | `GAS` Pedal |
| **Brake / Reverse** | `S` or `↓` Down Arrow | `BRAKE` Pedal |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | `◀` / `▶` Buttons |
| **Handbrake & Drift** | `SPACEBAR` | `BRAKE` (at speed) |
| **Nitro Boost 🔥** | `SHIFT` (Hold) | `🔥 NITRO` Button |
| **Change Camera** | `C` Key | Camera Icon Button |
| **Car Horn 📢** | `H` Key | Horn Icon Button |
| **Headlights 💡** | `L` Key | Lightbulb Icon Button |
| **Reset Vehicle** | `R` Key | Reset Icon Button |
| **Pause Menu** | `ESC` or `P` | Pause Icon Button |

---

## 🚀 How to Run the Game

### Method 1: 1-Click Desktop Launcher (Recommended)
Double-click:
```
start-car-simulator.bat
```
This starts a local high-performance WebGL server and opens the game directly in your default browser at `http://localhost:8080`.

### Method 2: Direct File Open
Double-click `index.html` to run directly in Google Chrome, Microsoft Edge, or Firefox.

### Method 3: Command Line
```powershell
cd C:\Users\USER\Desktop\car-simulator
python -m http.server 8080
```
Then navigate to `http://localhost:8080`.

