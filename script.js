/**
 * ==========================================================================
 * APEX 3D OPEN WORLD CAR SIMULATOR
 * Ultra-realistic WebGL 3D Driving Simulator using Three.js & Web Audio API
 * ==========================================================================
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & CONSTANTS
  // ---------------------------------------------------------------------------
  const WORLD_SIZE = 1600;
  const HALF_WORLD = WORLD_SIZE / 2;

  // Car Specifications Library
  const CAR_MODELS = [
    {
      id: 'lambo',
      brand: 'ITALIAN HYPERCAR',
      name: 'Lamborghini Aventador SVJ',
      desc: 'Ultra-aerodynamic V12 AWD hypercar with razor-sharp handling, extreme top speed, and aggressive stealth jet styling.',
      topSpeed: 350, // km/h
      accel: 2.8,   // 0-100 s
      handling: 9.5,
      weight: 1525,  // kg
      soundType: 'v12',
      defaultColor: 0x00f0ff,
      colors: [0x00f0ff, 0x10b981, 0xff7700, 0xff2255, 0xffb700, 0xffffff, 0x111827]
    },
    {
      id: 'ferrari',
      brand: 'SCUDERIA EXOTIC',
      name: 'Ferrari F8 Tributo',
      desc: 'Mid-engine Italian masterpiece with aerodynamic S-Duct, responsive twin-turbo V8, and exhilarating drift dynamics.',
      topSpeed: 340,
      accel: 2.9,
      handling: 9.7,
      weight: 1435,
      soundType: 'v8_exotic',
      defaultColor: 0xff2244,
      colors: [0xff2244, 0xffb700, 0x0077ff, 0xffffff, 0x1e293b, 0x6366f1]
    },
    {
      id: 'bmw',
      brand: 'BAVARIAN MOTOR SPORT',
      name: 'BMW M4 Competition',
      desc: 'Precision engineered German sports coupe with dual kidney grille, twin-turbo inline-6 engine, and balanced rear-wheel agility.',
      topSpeed: 305,
      accel: 3.5,
      handling: 9.2,
      weight: 1725,
      soundType: 'inline6',
      defaultColor: 0x0077ff,
      colors: [0x0077ff, 0xffffff, 0xffb700, 0x111827, 0xef4444, 0x64748b]
    },
    {
      id: 'mercedes',
      brand: 'AMG PERFORMANCE',
      name: 'Mercedes-AMG GT R',
      desc: 'Handcrafted muscle powerhouse with Panamericana grille, muscular rear haunches, and deep throaty AMG bi-turbo V8 rumble.',
      topSpeed: 318,
      accel: 3.2,
      handling: 9.3,
      weight: 1630,
      soundType: 'v8_muscle',
      defaultColor: 0x22c55e,
      colors: [0x22c55e, 0x64748b, 0xffffff, 0x0f172a, 0xf59e0b, 0xd946ef]
    }
  ];

  // ---------------------------------------------------------------------------
  // 2. PROCEDURAL WEB AUDIO SYNTHESIZER (100% Offline & Reliable)
  // ---------------------------------------------------------------------------
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.initialized = false;
      this.enabled = true;

      // Engine sound nodes
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineGain = null;
      this.engineFilter = null;

      // Skid noise
      this.skidGain = null;
      this.skidFilter = null;

      // Nitro & Horn
      this.nitroGain = null;
      this.hornOsc1 = null;
      this.hornOsc2 = null;
      this.hornGain = null;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // 1. Engine Synthesizer Nodes
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineFilter = this.ctx.createBiquadFilter();

        this.engineOsc1.type = 'sawtooth';
        this.engineOsc2.type = 'triangle';
        this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
        this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc1.start();
        this.engineOsc2.start();

        // 2. Tire Skid Noise Generator
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        this.skidFilter = this.ctx.createBiquadFilter();
        this.skidFilter.type = 'bandpass';
        this.skidFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        this.skidFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        this.skidGain = this.ctx.createGain();
        this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

        whiteNoise.connect(this.skidFilter);
        this.skidFilter.connect(this.skidGain);
        this.skidGain.connect(this.ctx.destination);
        whiteNoise.start();

        // 3. Nitro Boost Synth
        const nitroNoise = this.ctx.createBufferSource();
        nitroNoise.buffer = noiseBuffer;
        nitroNoise.loop = true;
        const nitroFilter = this.ctx.createBiquadFilter();
        nitroFilter.type = 'highpass';
        nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
        this.nitroGain = this.ctx.createGain();
        this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);
        nitroNoise.connect(nitroFilter);
        nitroFilter.connect(this.nitroGain);
        this.nitroGain.connect(this.ctx.destination);
        nitroNoise.start();

        // 4. Car Horn Synth
        this.hornOsc1 = this.ctx.createOscillator();
        this.hornOsc2 = this.ctx.createOscillator();
        this.hornGain = this.ctx.createGain();
        this.hornOsc1.type = 'triangle';
        this.hornOsc2.type = 'sine';
        this.hornOsc1.frequency.setValueAtTime(440, this.ctx.currentTime); // Concert A
        this.hornOsc2.frequency.setValueAtTime(554.37, this.ctx.currentTime); // C#
        this.hornGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.hornOsc1.connect(this.hornGain);
        this.hornOsc2.connect(this.hornGain);
        this.hornGain.connect(this.ctx.destination);
        this.hornOsc1.start();
        this.hornOsc2.start();

        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio not supported:', e);
      }
    }

    updateEngine(rpmRatio, throttle, isReverse) {
      if (!this.initialized || !this.enabled) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Base idle: 40Hz, Max redline: 380Hz
      const targetFreq1 = 38 + rpmRatio * 320;
      const targetFreq2 = targetFreq1 * (isReverse ? 1.5 : 2.0);

      this.engineOsc1.frequency.setTargetAtTime(targetFreq1, this.ctx.currentTime, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(targetFreq2, this.ctx.currentTime, 0.05);

      // Lowpass cutoff expands under throttle
      const targetCutoff = 350 + rpmRatio * 1800 + (throttle ? 600 : 0);
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.05);

      // Gain based on throttle and idle
      const targetGain = Math.min(0.25, 0.06 + rpmRatio * 0.14 + (throttle ? 0.08 : 0));
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    setSkid(intensity) {
      if (!this.initialized || !this.enabled) return;
      const gain = Math.min(0.35, intensity * 0.4);
      this.skidGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.04);
    }

    setNitro(active) {
      if (!this.initialized || !this.enabled) return;
      const gain = active ? 0.22 : 0;
      this.nitroGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.08);
    }

    triggerHorn(active) {
      if (!this.initialized || !this.enabled) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const gain = active ? 0.35 : 0;
      this.hornGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.03);
    }

    playGearShift() {
      if (!this.initialized || !this.enabled) return;
      // Brief pop/dip
      this.engineGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      this.engineGain.gain.setTargetAtTime(0.18, this.ctx.currentTime + 0.08, 0.06);
    }

    toggleAudio() {
      this.enabled = !this.enabled;
      if (!this.enabled && this.initialized) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.hornGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return this.enabled;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. VEHICLE BUILDER (PBR Supercars with Interior & Articulated Driver)
  // ---------------------------------------------------------------------------
  class VehicleBuilder {
    static createCar(carConfig, paintColor) {
      const carGroup = new THREE.Group();
      carGroup.name = 'Car_' + carConfig.id;

      const color = paintColor || carConfig.defaultColor;

      // PBR Paint Material
      const paintMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.18,
        metalness: 0.88,
        envMapIntensity: 1.2
      });

      const carbonMaterial = new THREE.MeshStandardMaterial({
        color: 0x111317,
        roughness: 0.4,
        metalness: 0.5
      });

      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x112233,
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
        metalness: 0.1,
        reflectivity: 0.95
      });

      const chromeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.95
      });

      const interiorMaterial = new THREE.MeshStandardMaterial({
        color: 0x181c24,
        roughness: 0.7,
        metalness: 0.2
      });

      // 1. Lower Chassis
      const chassisGeo = new THREE.BoxGeometry(2.1, 0.55, 4.6);
      const chassis = new THREE.Mesh(chassisGeo, paintMaterial);
      chassis.position.y = 0.55;
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      carGroup.add(chassis);

      // 2. Front Hood / Grille Aerodynamics
      const hoodGeo = new THREE.BoxGeometry(2.0, 0.25, 1.6);
      const hood = new THREE.Mesh(hoodGeo, paintMaterial);
      hood.position.set(0, 0.72, 1.45);
      hood.rotation.x = 0.08;
      hood.castShadow = true;
      carGroup.add(hood);

      // Front Grille & Splitter
      const splitterGeo = new THREE.BoxGeometry(2.15, 0.08, 0.6);
      const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
      splitter.position.set(0, 0.32, 2.3);
      carGroup.add(splitter);

      // Distinctive Grille Insignia (BMW Kidney / Lambo Hex / Ferrari Slit)
      if (carConfig.id === 'bmw') {
        const grilleL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.05), chromeMaterial);
        grilleL.position.set(-0.25, 0.55, 2.32);
        const grilleR = grilleL.clone();
        grilleR.position.x = 0.25;
        carGroup.add(grilleL, grilleR);
      } else {
        const grilleCenter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.08), carbonMaterial);
        grilleCenter.position.set(0, 0.5, 2.32);
        carGroup.add(grilleCenter);
      }

      // 3. Cabin & Glass Canopy
      const cabinGeo = new THREE.BoxGeometry(1.75, 0.65, 2.1);
      const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
      cabin.position.set(0, 1.15, -0.2);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Roof panel
      const roofGeo = new THREE.BoxGeometry(1.68, 0.06, 1.4);
      const roof = new THREE.Mesh(roofGeo, carbonMaterial);
      roof.position.set(0, 1.48, -0.35);
      carGroup.add(roof);

      // 4. Cockpit Interior: Dashboard, Bucket Seats, Steering Wheel
      const dashGeo = new THREE.BoxGeometry(1.65, 0.4, 0.55);
      const dash = new THREE.Mesh(dashGeo, interiorMaterial);
      dash.position.set(0, 0.88, 0.65);
      carGroup.add(dash);

      // Digital Instrument Cluster Display (glow cyan)
      const screenGeo = new THREE.PlaneGeometry(0.45, 0.18);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-0.4, 0.98, 0.38);
      screen.rotation.x = -0.3;
      carGroup.add(screen);

      // Bucket Seats (Driver & Passenger)
      const createSeat = (xPos) => {
        const seatGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), interiorMaterial);
        base.position.y = 0.55;
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 0.16), interiorMaterial);
        back.position.set(0, 0.95, -0.3);
        back.rotation.x = -0.15;
        const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.14), interiorMaterial);
        headrest.position.set(0, 1.38, -0.35);
        seatGroup.add(base, back, headrest);
        seatGroup.position.set(xPos, 0, -0.35);
        return seatGroup;
      };

      const driverSeat = createSeat(-0.42);
      const passengerSeat = createSeat(0.42);
      carGroup.add(driverSeat, passengerSeat);

      // 5. Working Steering Wheel (Rotatable by Input)
      const steeringGroup = new THREE.Group();
      steeringGroup.position.set(-0.42, 0.96, 0.35);
      steeringGroup.rotation.x = 0.35;

      const wheelRimGeo = new THREE.TorusGeometry(0.18, 0.025, 8, 24);
      const wheelRim = new THREE.Mesh(wheelRimGeo, carbonMaterial);
      const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), chromeMaterial);
      wheelHub.rotation.x = Math.PI / 2;
      steeringGroup.add(wheelRim, wheelHub);
      carGroup.add(steeringGroup);

      // 6. Articulated Human Driver (Head, Torso, Arms connected to Wheel)
      const driverGroup = new THREE.Group();
      driverGroup.position.set(-0.42, 0.6, -0.35);

      // Torso in racing jacket
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.3), torsoMat);
      torso.position.set(0, 0.55, 0.05);
      torso.rotation.x = 0.1;
      driverGroup.add(torso);

      // Head with Racing Helmet / Visor
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), headMat);
      head.position.set(0, 0.95, 0.1);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.12), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      visor.position.set(0, 0.95, 0.22);
      driverGroup.add(head, visor);

      // Arms & Hands gripping the steering wheel!
      const armMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
      const handMat = new THREE.MeshStandardMaterial({ color: 0x111827 }); // driving gloves

      // Left Arm
      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45), armMat);
      leftArm.position.set(-0.26, 0.65, 0.32);
      leftArm.rotation.set(0.7, 0.25, -0.3);
      const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), handMat);
      leftHand.position.set(-0.25, 0.88, 0.62); // grips left rim

      // Right Arm
      const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45), armMat);
      rightArm.position.set(0.26, 0.65, 0.32);
      rightArm.rotation.set(0.7, -0.25, 0.3);
      const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), handMat);
      rightHand.position.set(0.25, 0.88, 0.62); // grips right rim

      driverGroup.add(leftArm, leftHand, rightArm, rightHand);
      carGroup.add(driverGroup);

      // 7. Human Passenger
      const passengerGroup = new THREE.Group();
      passengerGroup.position.set(0.42, 0.6, -0.35);
      const passTorsoMat = new THREE.MeshStandardMaterial({ color: 0x047857 });
      const passTorso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.28), passTorsoMat);
      passTorso.position.set(0, 0.52, 0.05);
      const passHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
      passHead.position.set(0, 0.92, 0.1);
      passengerGroup.add(passTorso, passHead);
      carGroup.add(passengerGroup);

      // 8. Rear Diffuser, Aerodynamic Spoiler & Dual Exhausts
      const spoilerGroup = new THREE.Group();
      spoilerGroup.position.set(0, 1.15, -2.15);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.35), carbonMaterial);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.15), carbonMaterial);
      legL.position.set(-0.65, -0.12, 0);
      const legR = legL.clone();
      legR.position.x = 0.65;
      spoilerGroup.add(wing, legL, legR);
      carGroup.add(spoilerGroup);

      // Dual Exhaust Pipes
      const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12);
      exhaustGeo.rotateX(Math.PI / 2);
      const exhaustL = new THREE.Mesh(exhaustGeo, chromeMaterial);
      exhaustL.position.set(-0.45, 0.35, -2.32);
      const exhaustR = new THREE.Mesh(exhaustGeo, chromeMaterial);
      exhaustR.position.set(0.45, 0.35, -2.32);
      carGroup.add(exhaustL, exhaustR);

      // Nitro Flames (Initially hidden)
      const flameGeo = new THREE.ConeGeometry(0.12, 0.6, 8);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
      const flameL = new THREE.Mesh(flameGeo, flameMat);
      flameL.position.set(-0.45, 0.35, -2.6);
      flameL.visible = false;
      const flameR = flameL.clone();
      flameR.position.x = 0.45;
      carGroup.add(flameL, flameR);

      // 9. Headlights & Taillights
      // Front LED strips
      const lightGeo = new THREE.BoxGeometry(0.4, 0.1, 0.05);
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const headLightL = new THREE.Mesh(lightGeo, headlightMat);
      headLightL.position.set(-0.75, 0.68, 2.31);
      const headLightR = headLightL.clone();
      headLightR.position.x = 0.75;
      carGroup.add(headLightL, headLightR);

      // Real 3D Headlight Spotlights
      const spotLightL = new THREE.SpotLight(0xffffff, 2.5, 45, Math.PI / 6, 0.4, 1);
      spotLightL.position.set(-0.75, 0.7, 2.3);
      spotLightL.target.position.set(-0.75, 0, 20);
      carGroup.add(spotLightL, spotLightL.target);

      const spotLightR = spotLightL.clone();
      spotLightR.position.x = 0.75;
      spotLightR.target.position.set(0.75, 0, 20);
      carGroup.add(spotLightR, spotLightR.target);

      // Rear Red Taillights
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1133 });
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.05), tailMat);
      tailL.position.set(-0.75, 0.75, -2.31);
      const tailR = tailL.clone();
      tailR.position.x = 0.75;
      carGroup.add(tailL, tailR);

      // 10. Wheels (4 Independent Wheels)
      const wheelRadius = 0.38;
      const wheelWidth = 0.28;
      const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
      wheelGeo.rotateZ(Math.PI / 2);

      const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.85 });
      const rimMaterial = chromeMaterial;

      const createWheel = (isFront, isLeft) => {
        const wheelGroup = new THREE.Group();
        const tire = new THREE.Mesh(wheelGeo, tireMaterial);
        tire.castShadow = true;

        // Rim spokes
        const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.01, 12);
        rimGeo.rotateZ(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeo, rimMaterial);

        // Red brake caliper
        const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.18);
        const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const caliper = new THREE.Mesh(caliperGeo, caliperMat);
        caliper.position.set(isLeft ? 0.08 : -0.08, 0.14, 0);

        wheelGroup.add(tire, rim, caliper);
        return { group: wheelGroup, isFront, isLeft };
      };

      const wheelFL = createWheel(true, true);
      const wheelFR = createWheel(true, false);
      const wheelRL = createWheel(false, true);
      const wheelRR = createWheel(false, false);

      const trackWidth = 1.05;
      const wheelbase = 1.45;

      wheelFL.group.position.set(-trackWidth, wheelRadius, wheelbase);
      wheelFR.group.position.set(trackWidth, wheelRadius, wheelbase);
      wheelRL.group.position.set(-trackWidth, wheelRadius, -wheelbase);
      wheelRR.group.position.set(trackWidth, wheelRadius, -wheelbase);

      carGroup.add(wheelFL.group, wheelFR.group, wheelRL.group, wheelRR.group);

      return {
        mesh: carGroup,
        config: carConfig,
        paintMaterial: paintMaterial,
        steeringWheel: steeringGroup,
        driver: driverGroup,
        passenger: passengerGroup,
        wheels: [wheelFL, wheelFR, wheelRL, wheelRR],
        spotLightL, spotLightR,
        tailL, tailR,
        flameL, flameR
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 4. ANIMATED PEDESTRIANS & CHARACTERS
  // ---------------------------------------------------------------------------
  class PedestrianManager {
    constructor(scene) {
      this.scene = scene;
      this.pedestrians = [];
      this.waypoints = [
        // Sidewalk routes in City
        { x: -55, z: -100, dx: 0, dz: 1 },
        { x: -55, z: 100, dx: 0, dz: -1 },
        { x: 55, z: -80, dx: 0, dz: 1 },
        { x: 55, z: 80, dx: 0, dz: -1 },
        { x: -100, z: -45, dx: 1, dz: 0 },
        { x: 100, z: -45, dx: -1, dz: 0 },
        { x: -80, z: 45, dx: 1, dz: 0 },
        { x: 80, z: 45, dx: -1, dz: 0 },
        // Lake park trail
        { x: 180, z: -200, dx: 1, dz: 0 },
        { x: 260, z: -200, dx: -1, dz: 0 }
      ];
      this.initPedestrians();
    }

    createPedestrian(colorHex, shirtHex) {
      const ped = new THREE.Group();

      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
      const clothesMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.7 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.65, 0.22), clothesMat);
      torso.position.y = 1.15;
      torso.castShadow = true;
      ped.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
      head.position.y = 1.62;
      ped.add(head);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.14, 0.75, 0.16);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.11, 0.45, 0);
      leftLeg.castShadow = true;

      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.11, 0.45, 0);
      rightLeg.castShadow = true;

      ped.add(leftLeg, rightLeg);

      // Arms
      const armGeo = new THREE.BoxGeometry(0.1, 0.55, 0.12);
      const leftArm = new THREE.Mesh(armGeo, clothesMat);
      leftArm.position.set(-0.26, 1.15, 0);

      const rightArm = new THREE.Mesh(armGeo, clothesMat);
      rightArm.position.set(0.26, 1.15, 0);

      ped.add(leftArm, rightArm);

      return {
        group: ped,
        leftLeg, rightLeg,
        leftArm, rightArm,
        animTimer: Math.random() * 10,
        speed: 1.4 + Math.random() * 0.6,
        targetIndex: 0
      };
    }

    initPedestrians() {
      const colors = [0x1e3a8a, 0x047857, 0xb91c1c, 0x4b5563, 0x7c3aed];
      const shirts = [0xffffff, 0x38bdf8, 0xf43f5e, 0x10b981, 0xfbbf24];

      for (let i = 0; i < 14; i++) {
        const wp = this.waypoints[i % this.waypoints.length];
        const p = this.createPedestrian(colors[i % colors.length], shirts[i % shirts.length]);
        p.group.position.set(
          wp.x + (Math.random() - 0.5) * 6,
          0,
          wp.z + (Math.random() - 0.5) * 60
        );
        p.dirX = wp.dx;
        p.dirZ = wp.dz;
        p.group.rotation.y = Math.atan2(wp.dx, wp.dz);
        this.scene.add(p.group);
        this.pedestrians.push(p);
      }
    }

    update(delta) {
      for (const p of this.pedestrians) {
        p.animTimer += delta * 6 * p.speed;

        // Walk translation
        p.group.position.x += p.dirX * p.speed * delta;
        p.group.position.z += p.dirZ * p.speed * delta;

        // Turn around if exceeding bounds
        if (Math.abs(p.group.position.z) > 160 || Math.abs(p.group.position.x) > 180) {
          p.dirX = -p.dirX;
          p.dirZ = -p.dirZ;
          p.group.rotation.y += Math.PI;
        }

        // Bipedal limb oscillation
        const swing = Math.sin(p.animTimer) * 0.6;
        p.leftLeg.rotation.x = swing;
        p.rightLeg.rotation.x = -swing;
        p.leftArm.rotation.x = -swing * 0.8;
        p.rightArm.rotation.x = swing * 0.8;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. MOVING TRAFFIC SYSTEM
  // ---------------------------------------------------------------------------
  class TrafficManager {
    constructor(scene) {
      this.scene = scene;
      this.trafficCars = [];
      this.initTraffic();
    }

    createTrafficCar(colorHex) {
      const car = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.7 });
      const glassMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.2), bodyMat);
      body.position.y = 0.55;
      body.castShadow = true;

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), glassMat);
      cabin.position.set(0, 1.05, -0.2);

      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

      const w1 = new THREE.Mesh(wheelGeo, wheelMat);
      w1.position.set(-0.95, 0.35, 1.3);
      const w2 = new THREE.Mesh(wheelGeo, wheelMat);
      w2.position.set(0.95, 0.35, 1.3);
      const w3 = new THREE.Mesh(wheelGeo, wheelMat);
      w3.position.set(-0.95, 0.35, -1.3);
      const w4 = new THREE.Mesh(wheelGeo, wheelMat);
      w4.position.set(0.95, 0.35, -1.3);

      // Headlights & Tail
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      headL.position.set(-0.65, 0.65, 2.12);
      const headR = headL.clone();
      headR.position.x = 0.65;

      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), new THREE.MeshBasicMaterial({ color: 0xff0022 }));
      tailL.position.set(-0.65, 0.65, -2.12);
      const tailR = tailL.clone();
      tailR.position.x = 0.65;

      car.add(body, cabin, w1, w2, w3, w4, headL, headR, tailL, tailR);
      return car;
    }

    initTraffic() {
      const colors = [0xffffff, 0x3b82f6, 0xef4444, 0x10b981, 0x334155, 0xf59e0b];
      // City Highway lanes
      const lanePositions = [
        { x: -16, z: -300, dir: 1, speed: 22 },
        { x: -16, z: 0, dir: 1, speed: 20 },
        { x: -16, z: 250, dir: 1, speed: 25 },
        { x: 16, z: 300, dir: -1, speed: 22 },
        { x: 16, z: -50, dir: -1, speed: 24 },
        { x: 16, z: -250, dir: -1, speed: 20 },
        // Cross avenue
        { x: -300, z: -16, dir: 1, speed: 18, axis: 'x' },
        { x: 150, z: 16, dir: -1, speed: 19, axis: 'x' }
      ];

      for (let i = 0; i < lanePositions.length; i++) {
        const lane = lanePositions[i];
        const carMesh = this.createTrafficCar(colors[i % colors.length]);
        carMesh.position.set(lane.x, 0, lane.z);

        if (lane.axis === 'x') {
          carMesh.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          carMesh.rotation.y = lane.dir > 0 ? 0 : Math.PI;
        }

        this.scene.add(carMesh);
        this.trafficCars.push({
          mesh: carMesh,
          axis: lane.axis || 'z',
          dir: lane.dir,
          speed: lane.speed,
          baseX: lane.x,
          baseZ: lane.z
        });
      }
    }

    update(delta, playerCarPos) {
      for (const t of this.trafficCars) {
        if (t.axis === 'x') {
          t.mesh.position.x += t.dir * t.speed * delta;
          if (t.dir > 0 && t.mesh.position.x > HALF_WORLD - 100) t.mesh.position.x = -HALF_WORLD + 100;
          if (t.dir < 0 && t.mesh.position.x < -HALF_WORLD + 100) t.mesh.position.x = HALF_WORLD - 100;
        } else {
          t.mesh.position.z += t.dir * t.speed * delta;
          if (t.dir > 0 && t.mesh.position.z > HALF_WORLD - 100) t.mesh.position.z = -HALF_WORLD + 100;
          if (t.dir < 0 && t.mesh.position.z < -HALF_WORLD + 100) t.mesh.position.z = HALF_WORLD - 100;
        }

        // Simple proximity yield if player is right in front
        if (playerCarPos) {
          const dist = t.mesh.position.distanceTo(playerCarPos);
          if (dist < 12) {
            t.mesh.position.y = 0.05 * Math.sin(Date.now() * 0.02); // slight brake rumble
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. PROCEDURAL OPEN WORLD ENVIRONMENT GENERATOR
  // ---------------------------------------------------------------------------
  class OpenWorldGenerator {
    constructor(scene) {
      this.scene = scene;
      this.colliders = [];
      this.waterMesh = null;
      this.streetLamps = [];
      this.buildWorld();
    }

    buildWorld() {
      // 1. Terrain Ground
      const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 64, 64);
      terrainGeo.rotateX(-Math.PI / 2);

      // Displace mountain vertex heights on north-east boundary
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // Mountain elevation in quadrant (+x, -z)
        if (x > 180 && z < -100) {
          const dist = Math.sqrt((x - 200) ** 2 + (z + 250) ** 2);
          const elev = Math.max(0, 110 - dist * 0.45) + Math.sin(x * 0.05) * 8;
          pos.setY(i, elev);
        }
        // River depression through center-east
        if (x > 80 && x < 150 && z > -250 && z < 450) {
          pos.setY(i, -3.5);
        }
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x1b4332,
        roughness: 0.9,
        metalness: 0.1
      });
      const terrain = new THREE.Mesh(terrainGeo, terrainMat);
      terrain.receiveShadow = true;
      this.scene.add(terrain);

      // 2. City Downtown Asphalt Roads & Grid
      this.buildRoadNetwork();

      // 3. Downtown Skyscrapers & Commercial Buildings
      this.buildCityBuildings();

      // 4. Forests & Vegetation
      this.buildForests();

      // 5. River & Water Surface
      this.buildRiverAndBridges();

      // 6. Street Lamps with Night Illumination
      this.buildStreetLamps();
    }

    buildRoadNetwork() {
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.7, metalness: 0.15 });
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

      // Main City Boulevard (North-South)
      const mainAvenue = new THREE.Mesh(new THREE.PlaneGeometry(32, WORLD_SIZE), roadMat);
      mainAvenue.rotateX(-Math.PI / 2);
      mainAvenue.position.set(0, 0.02, 0);
      mainAvenue.receiveShadow = true;
      this.scene.add(mainAvenue);

      // Center Divider & Dashed Lanes
      const centerStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.6, WORLD_SIZE), yellowMat);
      centerStrip.rotateX(-Math.PI / 2);
      centerStrip.position.set(0, 0.03, 0);
      this.scene.add(centerStrip);

      // Cross Boulevard (East-West)
      const crossAvenue = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE, 32), roadMat);
      crossAvenue.rotateX(-Math.PI / 2);
      crossAvenue.position.set(0, 0.02, 0);
      crossAvenue.receiveShadow = true;
      this.scene.add(crossAvenue);

      // Outer Countryside Ring Road
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x22272e, roughness: 0.8 });
      const ringRoad = new THREE.Mesh(new THREE.RingGeometry(380, 412, 48), ringMat);
      ringRoad.rotateX(-Math.PI / 2);
      ringRoad.position.set(0, 0.025, 0);
      ringRoad.receiveShadow = true;
      this.scene.add(ringRoad);

      // Concrete Sidewalks in Downtown Grid
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
      const sidewalkBlocks = [
        { x: -55, z: -55, w: 70, d: 70 },
        { x: 55, z: -55, w: 70, d: 70 },
        { x: -55, z: 55, w: 70, d: 70 },
        { x: 55, z: 55, w: 70, d: 70 }
      ];

      for (const b of sidewalkBlocks) {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.25, b.d), sidewalkMat);
        sw.position.set(b.x, 0.125, b.z);
        sw.receiveShadow = true;
        this.scene.add(sw);
      }
    }

    buildCityBuildings() {
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 });
      const wallColors = [0x1e293b, 0x0f172a, 0x334155, 0x475569, 0x111827];

      // Procedural City Grid Layout
      const buildingLocs = [
        // Northwest Block
        { x: -45, z: -45, w: 24, d: 24, h: 75 },
        { x: -75, z: -45, w: 22, d: 22, h: 55 },
        { x: -45, z: -75, w: 22, d: 24, h: 90 },
        { x: -75, z: -75, w: 20, d: 20, h: 65 },
        // Northeast Block
        { x: 45, z: -45, w: 24, d: 24, h: 80 },
        { x: 75, z: -45, w: 22, d: 20, h: 60 },
        { x: 45, z: -75, w: 22, d: 24, h: 105 }, // Tallest Tower
        { x: 75, z: -75, w: 20, d: 20, h: 50 },
        // Southwest Block
        { x: -45, z: 45, w: 24, d: 24, h: 65 },
        { x: -75, z: 45, w: 22, d: 22, h: 48 },
        { x: -45, z: 75, w: 22, d: 24, h: 85 },
        { x: -75, z: 75, w: 20, d: 20, h: 55 },
        // Southeast Block
        { x: 45, z: 45, w: 24, d: 24, h: 70 },
        { x: 75, z: 45, w: 22, d: 20, h: 52 },
        { x: 45, z: 75, w: 22, d: 24, h: 78 },
        { x: 75, z: 75, w: 20, d: 20, h: 45 }
      ];

      for (const b of buildingLocs) {
        const building = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
          color: wallColors[Math.floor(Math.random() * wallColors.length)],
          roughness: 0.5,
          metalness: 0.3
        });

        // Main Tower Box
        const tower = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
        tower.position.y = b.h / 2;
        tower.castShadow = true;
        tower.receiveShadow = true;
        building.add(tower);

        // Reflective Windows Bands
        const bandCount = Math.floor(b.h / 8);
        for (let j = 1; j < bandCount; j++) {
          const windowBand = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.15, 2.5, b.d + 0.15), windowMat);
          windowBand.position.y = j * 8;
          building.add(windowBand);
        }

        // Rooftop Antenna / Spire
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 14, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        antenna.position.set(0, b.h + 7, 0);
        building.add(antenna);

        building.position.set(b.x, 0, b.z);
        this.scene.add(building);

        // Add to collision obstacle array
        this.colliders.push({
          x: b.x,
          z: b.z,
          radius: Math.max(b.w, b.d) * 0.65
        });
      }
    }

    buildForests() {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
      const pineMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.8 });

      const treeGeoCone1 = new THREE.ConeGeometry(2.5, 4.5, 8);
      const treeGeoCone2 = new THREE.ConeGeometry(2.0, 3.8, 8);
      const treeGeoCone3 = new THREE.ConeGeometry(1.4, 3.0, 8);
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8);

      // Create lush forest clusters outside the city grid
      const forestCenters = [
        { cx: -220, cz: -180, count: 50, rad: 120 },
        { cx: -250, cz: 200, count: 45, rad: 110 },
        { cx: 220, cz: 220, count: 40, rad: 90 },
        { cx: 280, cz: -50, count: 55, rad: 100 }
      ];

      for (const fc of forestCenters) {
        for (let i = 0; i < fc.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 15 + Math.random() * fc.rad;
          const x = fc.cx + Math.cos(angle) * dist;
          const z = fc.cz + Math.sin(angle) * dist;

          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 1.75;
          trunk.castShadow = true;

          const c1 = new THREE.Mesh(treeGeoCone1, (i % 2 === 0) ? foliageMat : pineMat);
          c1.position.y = 4.0;
          c1.castShadow = true;
          const c2 = new THREE.Mesh(treeGeoCone2, (i % 2 === 0) ? foliageMat : pineMat);
          c2.position.y = 6.2;
          c2.castShadow = true;
          const c3 = new THREE.Mesh(treeGeoCone3, (i % 2 === 0) ? foliageMat : pineMat);
          c3.position.y = 8.0;

          tree.add(trunk, c1, c2, c3);
          const scale = 0.8 + Math.random() * 0.6;
          tree.scale.set(scale, scale, scale);
          tree.position.set(x, 0, z);
          this.scene.add(tree);

          this.colliders.push({ x, z, radius: 1.2 });
        }
      }
    }

    buildRiverAndBridges() {
      // 1. Water Surface
      const waterGeo = new THREE.PlaneGeometry(70, 700, 32, 32);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.85,
        transparent: true,
        opacity: 0.88
      });
      this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
      this.waterMesh.position.set(115, -1.2, 100);
      this.scene.add(this.waterMesh);

      // 2. Majestic Suspension River Bridge (Carries East-West Avenue across River)
      const bridgeGroup = new THREE.Group();
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const redTowerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.5, roughness: 0.4 });

      // Road deck over water
      const deck = new THREE.Mesh(new THREE.BoxGeometry(75, 1.2, 32), steelMat);
      deck.position.set(115, 0.6, 0);
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      // Towering Suspension Pylons
      const createTower = (xPos) => {
        const towerGroup = new THREE.Group();
        const pylonL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 38, 2.5), redTowerMat);
        pylonL.position.set(0, 19, -15);
        const pylonR = pylonL.clone();
        pylonR.position.z = 15;
        const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.5, 32), redTowerMat);
        crossBeam.position.set(0, 32, 0);
        towerGroup.add(pylonL, pylonR, crossBeam);
        towerGroup.position.set(xPos, 0, 0);
        return towerGroup;
      };

      const tower1 = createTower(90);
      const tower2 = createTower(140);
      bridgeGroup.add(tower1, tower2);

      // Suspension Cables
      const cableMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
      for (let i = -14; i <= 14; i += 7) {
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 28), cableMat);
        cable.position.set(115, 14, i);
        bridgeGroup.add(cable);
      }

      this.scene.add(bridgeGroup);
    }

    buildStreetLamps() {
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const lampHeadGeo = new THREE.BoxGeometry(0.8, 0.25, 0.4);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

      for (let z = -250; z <= 250; z += 50) {
        // West side of boulevard
        const lampW = new THREE.Group();
        const poleW = new THREE.Mesh(poleGeo, poleMat);
        poleW.position.y = 3.75;
        const headW = new THREE.Mesh(lampHeadGeo, bulbMat);
        headW.position.set(0.6, 7.3, 0);
        lampW.add(poleW, headW);
        lampW.position.set(-17.5, 0, z);
        this.scene.add(lampW);

        // East side
        const lampE = lampW.clone();
        lampE.rotation.y = Math.PI;
        lampE.position.set(17.5, 0, z);
        this.scene.add(lampE);

        this.streetLamps.push(headW, lampE.children[1]);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. MAIN SIMULATOR APPLICATION CONTROLLER
  // ---------------------------------------------------------------------------
  class ApexCarSimulator {
    constructor() {
      // Core Three.js
      this.container = document.getElementById('game-canvas-container');
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.clock = new THREE.Clock();

      // Systems
      this.audio = new AudioEngine();
      this.world = null;
      this.pedestrians = null;
      this.traffic = null;

      // Active Car State & Physics
      this.currentCarIndex = 0;
      this.selectedColor = CAR_MODELS[0].defaultColor;
      this.car = null; // Instantiated vehicle object

      // Physics variables
      this.velocity = 0; // m/s
      this.speedKmh = 0;
      this.steeringAngle = 0;
      this.angularVelocity = 0;
      this.isDrifting = false;
      this.driftScore = 0;
      this.nitroActive = false;
      this.nitroFuel = 100;
      this.carFuel = 99.0;
      this.odometerKm = 0;
      this.activeGear = 1;

      // Camera Modes: 'chase', 'cockpit', 'hood', 'orbit'
      this.cameraModes = ['chase', 'cockpit', 'hood', 'orbit'];
      this.currentCameraIndex = 0;

      // Environment & Weather
      this.weatherStates = ['SUNNY', 'SUNSET', 'NIGHT', 'RAIN', 'FOG'];
      this.currentWeatherIndex = 0;
      this.sunLight = null;
      this.ambientLight = null;
      this.hemiLight = null;
      this.rainParticles = null;

      // Input Controller
      this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        handbrake: false,
        nitro: false
      };

      // Mini-map 2D Canvas
      this.minimapCanvas = document.getElementById('minimap-canvas');
      this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

      // Particle Systems (Skid smoke, sparks, rain)
      this.smokeParticles = [];

      this.isPaused = false;
      this.gameStarted = false;

      this.init();
    }

    init() {
      // 1. Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0018);

      // 2. Camera setup
      this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);
      this.camera.position.set(0, 4, -8);

      // 3. Renderer setup
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.container.appendChild(this.renderer.domElement);

      // 4. Lighting System
      this.setupLighting();

      // 5. Build Procedural Open World
      this.world = new OpenWorldGenerator(this.scene);

      // 6. Spawn Animated Pedestrians & Traffic
      this.pedestrians = new PedestrianManager(this.scene);
      this.traffic = new TrafficManager(this.scene);

      // 7. Spawn Player Supercar
      this.spawnCar(CAR_MODELS[this.currentCarIndex]);

      // 8. Setup Rain Particle System
      this.setupRainSystem();

      // 9. Input & UI Event Listeners
      this.bindInputs();
      this.bindUI();

      // 10. Window Resize Handler
      window.addEventListener('resize', () => this.onWindowResize(), false);

      // 11. Dismiss loading screen
      setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.classList.remove('active');
      }, 700);

      // 12. Main Animation Loop
      this.animate();
    }

    setupLighting() {
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
      this.scene.add(this.ambientLight);

      this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.4);
      this.scene.add(this.hemiLight);

      this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
      this.sunLight.position.set(120, 220, 100);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 450;
      const d = 80;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.scene.add(this.sunLight);
    }

    setupRainSystem() {
      const rainCount = 2800;
      const rainGeo = new THREE.BufferGeometry();
      const rainPositions = new Float32Array(rainCount * 3);

      for (let i = 0; i < rainCount * 3; i += 3) {
        rainPositions[i] = (Math.random() - 0.5) * 160;
        rainPositions[i + 1] = Math.random() * 50;
        rainPositions[i + 2] = (Math.random() - 0.5) * 160;
      }

      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
      const rainMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.18,
        transparent: true,
        opacity: 0.75
      });

      this.rainParticles = new THREE.Points(rainGeo, rainMat);
      this.rainParticles.visible = false;
      this.scene.add(this.rainParticles);
    }

    spawnCar(carConfig) {
      if (this.car) {
        this.scene.remove(this.car.mesh);
      }

      this.car = VehicleBuilder.createCar(carConfig, this.selectedColor);
      this.car.mesh.position.set(0, 0, 10);
      this.scene.add(this.car.mesh);

      this.velocity = 0;
      this.steeringAngle = 0;
      this.angularVelocity = 0;
    }

    // -------------------------------------------------------------------------
    // Input Handlers
    // -------------------------------------------------------------------------
    bindInputs() {
      window.addEventListener('keydown', (e) => {
        this.audio.init(); // User gesture unlocks audio

        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            this.keys.forward = true;
            break;
          case 'KeyS':
          case 'ArrowDown':
            this.keys.backward = true;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            this.keys.left = true;
            break;
          case 'KeyD':
          case 'ArrowRight':
            this.keys.right = true;
            break;
          case 'Space':
            this.keys.handbrake = true;
            e.preventDefault();
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            this.keys.nitro = true;
            break;
          case 'KeyC':
            this.cycleCamera();
            break;
          case 'KeyH':
            this.audio.triggerHorn(true);
            break;
          case 'KeyL':
            this.toggleHeadlights();
            break;
          case 'KeyR':
            this.resetCar();
            break;
          case 'KeyP':
          case 'Escape':
            this.togglePause();
            break;
        }
      });

      window.addEventListener('keyup', (e) => {
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            this.keys.forward = false;
            break;
          case 'KeyS':
          case 'ArrowDown':
            this.keys.backward = false;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            this.keys.left = false;
            break;
          case 'KeyD':
          case 'ArrowRight':
            this.keys.right = false;
            break;
          case 'Space':
            this.keys.handbrake = false;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            this.keys.nitro = false;
            break;
          case 'KeyH':
            this.audio.triggerHorn(false);
            break;
        }
      });

      // Mobile Touch Input Binding
      const bindTouch = (id, keyName) => {
        const el = document.getElementById(id);
        if (!el) return;
        const setPress = (val) => {
          this.audio.init();
          this.keys[keyName] = val;
          el.classList.toggle('pressed', val);
        };
        el.addEventListener('touchstart', (e) => { e.preventDefault(); setPress(true); }, { passive: false });
        el.addEventListener('touchend', (e) => { e.preventDefault(); setPress(false); }, { passive: false });
        el.addEventListener('mousedown', () => setPress(true));
        el.addEventListener('mouseup', () => setPress(false));
      };

      bindTouch('touch-left', 'left');
      bindTouch('touch-right', 'right');
      bindTouch('touch-gas', 'forward');
      bindTouch('touch-brake', 'backward');
      bindTouch('touch-nitro', 'nitro');
    }

    bindUI() {
      // Main Menu Buttons
      const btnStart = document.getElementById('btn-start-game');
      const btnGarage = document.getElementById('btn-open-garage');
      const btnControls = document.getElementById('btn-open-controls');
      const btnCloseGarage = document.getElementById('btn-close-garage');
      const btnCloseControls = document.getElementById('btn-close-controls');
      const btnDriveSelected = document.getElementById('btn-select-car-drive');
      const btnResume = document.getElementById('btn-resume-game');
      const btnAudio = document.getElementById('btn-audio-toggle');
      const btnSwitchCarPause = document.getElementById('btn-switch-car-pause');
      const btnRestart = document.getElementById('btn-restart-game');

      // Top Action Buttons
      const btnCam = document.getElementById('btn-toggle-camera');
      const btnLights = document.getElementById('btn-toggle-lights');
      const btnHorn = document.getElementById('btn-car-horn');
      const btnReset = document.getElementById('btn-reset-car');
      const btnPause = document.getElementById('btn-pause-game');
      const weatherWidget = document.getElementById('hud-weather-widget');

      if (btnStart) {
        btnStart.addEventListener('click', () => {
          this.audio.init();
          document.getElementById('main-menu').style.display = 'none';
          document.getElementById('game-hud').style.display = 'flex';
          this.gameStarted = true;
        });
      }

      if (btnGarage) {
        btnGarage.addEventListener('click', () => {
          document.getElementById('main-menu').style.display = 'none';
          document.getElementById('garage-menu').style.display = 'flex';
          this.updateGarageUI();
        });
      }

      if (btnCloseGarage) {
        btnCloseGarage.addEventListener('click', () => {
          document.getElementById('garage-menu').style.display = 'none';
          document.getElementById(this.gameStarted ? 'game-hud' : 'main-menu').style.display = this.gameStarted ? 'flex' : 'flex';
        });
      }

      if (btnDriveSelected) {
        btnDriveSelected.addEventListener('click', () => {
          this.audio.init();
          document.getElementById('garage-menu').style.display = 'none';
          document.getElementById('game-hud').style.display = 'flex';
          this.gameStarted = true;
          this.spawnCar(CAR_MODELS[this.currentCarIndex]);
        });
      }

      if (btnControls) {
        btnControls.addEventListener('click', () => {
          document.getElementById('controls-modal').style.display = 'flex';
        });
      }

      if (btnCloseControls) {
        btnCloseControls.addEventListener('click', () => {
          document.getElementById('controls-modal').style.display = 'none';
        });
      }

      // Garage Car Navigation
      const btnPrevCar = document.getElementById('garage-prev-car');
      const btnNextCar = document.getElementById('garage-next-car');
      if (btnPrevCar) {
        btnPrevCar.addEventListener('click', () => {
          this.currentCarIndex = (this.currentCarIndex - 1 + CAR_MODELS.length) % CAR_MODELS.length;
          this.selectedColor = CAR_MODELS[this.currentCarIndex].defaultColor;
          this.updateGarageUI();
          this.spawnCar(CAR_MODELS[this.currentCarIndex]);
        });
      }
      if (btnNextCar) {
        btnNextCar.addEventListener('click', () => {
          this.currentCarIndex = (this.currentCarIndex + 1) % CAR_MODELS.length;
          this.selectedColor = CAR_MODELS[this.currentCarIndex].defaultColor;
          this.updateGarageUI();
          this.spawnCar(CAR_MODELS[this.currentCarIndex]);
        });
      }

      // HUD buttons
      if (btnCam) btnCam.addEventListener('click', () => this.cycleCamera());
      if (btnLights) btnLights.addEventListener('click', () => this.toggleHeadlights());
      if (btnHorn) {
        btnHorn.addEventListener('mousedown', () => this.audio.triggerHorn(true));
        btnHorn.addEventListener('mouseup', () => this.audio.triggerHorn(false));
      }
      if (btnReset) btnReset.addEventListener('click', () => this.resetCar());
      if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
      if (weatherWidget) weatherWidget.addEventListener('click', () => this.cycleWeather());

      if (btnResume) btnResume.addEventListener('click', () => this.togglePause());
      if (btnSwitchCarPause) {
        btnSwitchCarPause.addEventListener('click', () => {
          document.getElementById('pause-menu').style.display = 'none';
          document.getElementById('garage-menu').style.display = 'flex';
          this.updateGarageUI();
        });
      }
      if (btnRestart) {
        btnRestart.addEventListener('click', () => {
          this.resetCar();
          this.togglePause();
        });
      }
      if (btnAudio) {
        btnAudio.addEventListener('click', () => {
          const state = this.audio.toggleAudio();
          document.getElementById('sound-state-text').textContent = state ? 'ON' : 'OFF';
        });
      }
    }

    updateGarageUI() {
      const c = CAR_MODELS[this.currentCarIndex];
      document.getElementById('garage-car-brand').textContent = c.brand;
      document.getElementById('garage-car-name').textContent = c.name;
      document.getElementById('garage-car-desc').textContent = c.desc;

      document.getElementById('spec-speed-val').textContent = `${c.topSpeed} KM/H`;
      document.getElementById('spec-speed-bar').style.width = `${(c.topSpeed / 360) * 100}%`;

      document.getElementById('spec-accel-val').textContent = `${c.accel}s 0-100`;
      document.getElementById('spec-accel-bar').style.width = `${(4.5 / c.accel) * 80}%`;

      document.getElementById('spec-handle-val').textContent = `${c.handling}/10`;
      document.getElementById('spec-handle-bar').style.width = `${c.handling * 10}%`;

      // Color Swatches
      const pal = document.getElementById('color-palette');
      pal.innerHTML = '';
      c.colors.forEach((hex) => {
        const sw = document.createElement('div');
        sw.className = `color-swatch ${this.selectedColor === hex ? 'active' : ''}`;
        sw.style.backgroundColor = `#${hex.toString(16).padStart(6, '0')}`;
        sw.addEventListener('click', () => {
          this.selectedColor = hex;
          this.car.paintMaterial.color.setHex(hex);
          pal.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
        });
        pal.appendChild(sw);
      });
    }

    cycleCamera() {
      this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameraModes.length;
      const mode = this.cameraModes[this.currentCameraIndex].toUpperCase();
      const badge = document.getElementById('hud-camera-label');
      if (badge) badge.textContent = `${mode} CAM`;
    }

    toggleHeadlights() {
      if (!this.car) return;
      const on = !this.car.spotLightL.visible;
      this.car.spotLightL.visible = on;
      this.car.spotLightR.visible = on;
    }

    resetCar() {
      if (!this.car) return;
      this.car.mesh.position.set(0, 0.4, this.car.mesh.position.z);
      this.car.mesh.rotation.set(0, 0, 0);
      this.velocity = 0;
      this.steeringAngle = 0;
      this.angularVelocity = 0;
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      const pauseEl = document.getElementById('pause-menu');
      if (pauseEl) pauseEl.style.display = this.isPaused ? 'flex' : 'none';
    }

    cycleWeather() {
      this.currentWeatherIndex = (this.currentWeatherIndex + 1) % this.weatherStates.length;
      const w = this.weatherStates[this.currentWeatherIndex];
      const iconEl = document.getElementById('weather-icon');
      const timeEl = document.getElementById('time-display');
      const weatherEl = document.getElementById('weather-display');
      const rainOverlay = document.getElementById('rain-screen-overlay');

      if (rainOverlay) rainOverlay.style.display = (w === 'RAIN') ? 'block' : 'none';
      if (this.rainParticles) this.rainParticles.visible = (w === 'RAIN');

      switch (w) {
        case 'SUNNY':
          iconEl.textContent = '☀️';
          timeEl.textContent = '14:00 NOON';
          weatherEl.textContent = 'CLEAR SUNNY';
          this.scene.background.setHex(0x87ceeb);
          this.scene.fog.color.setHex(0x87ceeb);
          this.scene.fog.density = 0.0018;
          this.sunLight.intensity = 1.4;
          this.sunLight.color.setHex(0xfffaed);
          break;
        case 'SUNSET':
          iconEl.textContent = '🌅';
          timeEl.textContent = '18:45 SUNSET';
          weatherEl.textContent = 'GOLDEN TWILIGHT';
          this.scene.background.setHex(0xf97316);
          this.scene.fog.color.setHex(0xf97316);
          this.scene.fog.density = 0.0022;
          this.sunLight.intensity = 0.9;
          this.sunLight.color.setHex(0xfdba74);
          break;
        case 'NIGHT':
          iconEl.textContent = '🌙';
          timeEl.textContent = '23:30 NIGHT';
          weatherEl.textContent = 'STARRY NIGHT';
          this.scene.background.setHex(0x030712);
          this.scene.fog.color.setHex(0x030712);
          this.scene.fog.density = 0.0028;
          this.sunLight.intensity = 0.15;
          this.sunLight.color.setHex(0x60a5fa);
          // Turn on headlights automatically
          if (this.car) {
            this.car.spotLightL.visible = true;
            this.car.spotLightR.visible = true;
          }
          break;
        case 'RAIN':
          iconEl.textContent = '🌧️';
          timeEl.textContent = '16:15 STORM';
          weatherEl.textContent = 'HEAVY RAIN';
          this.scene.background.setHex(0x334155);
          this.scene.fog.color.setHex(0x334155);
          this.scene.fog.density = 0.0035;
          this.sunLight.intensity = 0.45;
          break;
        case 'FOG':
          iconEl.textContent = '🌫️';
          timeEl.textContent = '06:00 DAWN';
          weatherEl.textContent = 'DENSE MOUNTAIN FOG';
          this.scene.background.setHex(0x94a3b8);
          this.scene.fog.color.setHex(0x94a3b8);
          this.scene.fog.density = 0.009;
          this.sunLight.intensity = 0.6;
          break;
      }
    }

    // -------------------------------------------------------------------------
    // 8. PHYSICS & DRIVING DYNAMICS ENGINE
    // -------------------------------------------------------------------------
    updatePhysics(delta) {
      if (!this.car || this.isPaused) return;

      const cfg = this.car.config;
      const maxForwardSpeed = (cfg.topSpeed / 3.6); // m/s (approx 97 m/s for 350 km/h)
      const maxReverseSpeed = 12.0; // m/s

      // Nitro handling
      let nitroMultiplier = 1.0;
      if (this.keys.nitro && this.nitroFuel > 0 && this.velocity > 2) {
        this.nitroActive = true;
        this.nitroFuel = Math.max(0, this.nitroFuel - delta * 32);
        nitroMultiplier = 1.65;
        this.car.flameL.visible = true;
        this.car.flameR.visible = true;
        this.audio.setNitro(true);
      } else {
        this.nitroActive = false;
        this.nitroFuel = Math.min(100, this.nitroFuel + delta * 8);
        this.car.flameL.visible = false;
        this.car.flameR.visible = false;
        this.audio.setNitro(false);
      }

      // Throttle & Acceleration
      const accelRate = (100 / cfg.accel / 3.6) * 1.3 * nitroMultiplier; // m/s^2
      const brakeRate = 32.0; // m/s^2
      const frictionRate = 4.2;

      let isThrottling = false;

      if (this.keys.forward) {
        isThrottling = true;
        if (this.velocity >= 0) {
          this.velocity = Math.min(maxForwardSpeed, this.velocity + accelRate * delta);
        } else {
          this.velocity += brakeRate * delta; // Braking when in reverse
        }
      } else if (this.keys.backward) {
        if (this.velocity > 0.5) {
          this.velocity = Math.max(0, this.velocity - brakeRate * delta); // Normal braking
          this.car.tailL.material.color.setHex(0xff0000);
          this.car.tailR.material.color.setHex(0xff0000);
        } else {
          // Reverse
          this.velocity = Math.max(-maxReverseSpeed, this.velocity - (accelRate * 0.4) * delta);
        }
      } else {
        // Natural rolling resistance & coasting
        if (this.velocity > 0) {
          this.velocity = Math.max(0, this.velocity - frictionRate * delta);
        } else if (this.velocity < 0) {
          this.velocity = Math.min(0, this.velocity + frictionRate * delta);
        }
      }

      // Handbrake & Drift Mechanics
      let driftFactor = 1.0;
      if (this.keys.handbrake) {
        this.isDrifting = Math.abs(this.velocity) > 8 && Math.abs(this.steeringAngle) > 0.08;
        this.velocity = Math.max(0, this.velocity - (brakeRate * 0.7) * delta);
        driftFactor = 2.4; // Exaggerates turn angle for drift
        this.audio.setSkid(this.isDrifting ? 1.0 : 0.4);
      } else {
        this.isDrifting = Math.abs(this.velocity) > 22 && Math.abs(this.steeringAngle) > 0.25;
        this.audio.setSkid(this.isDrifting ? 0.75 : 0);
      }

      // Steering Input & Speed-Sensitive Angle
      const maxSteer = 0.55; // Radians (~32 deg)
      const steerSpeed = 2.8 * delta;

      if (this.keys.left) {
        this.steeringAngle = Math.min(maxSteer, this.steeringAngle + steerSpeed);
      } else if (this.keys.right) {
        this.steeringAngle = Math.max(-maxSteer, this.steeringAngle - steerSpeed);
      } else {
        // Auto-center steering wheel
        if (this.steeringAngle > 0) {
          this.steeringAngle = Math.max(0, this.steeringAngle - steerSpeed * 1.5);
        } else if (this.steeringAngle < 0) {
          this.steeringAngle = Math.min(0, this.steeringAngle + steerSpeed * 1.5);
        }
      }

      // Yaw rotation (Car turning)
      if (Math.abs(this.velocity) > 0.05) {
        const turnSpeed = (this.steeringAngle * driftFactor) * (this.velocity / 14) * delta;
        this.car.mesh.rotation.y += turnSpeed;
      }

      // Move Car Forward / Backward in local facing direction
      const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.car.mesh.quaternion);
      this.car.mesh.position.addScaledVector(forwardVec, this.velocity * delta);

      // Boundaries clamp
      const limit = HALF_WORLD - 30;
      this.car.mesh.position.x = Math.max(-limit, Math.min(limit, this.car.mesh.position.x));
      this.car.mesh.position.z = Math.max(-limit, Math.min(limit, this.car.mesh.position.z));

      // Calculate Speed in KM/H
      this.speedKmh = Math.abs(this.velocity * 3.6);

      // Gear calculation (1 - 6 + Reverse + Neutral)
      if (this.velocity < -0.2) {
        this.activeGear = 'R';
      } else if (this.speedKmh < 1) {
        this.activeGear = 'N';
      } else if (this.speedKmh < 50) {
        this.activeGear = 1;
      } else if (this.speedKmh < 100) {
        this.activeGear = 2;
      } else if (this.speedKmh < 160) {
        this.activeGear = 3;
      } else if (this.speedKmh < 220) {
        this.activeGear = 4;
      } else if (this.speedKmh < 280) {
        this.activeGear = 5;
      } else {
        this.activeGear = 6;
      }

      // RPM Calculation (800 - 8500 RPM)
      const gearSpeed = typeof this.activeGear === 'number' ? this.activeGear * 55 : 50;
      const rpmRatio = Math.min(1.0, (this.speedKmh % gearSpeed) / gearSpeed + 0.15);
      const currentRpm = Math.floor(900 + rpmRatio * 7600);

      // Update Audio Engine
      this.audio.updateEngine(rpmRatio, isThrottling, this.activeGear === 'R');

      // Update Wheels rotation and Steering Turn
      const wheelRoll = (this.velocity * delta) / 0.38;
      for (const w of this.car.wheels) {
        w.group.children[0].rotation.x += wheelRoll; // Roll tire
        w.group.children[1].rotation.x += wheelRoll; // Roll rim
        if (w.isFront) {
          w.group.rotation.y = this.steeringAngle * 0.9; // Turn front wheels
        }
      }

      // Turn 3D Steering Wheel inside cockpit & rotate Driver's hands
      if (this.car.steeringWheel) {
        this.car.steeringWheel.rotation.z = -this.steeringAngle * 3.2;
      }

      // Dynamic Body Suspension Roll & Pitch
      const rollAngle = -this.steeringAngle * (this.velocity / 30) * 0.08;
      const pitchAngle = isThrottling ? -0.025 : (this.keys.backward ? 0.04 : 0);
      this.car.mesh.rotation.z = rollAngle;
      this.car.mesh.rotation.x = pitchAngle;

      // Odometer & Fuel
      this.odometerKm += (this.speedKmh * delta) / 3600;
      this.carFuel = Math.max(5.0, this.carFuel - (this.speedKmh * delta) / 45000);

      // Check Obstacle Collisions
      this.checkCollisions();
    }

    checkCollisions() {
      if (!this.car || !this.world) return;
      const pX = this.car.mesh.position.x;
      const pZ = this.car.mesh.position.z;

      for (const col of this.world.colliders) {
        const dx = pX - col.x;
        const dz = pZ - col.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < col.radius + 2.2) {
          // Collision Bounce response
          const overlap = (col.radius + 2.2) - dist;
          const normalX = dx / dist;
          const normalZ = dz / dist;

          this.car.mesh.position.x += normalX * overlap;
          this.car.mesh.position.z += normalZ * overlap;

          // Absorb speed
          this.velocity = -this.velocity * 0.35;
          break;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 9. DYNAMIC CAMERA CONTROLLER
    // -------------------------------------------------------------------------
    updateCamera() {
      if (!this.car) return;

      const mode = this.cameraModes[this.currentCameraIndex];
      const carPos = this.car.mesh.position;
      const carQuat = this.car.mesh.quaternion;

      switch (mode) {
        case 'cockpit': {
          // Inside car at driver's eye position looking forward
          const eyeOffset = new THREE.Vector3(-0.42, 1.25, -0.05).applyQuaternion(carQuat);
          this.camera.position.copy(carPos).add(eyeOffset);

          const lookTarget = new THREE.Vector3(0, 1.1, 15).applyQuaternion(carQuat).add(carPos);
          this.camera.lookAt(lookTarget);
          this.camera.fov = 72;
          this.camera.updateProjectionMatrix();
          break;
        }
        case 'hood': {
          // Low-angle front bumper view
          const hoodOffset = new THREE.Vector3(0, 0.95, 1.8).applyQuaternion(carQuat);
          this.camera.position.copy(carPos).add(hoodOffset);

          const lookTarget = new THREE.Vector3(0, 0.8, 20).applyQuaternion(carQuat).add(carPos);
          this.camera.lookAt(lookTarget);
          this.camera.fov = 78;
          this.camera.updateProjectionMatrix();
          break;
        }
        case 'orbit': {
          // 360-degree rotating drone view
          const time = Date.now() * 0.0008;
          const dist = 9.5;
          this.camera.position.set(
            carPos.x + Math.sin(time) * dist,
            carPos.y + 4.5,
            carPos.z + Math.cos(time) * dist
          );
          this.camera.lookAt(carPos.x, carPos.y + 1.2, carPos.z);
          break;
        }
        case 'chase':
        default: {
          // Dynamic Third-Person Chase Cam
          const fovBoost = this.nitroActive ? 12 : 0;
          this.camera.fov = 65 + fovBoost;
          this.camera.updateProjectionMatrix();

          // Camera trailing distance extends with speed
          const chaseDist = 7.5 + (this.speedKmh / 350) * 3.5;
          const chaseHeight = 3.2 + (this.speedKmh / 350) * 0.8;

          const chaseOffset = new THREE.Vector3(0, chaseHeight, -chaseDist).applyQuaternion(carQuat);
          const targetCamPos = new THREE.Vector3().copy(carPos).add(chaseOffset);

          // Smooth lerp trailing
          this.camera.position.lerp(targetCamPos, 0.12);

          const lookTarget = new THREE.Vector3(0, 1.4, 5).applyQuaternion(carQuat).add(carPos);
          this.camera.lookAt(lookTarget);
          break;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 10. HUD TELEMETRY & RADAR MINI-MAP UPDATE
    // -------------------------------------------------------------------------
    updateHUD() {
      // 1. Speedometer numbers & dial arcs
      const speedVal = Math.round(this.speedKmh);
      const speedEl = document.getElementById('hud-speed');
      const gearEl = document.getElementById('hud-gear');
      const rpmValEl = document.getElementById('hud-rpm-val');
      const fuelValEl = document.getElementById('hud-fuel-val');
      const odoValEl = document.getElementById('hud-odo-val');
      const nitroFillEl = document.getElementById('hud-nitro-fill');

      if (speedEl) speedEl.textContent = speedVal;
      if (gearEl) gearEl.textContent = this.activeGear;
      if (rpmValEl) {
        const rpm = Math.floor(900 + (this.speedKmh % 60) * 110);
        rpmValEl.textContent = rpm;
      }
      if (fuelValEl) fuelValEl.textContent = `${Math.round(this.carFuel)}%`;
      if (odoValEl) odoValEl.textContent = `${this.odometerKm.toFixed(1)} KM`;
      if (nitroFillEl) nitroFillEl.style.width = `${this.nitroFuel}%`;

      // SVG Gauge Arcs
      const speedArc = document.getElementById('gauge-speed-circle');
      if (speedArc) {
        const circumference = 440; // 2 * PI * 70
        const ratio = Math.min(1.0, this.speedKmh / 350);
        speedArc.style.strokeDashoffset = circumference - (circumference * ratio * 0.75);
      }

      // 2. Radar Mini-Map 2D Drawing
      if (this.minimapCtx && this.car) {
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = 0.35; // World to minimap pixel scale

        // Clear radar
        ctx.fillStyle = '#060d1b';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(cx, cy);
        // Rotate map so north is oriented or aligned with heading
        ctx.rotate(-this.car.mesh.rotation.y);

        const pX = this.car.mesh.position.x;
        const pZ = this.car.mesh.position.z;

        // Draw Boulevard roads
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 9;
        ctx.beginPath();
        // North-South Avenue
        ctx.moveTo((0 - pX) * scale, (-HALF_WORLD - pZ) * scale);
        ctx.lineTo((0 - pX) * scale, (HALF_WORLD - pZ) * scale);
        // East-West Avenue
        ctx.moveTo((-HALF_WORLD - pX) * scale, (0 - pZ) * scale);
        ctx.lineTo((HALF_WORLD - pX) * scale, (0 - pZ) * scale);
        ctx.stroke();

        // Draw River (cyan)
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo((115 - pX) * scale, (-250 - pZ) * scale);
        ctx.lineTo((115 - pX) * scale, (450 - pZ) * scale);
        ctx.stroke();

        // Draw Buildings (dark rectangles)
        ctx.fillStyle = '#475569';
        for (const col of this.world.colliders) {
          const bx = (col.x - pX) * scale;
          const bz = (col.z - pZ) * scale;
          if (Math.abs(bx) < cx && Math.abs(bz) < cy) {
            ctx.beginPath();
            ctx.arc(bx, bz, col.radius * scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw Moving Traffic (yellow dots)
        if (this.traffic) {
          ctx.fillStyle = '#f59e0b';
          for (const t of this.traffic.trafficCars) {
            const tx = (t.mesh.position.x - pX) * scale;
            const tz = (t.mesh.position.z - pZ) * scale;
            ctx.beginPath();
            ctx.arc(tx, tz, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }
    }

    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // -------------------------------------------------------------------------
    // 11. MAIN ANIMATION LOOP
    // -------------------------------------------------------------------------
    animate() {
      requestAnimationFrame(() => this.animate());

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Update Subsystems
      if (this.gameStarted && !this.isPaused) {
        this.updatePhysics(delta);

        const carPos = this.car ? this.car.mesh.position : null;
        if (this.pedestrians) this.pedestrians.update(delta);
        if (this.traffic) this.traffic.update(delta, carPos);

        // Animate water ripple
        if (this.world && this.world.waterMesh) {
          this.world.waterMesh.position.y = -1.2 + Math.sin(Date.now() * 0.002) * 0.08;
        }

        // Follow Rain Particles with player car
        if (this.rainParticles && this.rainParticles.visible && carPos) {
          this.rainParticles.position.set(carPos.x, 0, carPos.z);
          const pos = this.rainParticles.geometry.attributes.position;
          for (let i = 1; i < pos.count * 3; i += 3) {
            pos.array[i] -= 45 * delta;
            if (pos.array[i] < 0) pos.array[i] = 50;
          }
          pos.needsUpdate = true;
        }

        // Update Camera
        this.updateCamera();

        // Update Telemetry HUD
        this.updateHUD();
      } else if (!this.gameStarted && this.car) {
        // Slow turntable rotation on garage / main menu
        this.car.mesh.rotation.y += delta * 0.45;
        this.camera.position.set(0, 2.5, 7.5);
        this.camera.lookAt(0, 0.8, 0);
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  // Launch on window load
  window.addEventListener('DOMContentLoaded', () => {
    new ApexCarSimulator();
  });

})();
