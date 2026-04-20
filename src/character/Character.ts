import * as THREE from 'three'
import { AssetManager } from '../assets/AssetManager'

// If the GLTF cat model appears too large or small, adjust this.
// Quaternius models are often exported at cm scale, so 0.01 = 1 game-unit per meter.
const CAT_GLTF_SCALE = 1.5

export class Character {
  group: THREE.Group
  private visual: THREE.Group

  // Procedural limbs (only used when no GLTF model is available)
  private leftArm: THREE.Group
  private rightArm: THREE.Group
  private leftLeg: THREE.Group
  private rightLeg: THREE.Group
  private tail: THREE.Group
  private walkTime = 0
  private landTimer = 0

  // GLTF animation (only used when GLTF model is available)
  private mixer: THREE.AnimationMixer | null = null
  private idleAction: THREE.AnimationAction | null = null
  private walkAction: THREE.AnimationAction | null = null
  private runAction: THREE.AnimationAction | null = null
  private jumpAction: THREE.AnimationAction | null = null
  private currentAction: THREE.AnimationAction | null = null
  private danceAction: THREE.AnimationAction | null = null
  private gesturePositiveAction: THREE.AnimationAction | null = null
  private isSpecialPlaying = false
  private useGLTF = false

  constructor() {
    this.group = new THREE.Group()
    this.visual = new THREE.Group()
    this.group.add(this.visual)

    // Empty placeholder groups (used in procedural mode only)
    this.leftArm  = new THREE.Group()
    this.rightArm = new THREE.Group()
    this.leftLeg  = new THREE.Group()
    this.rightLeg = new THREE.Group()
    this.tail     = new THREE.Group()

    const assets = AssetManager.getInstance()
    if (assets.has('cat')) {
      this.buildGLTF(assets)
    } else {
      this.buildProcedural()
    }
  }

  // ── GLTF mode ────────────────────────────────────────────────

  private buildGLTF(assets: AssetManager) {
    this.useGLTF = true
    const catScene = assets.clone('cat')
    catScene.scale.setScalar(CAT_GLTF_SCALE)

    // Attach pink nose to body node so it follows body animation
    catScene.traverse(obj => {
      if (obj.name === 'body') {
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xff88aa, roughness: 0.4 })
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), noseMat)
        nose.position.set(0, 0.58, 0.68)
        obj.add(nose)
      }
    })

    this.visual.add(catScene)

    this.mixer = new THREE.AnimationMixer(catScene)
    const clips = assets.getAnimations('cat')

    const findClip = (keyword: string) =>
      clips.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()))

    const idleClip    = findClip('idle')
    const walkClip    = findClip('walk')
    const runClip     = findClip('run')
    const jumpClip    = findClip('jump')
    const danceClip   = findClip('dance')
    const gesturePosClip = findClip('gesture-positive')

    if (idleClip) this.idleAction = this.mixer.clipAction(idleClip)
    if (walkClip) this.walkAction = this.mixer.clipAction(walkClip)
    if (runClip)  this.runAction  = this.mixer.clipAction(runClip)
    if (jumpClip) {
      this.jumpAction = this.mixer.clipAction(jumpClip)
      this.jumpAction.setLoop(THREE.LoopOnce, 1)
      this.jumpAction.clampWhenFinished = true
    }
    if (danceClip) this.danceAction = this.mixer.clipAction(danceClip)
    if (gesturePosClip) {
      this.gesturePositiveAction = this.mixer.clipAction(gesturePosClip)
      this.gesturePositiveAction.setLoop(THREE.LoopRepeat, 2)
      this.gesturePositiveAction.clampWhenFinished = true
      this.gesturePositiveAction.timeScale = 0.45
    }

    // Return to idle after gesture-positive finishes
    this.mixer.addEventListener('finished', (e) => {
      if (e.action === this.gesturePositiveAction) {
        this.isSpecialPlaying = false
        this.switchAction(this.idleAction, 0.3)
      }
    })

    this.currentAction = this.idleAction
    this.idleAction?.play()
  }

  playDance() {
    if (!this.danceAction) return
    this.isSpecialPlaying = true
    this.switchAction(this.danceAction, 0.4)
  }

  playGesturePositive() {
    if (!this.gesturePositiveAction) return
    this.isSpecialPlaying = true
    this.switchAction(this.gesturePositiveAction, 0.15)
  }

  stopSpecial() {
    this.isSpecialPlaying = false
  }

  private switchAction(target: THREE.AnimationAction | null, fadeDuration = 0.2) {
    if (!target || target === this.currentAction) return
    target.reset().play()
    this.currentAction?.crossFadeTo(target, fadeDuration, true)
    this.currentAction = target
  }

  // ── Procedural mode ─────────────────────────────────────────

  private buildProcedural() {
    const whiteFur  = new THREE.MeshToonMaterial({ color: 0xfff5e8 })
    const orangeFur = new THREE.MeshToonMaterial({ color: 0xff8c32 })
    const darkFur   = new THREE.MeshToonMaterial({ color: 0x272727 })
    const bellyMat  = new THREE.MeshToonMaterial({ color: 0xfff0e0 })
    const earInner  = new THREE.MeshToonMaterial({ color: 0xffb3c6 })
    const noseMat   = new THREE.MeshToonMaterial({ color: 0xff99aa })
    const eyeMat    = new THREE.MeshBasicMaterial({ color: 0x111111 })
    const shineMat  = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const blushMat  = new THREE.MeshToonMaterial({ color: 0xffb3b3, transparent: true, opacity: 0.55 })
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide })
    const collarMat = new THREE.MeshToonMaterial({ color: 0x7733cc })
    const bellMat   = new THREE.MeshToonMaterial({ color: 0xffd700 })
    const pawMat    = new THREE.MeshToonMaterial({ color: 0xffeedd })

    // ── BODY
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 12), whiteFur)
    body.scale.set(1.12, 1.0, 1.05)
    body.position.y = 0.60
    body.castShadow = true
    this.visual.add(body)

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), bellyMat)
    belly.scale.set(1.0, 1.3, 0.38)
    belly.position.set(0, 0.58, 0.38)
    this.visual.add(belly)

    const oBody = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 10), orangeFur)
    oBody.position.set(0.26, 0.68, 0.08)
    oBody.castShadow = true
    this.visual.add(oBody)

    const dBody = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), darkFur)
    dBody.position.set(-0.30, 0.36, 0.10)
    dBody.castShadow = true
    this.visual.add(dBody)

    // ── HEAD
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), whiteFur)
    head.scale.set(1.05, 1.0, 1.0)
    head.position.y = 1.32
    head.castShadow = true
    this.visual.add(head)

    const oHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), orangeFur)
    oHead.position.set(0.22, 1.52, 0.05)
    oHead.castShadow = true
    this.visual.add(oHead)

    const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), darkFur)
    dHead.position.set(-0.21, 1.52, 0.05)
    dHead.castShadow = true
    this.visual.add(dHead)

    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), bellyMat)
    chin.scale.set(1.0, 0.55, 0.55)
    chin.position.set(0, 1.22, 0.30)
    this.visual.add(chin)

    // ── EARS
    const earDefs: [number, THREE.Material][] = [[-1, darkFur], [1, orangeFur]]
    for (const [sx, mat] of earDefs) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 3), mat)
      ear.position.set(sx * 0.25, 1.88, -0.04)
      ear.rotation.z = sx * 0.22
      ear.castShadow = true
      this.visual.add(ear)
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.26, 3), earInner)
      inner.position.set(sx * 0.25, 1.87, 0.06)
      inner.rotation.z = sx * 0.22
      this.visual.add(inner)
    }

    // ── EYES
    for (const [ex, flip] of [[-0.15, 1], [0.15, -1]] as [number, number][]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), eyeMat)
      eye.position.set(ex, 1.33, 0.34)
      this.visual.add(eye)
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.027, 6, 5), shineMat)
      shine.position.set(ex - flip * 0.025, 1.345, 0.415)
      this.visual.add(shine)
    }

    // ── BLUSH
    for (const sx of [-1, 1]) {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.088, 8, 6), blushMat)
      blush.scale.z = 0.32
      blush.position.set(sx * 0.27, 1.26, 0.32)
      this.visual.add(blush)
    }

    // ── NOSE
    const nose = new THREE.Mesh(new THREE.TetrahedronGeometry(0.045), noseMat)
    nose.position.set(0, 1.245, 0.363)
    this.visual.add(nose)

    // ── WHISKERS
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.009, 0.006), whiskerMat)
        w.position.set(side * 0.29, 1.225 + (i - 1) * 0.04, 0.30)
        w.rotation.z = side * (i - 1) * 0.10
        this.visual.add(w)
      }
    }

    // ── COLLAR + BELL
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 18), collarMat)
    collar.position.set(0, 0.96, 0)
    this.visual.add(collar)

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), bellMat)
    bell.position.set(0, 0.88, 0.22)
    this.visual.add(bell)

    const bellLoop = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.010, 6, 10), bellMat)
    bellLoop.position.set(0, 0.930, 0.22)
    this.visual.add(bellLoop)

    // ── ARMS
    this.leftArm = new THREE.Group()
    const lArmCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.088, 0.32, 10), whiteFur)
    lArmCyl.position.y = -0.16; lArmCyl.castShadow = true
    const lPaw = new THREE.Mesh(new THREE.SphereGeometry(0.118, 10, 8), pawMat)
    lPaw.scale.set(1.15, 0.72, 1.22); lPaw.position.y = -0.35
    this.leftArm.add(lArmCyl, lPaw)
    this.leftArm.position.set(-0.53, 0.82, 0)
    this.visual.add(this.leftArm)

    this.rightArm = new THREE.Group()
    const rArmCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.088, 0.32, 10), whiteFur)
    rArmCyl.position.y = -0.16; rArmCyl.castShadow = true
    const rPaw = new THREE.Mesh(new THREE.SphereGeometry(0.118, 10, 8), pawMat)
    rPaw.scale.set(1.15, 0.72, 1.22); rPaw.position.y = -0.35
    this.rightArm.add(rArmCyl, rPaw)
    this.rightArm.position.set(0.53, 0.82, 0)
    this.visual.add(this.rightArm)

    // ── LEGS
    this.leftLeg = new THREE.Group()
    const lLegCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.090, 0.36, 10), whiteFur)
    lLegCyl.position.y = -0.18; lLegCyl.castShadow = true
    const lFoot = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), pawMat)
    lFoot.scale.set(1.0, 0.62, 1.38); lFoot.position.set(0, -0.41, 0.06)
    this.leftLeg.add(lLegCyl, lFoot)
    this.leftLeg.position.set(-0.24, 0.28, 0)
    this.visual.add(this.leftLeg)

    this.rightLeg = new THREE.Group()
    const rLegCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.090, 0.36, 10), whiteFur)
    rLegCyl.position.y = -0.18; rLegCyl.castShadow = true
    const rFoot = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), pawMat)
    rFoot.scale.set(1.0, 0.62, 1.38); rFoot.position.set(0, -0.41, 0.06)
    this.rightLeg.add(rLegCyl, rFoot)
    this.rightLeg.position.set(0.24, 0.28, 0)
    this.visual.add(this.rightLeg)

    // ── TAIL
    this.tail = new THREE.Group()
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.00,  0.46, -0.38),
      new THREE.Vector3(0.12,  0.72, -0.48),
      new THREE.Vector3(0.30,  0.98, -0.44),
      new THREE.Vector3(0.46,  1.12, -0.24),
      new THREE.Vector3(0.52,  1.10,  0.04),
    ])
    const tailMesh = new THREE.Mesh(
      new THREE.TubeGeometry(tailCurve, 14, 0.068, 8, false), orangeFur
    )
    tailMesh.castShadow = true
    this.tail.add(tailMesh)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.092, 10, 8), whiteFur)
    tip.position.set(0.52, 1.10, 0.04)
    this.tail.add(tip)
    this.visual.add(this.tail)
  }

  // ── Shared update ────────────────────────────────────────────

  update(delta: number, isMoving: boolean, isJumping: boolean = false, isDashing: boolean = false) {
    if (this.useGLTF && this.mixer) {
      this.mixer.update(delta)
      if (isJumping) {
        this.isSpecialPlaying = false
        this.switchAction(this.jumpAction ?? this.idleAction, 0.15)
      } else if (isMoving) {
        this.isSpecialPlaying = false
        if (isDashing) {
          this.switchAction(this.runAction ?? this.walkAction ?? this.idleAction, 0.15)
        } else {
          this.switchAction(this.walkAction ?? this.idleAction, 0.2)
        }
      } else if (!this.isSpecialPlaying) {
        this.switchAction(this.idleAction, 0.3)
      }
      return
    }

    // Procedural animation
    if (isJumping) {
      this.leftArm.rotation.x = -0.9
      this.leftArm.rotation.z = -0.5
      this.rightArm.rotation.x = -0.9
      this.rightArm.rotation.z = 0.5
      this.leftLeg.rotation.x = -0.5
      this.rightLeg.rotation.x = -0.5
      this.tail.rotation.z = -0.4
      this.visual.scale.lerp(new THREE.Vector3(0.88, 1.18, 0.88), 0.25)
      this.visual.position.y = 0
      this.landTimer = 0.14
    } else if (this.landTimer > 0) {
      this.landTimer -= delta
      this.visual.scale.lerp(new THREE.Vector3(1.22, 0.72, 1.22), 0.5)
      this.leftArm.rotation.z  *= 0.7
      this.rightArm.rotation.z *= 0.7
      this.leftLeg.rotation.x  *= 0.7
      this.rightLeg.rotation.x *= 0.7
      this.tail.rotation.z     *= 0.8
    } else if (isMoving) {
      this.walkTime += delta * 9
      const sw = Math.sin(this.walkTime) * 0.55
      this.leftArm.rotation.x  =  sw; this.leftArm.rotation.z  = 0
      this.rightArm.rotation.x = -sw; this.rightArm.rotation.z = 0
      this.leftLeg.rotation.x  = -sw
      this.rightLeg.rotation.x =  sw
      this.tail.rotation.z = Math.sin(this.walkTime * 0.5) * 0.3
      this.visual.position.y = Math.abs(Math.sin(this.walkTime)) * 0.07
      this.visual.scale.lerp(new THREE.Vector3(1, 1, 1), 0.3)
    } else {
      this.walkTime += delta * 1.8
      this.visual.position.y = Math.sin(this.walkTime) * 0.025
      this.leftArm.rotation.x  *= 0.8; this.leftArm.rotation.z  *= 0.8
      this.rightArm.rotation.x *= 0.8; this.rightArm.rotation.z *= 0.8
      this.leftLeg.rotation.x  *= 0.8; this.rightLeg.rotation.x *= 0.8
      this.tail.rotation.z = Math.sin(this.walkTime * 1.5) * 0.4
      this.visual.scale.lerp(new THREE.Vector3(1, 1, 1), 0.3)
    }
  }

  setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z)
  }

  getPosition(): THREE.Vector3 {
    return this.group.position.clone()
  }
}
