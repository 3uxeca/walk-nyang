import * as THREE from 'three'
import { Character } from './character/Character'
import { Controller, inputToVelocity } from './character/Controller'
import { ThirdPersonCamera } from './camera/ThirdPersonCamera'
import { ChunkManager, WORLD_SEED } from './world/ChunkManager'
import { ItemSystem } from './game/ItemSystem'
import { ProgressSystem } from './game/ProgressSystem'
import { RegionManager } from './game/RegionManager'
import { SaveSystem, CURRENT_VERSION, CURRENT_ITEM_SCHEMA_VERSION } from './game/SaveSystem'
import { HUD } from './ui/HUD'
import { RegionUnlockFX } from './ui/RegionUnlockFX'
import { ControlsHUD } from './ui/ControlsHUD'
import { CollectFX } from './game/CollectFX'
import { HeartFX } from './game/HeartFX'
import { playMeow, playJump, startPurring, stopPurring, playFootstep, playDashWhoosh } from './game/SoundSystem'
import { getTerrainHeight } from './world/Terrain'
import { CHUNK_SIZE } from './world/ChunkGenerator'
import { checkBuildingCollision } from './world/BuildingColliders'
import { AssetManager, ASSET_MANIFEST } from './assets/AssetManager'
import { SkySystem } from './world/SkySystem'

const AUTOSAVE_INTERVAL_MS = 30_000

let renderer: THREE.WebGLRenderer | null = null
let animationId: number | null = null
let controller: Controller | null = null
let chunkManager: ChunkManager | null = null
let itemSystem: ItemSystem | null = null
let autosaveTimer: ReturnType<typeof setInterval> | null = null
let hud: HUD | null = null
let controlsHUD: ControlsHUD | null = null
let collectFX: CollectFX | null = null
let heartFX: HeartFX | null = null
let skySystem: SkySystem | null = null
let verticalVelocity = 0
let isOnGround = true
let idleTime = 0
let isPurring = false
let isDancing = false
let footstepTimer = 0
let wasDashing = false
let _onResize: (() => void) | null = null
const occRaycaster = new THREE.Raycaster()
const fadedMeshes = new Set<THREE.Mesh>()

async function init() {
  // Preload GLTF assets (failures are silent — game falls back to procedural)
  const assets = AssetManager.getInstance()
  await assets.preload(ASSET_MANIFEST)
  document.getElementById('loading')?.remove()

  const canvas = document.createElement('canvas')
  document.getElementById('app')!.appendChild(canvas)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xb8d9f0, 40, 110)
  scene.background = new THREE.Color(0xb8d9f0)
  skySystem = new SkySystem(scene)

  const thirdPersonCamera = new ThirdPersonCamera(window.innerWidth / window.innerHeight)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const hemi = new THREE.HemisphereLight(0xb0d8ff, 0x8dc888, 0.5)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfffbe6, 1.2)
  sun.position.set(30, 50, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 0.1
  sun.shadow.camera.far = 200
  sun.shadow.camera.left = -60
  sun.shadow.camera.right = 60
  sun.shadow.camera.top = 60
  sun.shadow.camera.bottom = -60
  scene.add(sun)

  const rimLight = new THREE.DirectionalLight(0xc9e8ff, 0.6)
  rimLight.position.set(-20, 30, -20)
  scene.add(rimLight)

  const character = new Character()
  character.setPosition(0, 0, 0)
  scene.add(character.group)

  const regionManager = new RegionManager()
  const progressSystem = new ProgressSystem()

  const saveSystem = new SaveSystem(WORLD_SEED)
  const saveData = saveSystem.load()

  const collectedItemIds = new Set<string>()
  if (saveData) {
    for (const id of saveData.collectedItemIds) {
      collectedItemIds.add(id)
      progressSystem.collect(id)
    }
    for (const regionId of saveData.unlockedRegions) {
      regionManager.unlockRegion(regionId)
    }
    if (saveData.playerPosition) {
      character.setPosition(saveData.playerPosition.x, 0, saveData.playerPosition.z)
    }
  }

  hud = new HUD()
  controlsHUD = new ControlsHUD()
  const regionUnlockFX = new RegionUnlockFX()

  hud.update(
    progressSystem.getTotalCollected(),
    progressSystem.getNextLevelThreshold(),
    `${progressSystem.getCurrentLevel()}`
  )

  collectFX = new CollectFX(scene)
  heartFX = new HeartFX(scene)

  chunkManager = new ChunkManager(scene)
  chunkManager.setRegionManager(regionManager)

  function buildSaveData() {
    const pos = character.getPosition()
    return {
      version: CURRENT_VERSION,
      worldSeed: WORLD_SEED,
      itemSchemaVersion: CURRENT_ITEM_SCHEMA_VERSION,
      collectedItemIds: Array.from(collectedItemIds),
      unlockedRegions: regionManager.getUnlockedRegions(),
      playerPosition: { x: pos.x, z: pos.z },
    }
  }

  itemSystem = new ItemSystem(scene, collectedItemIds, (id) => {
    progressSystem.collect(id)
    playMeow()
    character.playGesturePositive()
    const colors = [0xffe066, 0xffb347, 0xb39ddb]
    const col = colors[Math.floor(Math.random() * colors.length)]
    const pos = character.getPosition()
    collectFX!.spawn(pos.x, pos.y + 1.0, pos.z, col)
    hud!.update(
      progressSystem.getTotalCollected(),
      progressSystem.getNextLevelThreshold(),
      `${progressSystem.getCurrentLevel()}`
    )
    saveSystem.save(buildSaveData())
  })
  chunkManager.setItemSystem(itemSystem)

  progressSystem.onLevelUp = (_newLevel, regionId) => {
    regionManager.unlockRegion(regionId)
    chunkManager!.onRegionUnlocked(regionId)
    regionUnlockFX.showUnlock(regionId)
  }

  controller = new Controller()

  const clock = new THREE.Clock()
  const speed = 8
  const dashSpeed = 18

  const GRAVITY = -25
  const JUMP_FORCE = 11
  verticalVelocity = 0
  isOnGround = true

  autosaveTimer = setInterval(() => {
    saveSystem.save(buildSaveData())
  }, AUTOSAVE_INTERVAL_MS)

  const onResize = () => {
    thirdPersonCamera.onResize(window.innerWidth / window.innerHeight)
    renderer!.setSize(window.innerWidth, window.innerHeight)
  }
  _onResize = onResize
  window.addEventListener('resize', onResize)

  function animate() {
    animationId = requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.05)

    const isDashing = controller!.input.dash && controller!.isMoving()
    if (isDashing && !wasDashing) playDashWhoosh()
    wasDashing = isDashing
    const vel = inputToVelocity(controller!.input, isDashing ? dashSpeed : speed, thirdPersonCamera.angle)
    const charPos = character.getPosition()
    const prevX = charPos.x
    const prevZ = charPos.z
    charPos.add(vel.clone().multiplyScalar(delta))

    // Block horizontal movement into platform walls (must jump to get on top)
    const STEP_HEIGHT = 0.35
    const newGroundH = getTerrainHeight(charPos.x, charPos.z, WORLD_SEED)
    if (newGroundH > charPos.y + STEP_HEIGHT) {
      charPos.x = prevX
      charPos.z = prevZ
    }

    // Block movement into buildings (sliding wall collision)
    if (checkBuildingCollision(charPos.x, charPos.z)) {
      const tryX = charPos.clone(); tryX.x = prevX
      if (!checkBuildingCollision(tryX.x, tryX.z)) {
        charPos.x = prevX
      } else {
        charPos.z = prevZ
        if (checkBuildingCollision(charPos.x, charPos.z)) charPos.x = prevX
      }
    }

    // Block movement into locked regions, but allow travel along the road band
    const targetCX = Math.floor(charPos.x / CHUNK_SIZE)
    const targetCZ = Math.floor(charPos.z / CHUNK_SIZE)
    if (regionManager.getChunkState(targetCX, targetCZ) === 'locked') {
      const ROAD_HALF = 9
      const lx = ((charPos.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE - CHUNK_SIZE / 2
      const lz = ((charPos.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE - CHUNK_SIZE / 2
      const onRoad = Math.abs(lx) <= ROAD_HALF || Math.abs(lz) <= ROAD_HALF
      if (!onRoad) {
        charPos.x = prevX
        charPos.z = prevZ
      }
    }

    // Jump
    if (controller!.input.jump && isOnGround) {
      verticalVelocity = JUMP_FORCE
      isOnGround = false
      controller!.input.jump = false
      playJump()
    }

    // Gravity
    verticalVelocity += GRAVITY * delta
    const rawY = charPos.y + verticalVelocity * delta
    const groundH = getTerrainHeight(charPos.x, charPos.z, WORLD_SEED)
    if (rawY <= groundH) {
      charPos.y = groundH
      verticalVelocity = 0
      isOnGround = true
    } else {
      charPos.y = rawY
      if (isOnGround && rawY > groundH + 0.05) {
        isOnGround = false
      }
    }

    character.group.position.copy(charPos)

    if (vel.lengthSq() > 0) {
      const targetAngle = Math.atan2(vel.x, vel.z)
      const currentAngle = character.group.rotation.y
      let diff = targetAngle - currentAngle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      character.group.rotation.y += diff * 0.15
    }

    const moving = controller!.isMoving()

    // Purring + dance + hearts: start after 5s idle, stop on movement
    if (moving || !isOnGround || isDashing) {
      idleTime = 0
      if (isPurring) { stopPurring(); isPurring = false }
      if (isDancing) { isDancing = false; character.stopSpecial() }
      heartFX!.clear()
    } else {
      idleTime += delta
      if (idleTime >= 5) {
        if (!isPurring) { startPurring(); isPurring = true }
        if (!isDancing) { character.playDance(); isDancing = true }
      }
    }
    heartFX!.update(delta, isDancing, charPos.x, charPos.y, charPos.z, thirdPersonCamera.camera.position)

    // Footsteps while walking on ground (faster interval when dashing)
    if (moving && isOnGround) {
      footstepTimer -= delta
      if (footstepTimer <= 0) { playFootstep(); footstepTimer = isDashing ? 0.18 : 0.38 }
    } else {
      footstepTimer = 0
    }

    character.update(delta, moving, !isOnGround, isDashing)
    controlsHUD!.update(controller!.input)
    thirdPersonCamera.update(character.getPosition())

    chunkManager!.update(charPos.x, charPos.z)
    chunkManager!.processSwaps(1)
    itemSystem!.update(delta, charPos.x, charPos.z)
    collectFX!.update(delta)
    skySystem!.update(delta)

    // Building occlusion: fade meshes between camera and cat
    const camPos = thirdPersonCamera.camera.position
    const catCenter = character.getPosition().clone()
    catCenter.y += 1.2
    const towardCat = catCenter.clone().sub(camPos)
    const distToCat = towardCat.length()
    occRaycaster.set(camPos, towardCat.normalize())
    const hits = occRaycaster.intersectObjects(scene.children, true)
    const nowFaded = new Set<THREE.Mesh>()
    for (const hit of hits) {
      if (hit.distance >= distToCat - 0.3) break
      if (!(hit.object instanceof THREE.Mesh)) continue
      const m = hit.object as THREE.Mesh
      if (!m.userData.occludable) continue
      nowFaded.add(m)
    }
    for (const m of fadedMeshes) {
      if (!nowFaded.has(m)) {
        const mat = m.material as THREE.Material & { transparent: boolean; opacity: number }
        mat.transparent = m.userData._origTransparent as boolean
        mat.opacity = m.userData._origOpacity as number
        fadedMeshes.delete(m)
      }
    }
    for (const m of nowFaded) {
      if (!fadedMeshes.has(m)) {
        const mat = m.material as THREE.Material & { transparent: boolean; opacity: number }
        m.userData._origTransparent = mat.transparent
        m.userData._origOpacity = mat.opacity
        mat.transparent = true
        mat.opacity = 0.18
        fadedMeshes.add(m)
      }
    }

    renderer!.render(scene, thirdPersonCamera.camera)
  }
  animate()
}

init().catch(console.error)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (animationId !== null) cancelAnimationFrame(animationId)
    stopPurring()
    if (renderer) { renderer.dispose(); renderer.domElement.remove() }
    if (controller) controller.dispose()
    if (chunkManager) chunkManager.dispose()
    if (itemSystem) itemSystem.dispose()
    if (autosaveTimer !== null) clearInterval(autosaveTimer)
    if (hud) hud.dispose()
    if (controlsHUD) controlsHUD.dispose()
    if (collectFX) collectFX.dispose()
    if (heartFX) heartFX.dispose()
    if (skySystem) skySystem.dispose()
    skySystem = null
    if (_onResize) window.removeEventListener('resize', _onResize)
    AssetManager.reset()
    animationId = null
    renderer = null
    controller = null
    chunkManager = null
    itemSystem = null
    autosaveTimer = null
    hud = null
    controlsHUD = null
    collectFX = null
    heartFX = null
    _onResize = null
    verticalVelocity = 0
    isOnGround = true
  })
}
