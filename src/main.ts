import * as THREE from 'three'
import { Character } from './character/Character'
import { Controller, inputToVelocity } from './character/Controller'
import { ThirdPersonCamera } from './camera/ThirdPersonCamera'
import { ChunkManager, WORLD_SEED } from './world/ChunkManager'
import { ItemSystem } from './game/ItemSystem'
import { ProgressSystem } from './game/ProgressSystem'
import { RegionManager, regionForChunk, getRegionInfo } from './game/RegionManager'
import { SaveSystem, CURRENT_VERSION, CURRENT_ITEM_SCHEMA_VERSION } from './game/SaveSystem'
import { ITEM_WEIGHT } from './game/ItemTypes'
import type { ItemType } from './game/ItemTypes'
import { HUD } from './ui/HUD'
import { RegionUnlockFX } from './ui/RegionUnlockFX'
import { ControlsHUD } from './ui/ControlsHUD'
import { Toast } from './ui/Toast'
import { VirtualJoystick } from './ui/VirtualJoystick'
import { MobileActionButtons } from './ui/MobileActionButtons'
import { TouchInputSource, isMobileEnvironment } from './character/TouchInputSource'
import { LandingScreen } from './ui/LandingScreen'
import { HelpButton } from './ui/HelpButton'
import { TutorialModal } from './ui/TutorialModal'
import { CollectFX } from './game/CollectFX'
import { HeartFX } from './game/HeartFX'
import { DashTrailFX } from './game/DashTrailFX'
import { playMeow, playJump, startPurring, stopPurring, playFootstep, playDashWhoosh } from './game/SoundSystem'
import { getTerrainHeight } from './world/Terrain'
import { CHUNK_SIZE } from './world/ChunkGenerator'
import { checkBuildingCollision } from './world/BuildingColliders'
import { AssetManager, ASSET_MANIFEST } from './assets/AssetManager'
import { SkySystem } from './world/SkySystem'

const AUTOSAVE_INTERVAL_MS = 30_000
// 토스트·모달 공용 본문. pre-line 렌더로 \n은 실제 줄바꿈, \n\n은 섹션 구분 빈 줄.
const TUTORIAL_MESSAGE = '산책냥과 함께 마을을 산책하면서 아이템을 모으고,\n새로운 지역을 열어보세요✨\n\n💡 DASH를 하면 달릴 수 있어요🐾'
const TUTORIAL_EMOJI = '🐈'

let renderer: THREE.WebGLRenderer | null = null
let animationId: number | null = null
let controller: Controller | null = null
let chunkManager: ChunkManager | null = null
let itemSystem: ItemSystem | null = null
let autosaveTimer: ReturnType<typeof setInterval> | null = null
let tutorialTimerId: ReturnType<typeof setTimeout> | null = null
let hud: HUD | null = null
let controlsHUD: ControlsHUD | null = null
let toast: Toast | null = null
let virtualJoystick: VirtualJoystick | null = null
let mobileButtons: MobileActionButtons | null = null
let touchInputSource: TouchInputSource | null = null
let landingScreen: LandingScreen | null = null
let helpButton: HelpButton | null = null
let tutorialModal: TutorialModal | null = null
let collectFX: CollectFX | null = null
let heartFX: HeartFX | null = null
let dashTrailFX: DashTrailFX | null = null
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

  // 랜딩 게이트 — 사용자가 START 누를 때까지 게임 init 보류.
  // 첫 클릭으로 Web Audio context도 자연스럽게 unlock된다.
  await new Promise<void>(resolve => {
    landingScreen = new LandingScreen(() => {
      landingScreen = null  // dispose는 컴포넌트 내부 setTimeout에서 처리
      resolve()
    }, {
      logoUrl: `${import.meta.env.BASE_URL}walk-nyang-logo.png`,
      title: '산책냥',
      subtitle: '귀여운 고양이가 되어 마을을 거닐어 보세요',
      buttonLabel: '시작하기',
      hint: '🎧 소리를 켜고, 고양이에게 귀 기울여봐요',
    })
  })

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
  let tutorialSeen = !!saveData?.tutorialSeen

  const collectedItemIds = new Set<string>()
  if (saveData) {
    // 수집한 id는 중복 스폰 방지용으로만 필요 — weight 반영은 totalCollected로 별도 복원.
    for (const id of saveData.collectedItemIds) {
      collectedItemIds.add(id)
    }
    progressSystem.setTotalCollected(
      saveData.totalCollected ?? saveData.collectedItemIds.length,
      saveData.collectedItemIds,
    )
    for (const regionId of saveData.unlockedRegions) {
      regionManager.unlockRegion(regionId)
    }
    if (saveData.playerPosition) {
      character.setPosition(saveData.playerPosition.x, 0, saveData.playerPosition.z)
    }
  }

  const isMobile = isMobileEnvironment()

  hud = new HUD()
  // 데스크탑에선 키가이드 HUD 표시. 모바일에선 가상 조이스틱/버튼이 대신하므로 생성 안 함.
  if (!isMobile) {
    controlsHUD = new ControlsHUD()
  }
  toast = new Toast()

  // 튜토리얼 안내 — 최초 1회 토스트 + 언제든 `?` 버튼으로 모달 재호출.
  // 모바일은 좌하단이 조이스틱 자리라 `?`를 top-right로 옮김.
  tutorialModal = new TutorialModal(TUTORIAL_MESSAGE, TUTORIAL_EMOJI)
  helpButton = new HelpButton({
    position: isMobile ? 'top-right' : 'bottom-left',
    onClick: () => tutorialModal?.open(),
  })
  if (!tutorialSeen) {
    // 랜딩 페이드아웃 후 첫 프레임이 보이면 자연스럽게 토스트 띄움.
    // save는 실제로 토스트가 뜬 뒤 기록 — 700ms 안에 탭 닫히면 다음 세션에서 한 번 더 볼 수 있게.
    tutorialTimerId = setTimeout(() => {
      toast?.show(TUTORIAL_MESSAGE, TUTORIAL_EMOJI, 'tutorial', 0, 5500, { wrap: true })
      tutorialSeen = true
      saveSystem.save(buildSaveData())
      tutorialTimerId = null
    }, 700)
  }

  const regionUnlockFX = new RegionUnlockFX()

  function currentRegionInfo() {
    const pos = character.getPosition()
    const cx = Math.floor(pos.x / CHUNK_SIZE)
    const cz = Math.floor(pos.z / CHUNK_SIZE)
    return { id: regionForChunk(cx, cz), ...getRegionInfo(regionForChunk(cx, cz)) }
  }

  const initialRegion = currentRegionInfo()
  let lastRegionId = initialRegion.id

  hud.update(
    progressSystem.getTotalCollected(),
    progressSystem.getNextLevelThreshold(),
    initialRegion.name,
    initialRegion.emoji,
    initialRegion.specialty?.emoji
  )

  collectFX = new CollectFX(scene)
  heartFX = new HeartFX(scene)
  dashTrailFX = new DashTrailFX(scene)

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
      tutorialSeen,
      totalCollected: progressSystem.getTotalCollected(),
    }
  }

  itemSystem = new ItemSystem(scene, collectedItemIds, (id, type) => {
    progressSystem.collect(id, ITEM_WEIGHT[type])
    playMeow()
    character.playGesturePositive()
    // 특산품은 기본과 구분되는 색상으로 수집 FX
    const baseColors = [0xffe066, 0xffb347, 0xb39ddb]
    // Partial로 선언해 특산품 4종만 엔트리를 가짐. 기본 타입은 baseColors로 폴백.
    const specialtyColors: Partial<Record<ItemType, number>> = {
      flower: 0xff8fb1, fish: 0x7ec8e3, clover: 0x7ccc4a, droplet: 0x6ec8ff,
    }
    const col = specialtyColors[type] ?? baseColors[Math.floor(Math.random() * baseColors.length)]
    const pos = character.getPosition()
    collectFX!.spawn(pos.x, pos.y + 1.0, pos.z, col)
    const ri = currentRegionInfo()
    hud!.update(
      progressSystem.getTotalCollected(),
      progressSystem.getNextLevelThreshold(),
      ri.name,
      ri.emoji,
      ri.specialty?.emoji
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

  // 모바일이면 가상 조이스틱 + 액션 버튼을 추가 입력 소스로 등록
  if (isMobile) {
    virtualJoystick = new VirtualJoystick()
    mobileButtons = new MobileActionButtons()
    touchInputSource = new TouchInputSource(virtualJoystick, mobileButtons, false)
    controller.addSource(touchInputSource)
  }

  const clock = new THREE.Clock()
  const speed = 8
  const dashSpeed = 18

  const GRAVITY = -25
  const JUMP_FORCE = 11
  // 대시 중 점프 — 체감상 약 1.7배 높이 (v^2 비례이므로 force 1.32배면 높이 ~1.75배)
  const JUMP_FORCE_DASH = 14.5
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

    // 매 프레임 입력 소스들을 OR-reduce해서 controller.input에 반영
    controller!.update(delta)

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

    // 청크 메시가 아직 빌드되지 않은 영역으로의 진입 차단 (worker 로딩 지연 시)
    const targetCX = Math.floor(charPos.x / CHUNK_SIZE)
    const targetCZ = Math.floor(charPos.z / CHUNK_SIZE)
    const prevCX = Math.floor(prevX / CHUNK_SIZE)
    const prevCZ = Math.floor(prevZ / CHUNK_SIZE)
    let chunkBlocked = false
    if ((prevCX !== targetCX || prevCZ !== targetCZ) && !chunkManager!.hasChunk(targetCX, targetCZ)) {
      charPos.x = prevX
      charPos.z = prevZ
      toast!.show('지역을 불러오는 중이에요', '⏳', 'unloaded-chunk', 1200)
      chunkBlocked = true
    }

    // 잠긴 지역은 하드 블록 — 이전엔 road band 예외가 있었으나 플레이 경험상
    // 잠긴 지역으로의 진입 자체를 막는 편이 직관적.
    if (!chunkBlocked && regionManager.getChunkState(targetCX, targetCZ) === 'locked') {
      const prevState = regionManager.getChunkState(prevCX, prevCZ)
      // 플레이어가 이미 잠긴 청크 안에 갇히는 기묘한 상황(세이브 복원 등)은 허용 — 그 외엔 차단
      if (prevState !== 'locked') {
        charPos.x = prevX
        charPos.z = prevZ
        toast!.show('아직 잠겨있는 지역이에요', '🔒', 'locked-region', 2000)
      }
    }

    // Jump
    if (controller!.input.jump && isOnGround) {
      verticalVelocity = isDashing ? JUMP_FORCE_DASH : JUMP_FORCE
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
    controlsHUD?.update(controller!.input)
    thirdPersonCamera.update(character.getPosition(), idleTime >= 5, isDashing)
    dashTrailFX!.update(delta, isDashing && isOnGround, charPos.x, charPos.y, charPos.z, vel.x, vel.z)

    chunkManager!.update(charPos.x, charPos.z)
    chunkManager!.processSwaps(1)

    // 지역이 바뀌면 HUD 갱신
    const curRegionId = regionForChunk(Math.floor(charPos.x / CHUNK_SIZE), Math.floor(charPos.z / CHUNK_SIZE))
    if (curRegionId !== lastRegionId) {
      lastRegionId = curRegionId
      const info = getRegionInfo(curRegionId)
      hud!.update(
        progressSystem.getTotalCollected(),
        progressSystem.getNextLevelThreshold(),
        info.name,
        info.emoji,
        info.specialty?.emoji
      )
    }

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
    if (tutorialTimerId !== null) clearTimeout(tutorialTimerId)
    if (hud) hud.dispose()
    if (controlsHUD) controlsHUD.dispose()
    if (toast) toast.dispose()
    if (virtualJoystick) virtualJoystick.dispose()
    if (mobileButtons) mobileButtons.dispose()
    if (landingScreen) landingScreen.dispose()
    if (helpButton) helpButton.dispose()
    if (tutorialModal) tutorialModal.dispose()
    // touchInputSource.dispose()는 소유권을 UI에 넘기지 않았으므로 위 두 개가 실질 정리
    if (collectFX) collectFX.dispose()
    if (heartFX) heartFX.dispose()
    if (dashTrailFX) dashTrailFX.dispose()
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
    tutorialTimerId = null
    hud = null
    controlsHUD = null
    toast = null
    virtualJoystick = null
    mobileButtons = null
    touchInputSource = null
    landingScreen = null
    helpButton = null
    tutorialModal = null
    collectFX = null
    heartFX = null
    dashTrailFX = null
    _onResize = null
    verticalVelocity = 0
    isOnGround = true
  })
}
