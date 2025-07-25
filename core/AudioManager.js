const AudioSystem = {
    context: null,
    initialized: false,
    sfxGainNode: null,
    musicGainNode: null,

    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            this.sfxGainNode = this.context.createGain();
            this.sfxGainNode.connect(this.context.destination);
            
            this.musicGainNode = this.context.createGain();
            this.musicGainNode.connect(this.context.destination);

            this.musicGainNode.gain.value = 0.015;

            this.initialized = true;
            console.log('AudioSystem initialized.');
        } catch (error) {
            console.error('AudioSystem initialization failed:', error);
        }
    },

    // AudioSystem içinde loadBackgroundMusic fonksiyonunu güncelleyelim
    loadBackgroundMusic() {
        if (!this.context) this.init();

        return fetch(assets.audio.backgroundMusic)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
            .then(decodedData => {
                this.musicBuffer = decodedData;
                console.log('Background music loaded successfully.');
            })
            .catch(error => {
                console.error('Error loading background music:', error);
                throw error;
            });
    },
    
    bulletFire() {
        if (!this.context) this.init();
        const ctx = this.context;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(now);
        osc.stop(now + 0.05);
    },
    
    pickup() {
        if (!this.context) this.init();
        const ctx = this.context;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(now);
        osc.stop(now + 0.08);
    },
    
    levelUp() {
        if (!this.context) this.init();
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const notes = [698.46, 880.0, 1046.5];
        const duration = 0.08;

        notes.forEach((freq, index) => {
            const startTime = now + index * duration;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc.connect(gain);
            gain.connect(this.sfxGainNode);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    },
    
    death() {
        if (!this.context) this.init();
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.type = 'square';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc1.connect(gain1);
        gain1.connect(this.sfxGainNode);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc2.connect(gain2);
        gain2.connect(this.sfxGainNode);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.2);
        
        const noise = this.createNoise(0.3);
        noise.connect(this.sfxGainNode);
    },
    
    enemyDeath() {
        if (!this.context) this.init();
        const ctx = this.context;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(now);
        osc.stop(now + 0.05);
    },

    playBackgroundMusic() {
        if (!this.musicBuffer) {
            console.error('Background music buffer yüklenmemiş.');
            return;
        }
        
        if (this.musicSource) {
            this.musicSource.stop();
        }
        
        this.musicSource = this.context.createBufferSource();
        this.musicSource.buffer = this.musicBuffer;
        this.musicSource.loop = true; // Müzik döngüsel çalsın
        
        if (!this.musicGainNode) {
            console.error('musicGainNode tanımlı değil.');
            return;
        }

        try {
            this.musicSource.connect(this.musicGainNode);
        } catch (error) {
            console.error('Müzik kaynağını musicGainNode\'a bağlarken hata:', error);
            return;
        }

        this.musicSource.start(0);
        console.log('Background music çalıyor.');
    },
    
    setMusicVolume(volume) {
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = volume;
        }
    },
    
    createNoise(duration) {
        const ctx = this.context;
        const now = ctx.currentTime;

        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        return gain;
    }
};

function playSound(soundName, volume = 1, pitchVariation = 0) {
    if (!AudioSystem.context) return;
    
    switch(soundName) {
        case 'bulletFire':
            AudioSystem.bulletFire();
            break;
        case 'death':
            AudioSystem.death();
            break;
        case 'enemyDeath':
            AudioSystem.enemyDeath();
            break;
        case 'pickup':
            AudioSystem.pickup();
            break;
        case 'medalEarned':
            playMedalSound();
            break;
        case 'enemySpawn':
            createEnemySpawnSound();
            break;
    }
}

function playFireballSound() {
    // Bu fonksiyon ayrıca kendi AudioContext'ini açıyor, mantığı korumak için dokunmuyoruz.
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Hellfire whoosh base
    const whooshOsc = audioContext.createOscillator();
    whooshOsc.type = 'triangle';
    whooshOsc.frequency.setValueAtTime(180, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

    // Ethereal overlay
    const etherealOsc = audioContext.createOscillator();
    etherealOsc.type = 'sine';
    etherealOsc.frequency.setValueAtTime(440, now);
    etherealOsc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

    // Volume envelopes - reduced gains
    const whooshGain = audioContext.createGain();
    whooshGain.gain.setValueAtTime(0, now);
    whooshGain.gain.linearRampToValueAtTime(0.15, now + 0.1); 
    whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    const etherealGain = audioContext.createGain();
    etherealGain.gain.setValueAtTime(0, now);
    etherealGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    etherealGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    // Master gain reduced
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.35; // Reduced from 0.5

    // Low-pass filter
    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 1800;
    lowPassFilter.Q.value = 0.8;

    // Connections
    whooshOsc.connect(whooshGain);
    etherealOsc.connect(etherealGain);
    whooshGain.connect(lowPassFilter);
    etherealGain.connect(lowPassFilter);
    lowPassFilter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    whooshOsc.start(now);
    etherealOsc.start(now + 0.05);

    whooshOsc.stop(now + 0.6);
    etherealOsc.stop(now + 0.4);
}

function playChainLightningSound() {
    const context = AudioSystem.context;
    if (!context) return;
    const now = context.currentTime;

    // YILDIRIM SESİ
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    const filter1 = context.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(8000, now + 0.015);
    osc1.frequency.exponentialRampToValueAtTime(2000, now + 0.06);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(3000, now);
    filter1.Q.value = 1.0;

    gain1.gain.setValueAtTime(0.02, now);
    gain1.gain.linearRampToValueAtTime(0.04, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.06);

    // HAFİF ÇATIRTI
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4000, now);
    osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.06);

    gain2.gain.setValueAtTime(0.01, now);
    gain2.gain.linearRampToValueAtTime(0.02, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.06);

    osc1.connect(filter1);
    filter1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(context.destination);
    gain2.connect(context.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.06);
    osc2.stop(now + 0.06);
}

function playMedalSound() {
    const audioContext = AudioSystem.context;
    if (!audioContext) return;

    // Create oscillator for medal sound
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Medal sound settings
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1); // A4 note
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
}

function playSelectSound() {
    if (!AudioSystem.context) AudioSystem.init();
    const ctx = AudioSystem.context;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
}

function playFrostboltSound() {
    // Bu fonksiyon ayrıca kendi AudioContext'ini açıyor, mantığı korumak için dokunmuyoruz.
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Magic crystal chime
    const chimeOsc = audioContext.createOscillator();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(880, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

    // Sparkle effect
    const sparkleOsc = audioContext.createOscillator();
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(1200, now);
    sparkleOsc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    // Magic aura bass
    const auraOsc = audioContext.createOscillator();
    auraOsc.type = 'triangle';
    auraOsc.frequency.setValueAtTime(200, now);
    auraOsc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    // Volume envelopes
    const chimeGain = audioContext.createGain();
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    const sparkleGain = audioContext.createGain();
    sparkleGain.gain.setValueAtTime(0, now);
    sparkleGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    const auraGain = audioContext.createGain();
    auraGain.gain.setValueAtTime(0, now);
    auraGain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    auraGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Master gain
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3;

    // High-pass filter
    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 800;
    highPassFilter.Q.value = 0.7;

    // Connections
    chimeOsc.connect(chimeGain);
    sparkleOsc.connect(sparkleGain);
    auraOsc.connect(auraGain);

    chimeGain.connect(highPassFilter);
    sparkleGain.connect(highPassFilter);
    auraGain.connect(masterGain);
    highPassFilter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    auraOsc.start(now);
    chimeOsc.start(now + 0.02);
    sparkleOsc.start(now + 0.04);

    auraOsc.stop(now + 0.5);
    chimeOsc.stop(now + 0.4);
    sparkleOsc.stop(now + 0.3);
}

function playSlotSound() {
    const context = AudioSystem.context;
    if (!context) return;

    const now = context.currentTime;
    const duration = 3;

    // Bu döngü 3 saniyelik slot efekti oluşturmak için her 0.1s'te bir küçük "bip" sesleri yaratıyor.
    // CPU kullanımını çok az da olsa düşürmek için, currentTime'ı her adımda tekrar almak yerine,
    // local değişken (now) kullanıyoruz.
    for (let i = 0; i < duration * 10; i++) {
        const start = now + i * 0.1;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440 + Math.random() * 220, start);

        gainNode.gain.setValueAtTime(0.03, start);
        gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(start);
        oscillator.stop(start + 0.05);
    }
}

function playMusic(musicName, volume = 1) {
    switch (musicName) {
        case 'bgMusic':
            AudioSystem.playBackgroundMusic();
            break;
    }
    return Promise.resolve();
}

function enableAudio() {
    AudioSystem.init();
    document.removeEventListener('touchstart', enableAudio);
    document.removeEventListener('click', enableAudio);
}

function playStarEarnedSound() {
    if (!AudioSystem.context) AudioSystem.init();
    const ctx = AudioSystem.context;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Ana ses
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(AudioSystem.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.3);

    // Parıltı sesi
    setTimeout(() => {
        const sparkleOsc = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        const sparkleNow = ctx.currentTime;
        sparkleOsc.type = 'sine';
        sparkleOsc.frequency.setValueAtTime(2000, sparkleNow);
        sparkleOsc.frequency.exponentialRampToValueAtTime(4000, sparkleNow + 0.1);

        sparkleGain.gain.setValueAtTime(0.1, sparkleNow);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, sparkleNow + 0.2);

        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(AudioSystem.sfxGainNode);

        sparkleOsc.start(sparkleNow);
        sparkleOsc.stop(sparkleNow + 0.2);
    }, 100);
}

function playCoinSound() {
    if (!AudioSystem.context) return;
    
    const oscillator = AudioSystem.context.createOscillator();
    const gainNode = AudioSystem.context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, AudioSystem.context.currentTime); // Higher pitch for coin
    oscillator.frequency.exponentialRampToValueAtTime(1760, AudioSystem.context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, AudioSystem.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, AudioSystem.context.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(AudioSystem.context.destination);
    
    oscillator.start();
    oscillator.stop(AudioSystem.context.currentTime + 0.1);
}

function createEnemySpawnSound() {
    const audioContext = AudioSystem.context;
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Create a deep, ominous sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
}
