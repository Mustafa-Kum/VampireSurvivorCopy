import re
import os
from typing import Dict, List

class CodeModularizer:
    def __init__(self, source_file: str):
        self.source_file = source_file
        self.content = ""
        self.modules: Dict[str, List[str]] = {}
        self.incomplete_methods: List[str] = []
        
    def load_file(self):
        with open(self.source_file, 'r', encoding='utf-8') as f:
            self.content = f.read()
    
    def extract_script_content(self) -> str:
        script_pattern = r'<script>(.*?)</script>'
        scripts = re.findall(script_pattern, self.content, re.DOTALL)
        return scripts[0] if scripts else ""

    def extract_elements(self) -> Dict[str, str]:
        script_content = self.extract_script_content()
        temp_content = script_content  # Create a temporary copy
        elements = {}
        
        # Regex to match function definitions
        function_pattern = re.compile(r'function\s+(\w+)\s*\((.*?)\)\s*\{', re.DOTALL)
        
        # Find all function matches
        matches = list(function_pattern.finditer(script_content))
        
        for match in matches:
            func_name = match.group(1)
            start_pos = match.start()
            end_pos = match.end()
            brace_count = 1
            current_pos = end_pos
            
            # Traverse the script content to find the matching closing brace
            while brace_count > 0 and current_pos < len(script_content):
                if script_content[current_pos] == '{':
                    brace_count += 1
                elif script_content[current_pos] == '}':
                    brace_count -= 1
                current_pos += 1
            
            # Extract the full function content
            func_content = script_content[start_pos:current_pos]
            elements[func_name] = func_content
            print(f"Extracted function: {func_name}")
            
            # Remove the extracted function from the temporary content
            temp_content = temp_content.replace(func_content, '')

        # Capture remaining content as constants or global variables
        remaining_content = temp_content.strip()
        if remaining_content:
            elements['global'] = remaining_content
            print(f"Captured remaining content for Constants.js")

        return elements

    def categorize_elements(self, elements: Dict[str, str]):
        module_patterns = {
            # 1. CORE MODULES
            'core/Game.js': [
                r'^assetLoaded$', r'^gameOver$', r'^handleTouchStart$', r'^initEventListeners$',
                r'^initPokiSDK$', r'^initTouchControls$', r'^loadAssetWithTimeout$', r'^loadAssets$',
                r'^loadGameAssets$', r'^restartGame$', r'^simulateLoading$', r'^startGame$', r'^updateGame$'
            ],
            'core/Constants.js': [
                r'^global$'
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
                r'^resizeCanvas$', r'^showSelectedSkill$', r'^showJackpotScreen$'
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
        
        for element_name, element_content in elements.items():
            categorized = False
            for module_path, patterns in module_patterns.items():
                if any(re.fullmatch(pattern, element_name) for pattern in patterns):
                    if module_path not in self.modules:
                        self.modules[module_path] = []
                    self.modules[module_path].append(element_content)
                    categorized = True
                    print(f"Categorized {element_name} into {module_path}")
                    break
            
            if not categorized:
                if 'utils/Misc.js' not in self.modules:
                    self.modules['utils/Misc.js'] = []
                self.modules['utils/Misc.js'].append(element_content)
                print(f"Categorized {element_name} into utils/Misc.js")

    def create_files(self):
        for module_path, elements in self.modules.items():
            directory = os.path.dirname(module_path)
            if not os.path.exists(directory):
                os.makedirs(directory)
            with open(module_path, 'w', encoding='utf-8') as f:
                for element in elements:
                    f.write(element + "\n\n")
            print(f"Created file: {module_path} with {len(elements)} elements")

    def process(self):
        try:
            print("Loading source file...")
            self.load_file()
            
            print("Extracting elements...")
            elements = self.extract_elements()
            print(f"Found {len(elements)} elements")
            
            print("Categorizing elements...")
            self.categorize_elements(elements)
            
            print("Creating files...")
            self.create_files()
            print("\nFiles created based on categorization.")
            
            if self.incomplete_methods:
                print("\nIncomplete methods detected:")
                for method in self.incomplete_methods:
                    print(f" - {method}")
            
        except Exception as e:
            print(f"Error during modularization: {str(e)}")
            raise e

if __name__ == "__main__":
    modularizer = CodeModularizer("index.html")
    modularizer.process() 