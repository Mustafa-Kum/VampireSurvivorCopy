import re
import os
from typing import Dict, List, Set
from pprint import pprint

class CodeModularizerPreview:
    def __init__(self, source_file: str):
        self.source_file = source_file
        self.content = ""
        self.modules: Dict[str, List[str]] = {}
        
    def load_file(self):
        with open(self.source_file, 'r', encoding='utf-8') as f:
            self.content = f.read()
    
    def extract_script_content(self) -> str:
        script_pattern = r'<script>(.*?)</script>'
        scripts = re.findall(script_pattern, self.content, re.DOTALL)
        return scripts[0] if scripts else ""

    def extract_functions(self) -> Dict[str, str]:
        script_content = self.extract_script_content()
        functions = {}
        
        potential_functions = script_content.split("function ")
        
        for func in potential_functions[1:]:
            try:
                name_end = func.index("(")
                func_name = func[:name_end].strip()
                
                brace_count = 0
                body_start = func.index("{")
                current_pos = body_start
                
                for i, char in enumerate(func[body_start:], body_start):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            current_pos = i + 1
                            break
                
                func_content = "function " + func[:current_pos]
                functions[func_name] = func_content
                
            except (ValueError, IndexError):
                continue
                
        return functions

    def categorize_functions(self, functions: Dict[str, str]):
        module_patterns = {
            # 1. CORE MODULES
            'core/Game.js': [
                r'^assetLoaded$', r'^gameOver$', r'^handleTouchStart$', r'^initEventListeners$',
                r'^initPokiSDK$', r'^initTouchControls$', r'^loadAssetWithTimeout$', r'^loadAssets$',
                r'^loadGameAssets$', r'^restartGame$', r'^simulateLoading$', r'^startGame$', r'^updateGame$'
            ],
            'core/AudioManager.js': [
                r'^enableAudio$', r'^playChainLightningSound$', r'^playFireballSound$',
                r'^playFrostboltSound$', r'^playMedalSound$', r'^playMusic$',
                r'^playSelectSound$', r'^playSlotSound$', r'^playSound$'
            ],

            # 2. GAME ENTITIES
            'entities/Player.js': [
                r'^drawPlayer$', r'^getPlayerMaxHealth$', r'^handlePlayerHit$',
                r'^resurrectPlayer$', r'^shoot$', r'^updatePlayerPosition$'
            ],
            'entities/Enemy.js': [
                r'^createBossEnrageEffect$', r'^drawBoss$', r'^findNearestEnemy$',
                r'^findNearestEnemyInRange$', r'^handleEnemyHit$', r'^spawnBoss$',
                r'^spawnBossCheat$', r'^spawnDoor$', r'^spawnEnemies$', r'^splitEnemy$', r'^updateBoss$'
            ],

            # 3. SYSTEMS
            'systems/CombatSystem.js': [
                r'^checkChestCollision$', r'^checkDoorCollision$', r'^createDamageEffect$',
                r'^handleCollisions$', r'^castChainLightning$', r'^castFireball$', r'^castFrostbolt$'
            ],
            'systems/ParticleSystem.js': [
                r'^createDeathParticles$', r'^createMedalParticles$', r'^createParticle$',
                r'^drawBulletParticles$', r'^drawEnergyParticles$', r'^drawParticles$',
                r'^drawSparkParticles$', r'^updateAllParticles$', r'^updateBulletParticles$',
                r'^updateParticleArray$', r'^updateParticles$', r'^updateSparkParticles$'
            ],
            'systems/UpgradeSystem.js': [
                r'^applyPickupUpgrades$', r'^applyUpgrade$', r'^checkMedals$', r'^earnMedal$',
                r'^hideUpgradeScreen$', r'^showUpgradeScreen$', r'^updateLevelProgress$', r'^updateUpgradesList$'
            ],

            # 4. UI COMPONENTS
            'ui/Renderer.js': [
                r'^drawBloodDrops$', r'^drawBooks$', r'^drawBullets$', r'^drawChest$',
                r'^drawCoreLayers$', r'^drawDoor$', r'^drawEnemies$', r'^drawFireballs$',
                r'^drawFrostbolts$', r'^drawGlowEffect$', r'^drawGround$', r'^drawLightnings$',
                r'^drawObjects$', r'^drawPickups$', r'^drawPlasmaRings$', r'^drawSpiralArms$',
                r'^resizeCanvas$'
            ],

            # 5. CONTROLLERS
            'controllers/InputController.js': [
                r'^createWaveKey$', r'^handleMobileLayout$', r'^handleTouchEnd$',
                r'^handleTouchMove$', r'^isTouchDevice$'
            ],

            # 6. UTILITIES
            'utils/MathUtils.js': [
                r'^calculateScoreRequirement$', r'^generateRandomColor$', r'^getRandomBrightColor$',
                r'^hslToHex$', r'^hslToRgb$', r'^interpolateColor$', r'^lerpRotation$',
                r'^parseHSL$', r'^rgbToString$'
            ],
            'utils/EffectUtils.js': [
                r'^createExplosionEffect$', r'^createFrostExplosionEffect$', r'^createLightningEffect$',
                r'^createPortalEffect$', r'^createSparkleEffect$', r'^createSparkles$', r'^createTeleportEffect$',
                r'^createVictoryPattern$', r'^generateLightningPoints$', r'^getLighterColor$'
            ],
            'utils/PowerupUtils.js': [
                r'^applyTemporaryPowerup$', r'^applyTripleFireballPower$', r'^applyTripleFrostboltPower$',
                r'^multiFireball$', r'^multiFrostbolt$', r'^resetCheats$'
            ],
            'utils/DisplayUtils.js': [
                r'^clearCanvas$', r'^handleError$', r'^hideSettings$', r'^showError$',
                r'^showFloatingText$', r'^showJackpotScreen$', r'^showSelectedSkill$', r'^showSettings$',
                r'^showToast$', r'^showWaveInfo$', r'^showWaveTransition$', r'^stopMovement$',
                r'^updateBloodDrops$', r'^updateBooks$', r'^updateBullets$', r'^updateEnemies$',
                r'^updateFPS$', r'^updateFireballs$', r'^updateFrostbolts$', r'^updateLightnings$',
                r'^updateMouseDirection$', r'^updateObjects$', r'^updatePickups$', r'^updateTime$',
                r'^updateVolume$'
            ]
        }
        
        for func_name, func_content in functions.items():
            categorized = False
            for module_path, patterns in module_patterns.items():
                if any(re.fullmatch(pattern, func_name) for pattern in patterns):
                    if module_path not in self.modules:
                        self.modules[module_path] = []
                    self.modules[module_path].append(func_name)
                    categorized = True
                    break
            
            if not categorized:
                if 'utils/Misc.js' not in self.modules:
                    self.modules['utils/Misc.js'] = []
                self.modules['utils/Misc.js'].append(func_name)

    def create_preview(self):
        preview = "MODULARIZATION PREVIEW\n"
        preview += "=====================\n\n"
        
        total_functions = sum(len(funcs) for funcs in self.modules.values())
        preview += f"Total functions found: {total_functions}\n\n"
        
        for module_path, function_names in sorted(self.modules.items()):
            preview += f"{module_path}:\n"
            preview += "-" * (len(module_path) + 1) + "\n"
            for func_name in sorted(function_names):
                preview += f"  - {func_name}\n"
            preview += f"  Total: {len(function_names)} functions\n\n"
        
        with open('modularization_preview.txt', 'w', encoding='utf-8') as f:
            f.write(preview)
        
        return preview

    def process(self):
        try:
            print("Loading source file...")
            self.load_file()
            
            print("Extracting functions...")
            functions = self.extract_functions()
            print(f"Found {len(functions)} functions")
            
            print("Categorizing functions...")
            self.categorize_functions(functions)
            
            print("Creating preview...")
            preview = self.create_preview()
            print("\nPreview created in 'modularization_preview.txt'")
            print("\nPreview of categorization:")
            print(preview)
            
        except Exception as e:
            print(f"Error during preview creation: {str(e)}")
            raise e

if __name__ == "__main__":
    modularizer = CodeModularizerPreview("index.html")
    modularizer.process() 