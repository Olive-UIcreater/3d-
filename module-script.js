const { ipcRenderer } = require('electron');

class AudioModule {
    constructor() {
        this.isPlaying = false;
        this.moduleIndex = 0;
        this.oscillator = null;
        this.distortion = null;
        this.reverb = null;
        this.lowPassFilter = null;
        this.highPassFilter = null;
        this.pitchShift = null;
        
        this.initAudio();
        this.initUI();
        this.initVisualEffects();
        this.initBackgroundCustomization();
    }

    async initAudio() {
        // 等待 Tone.js 載入完成
        await Tone.start();
        
        // 創建音訊效果鏈
        this.oscillator = new Tone.Oscillator(440, "sine").start();
        this.distortion = new Tone.Distortion(0);
        this.reverb = new Tone.Reverb(0);
        this.lowPassFilter = new Tone.Filter(20000, "lowpass");
        this.highPassFilter = new Tone.Filter(20, "highpass");
        this.pitchShift = new Tone.PitchShift(0);
        
        // 連接音訊效果鏈
        this.oscillator
            .connect(this.pitchShift)
            .connect(this.distortion)
            .connect(this.lowPassFilter)
            .connect(this.highPassFilter)
            .connect(this.reverb)
            .toDestination();
        
        // 初始時停止振盪器
        this.oscillator.stop();
    }

    initUI() {
        // 獲取模組索引
        ipcRenderer.invoke('get-module-index').then(index => {
            this.moduleIndex = index;
            document.getElementById('moduleTitle').textContent = `音訊模組 ${index + 1}`;
        });

        // 播放/停止按鈕
        const playStopBtn = document.getElementById('playStopBtn');
        playStopBtn.addEventListener('click', () => {
            this.togglePlayback();
        });

        // 音訊控制滑桿
        this.setupSlider('pitchSlider', 'pitchValue', (value) => {
            this.pitchShift.pitch = (value - 1) * 12; // 轉換為半音
        });

        this.setupSlider('distortionSlider', 'distortionValue', (value) => {
            this.distortion.distortion = value;
        });

        this.setupSlider('reverbSlider', 'reverbValue', (value) => {
            this.reverb.wet.value = value;
            this.reverb.decay = value * 3 + 0.1; // 0.1 到 3.1 秒
        });

        this.setupSlider('lowPassSlider', 'lowPassValue', (value) => {
            const frequency = 20 + (value * 19980); // 20Hz 到 20kHz
            this.lowPassFilter.frequency.value = frequency;
        });

        this.setupSlider('highPassSlider', 'highPassValue', (value) => {
            const frequency = 20 + (value * 19980); // 20Hz 到 20kHz
            this.highPassFilter.frequency.value = frequency;
        });
    }

    setupSlider(sliderId, valueId, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            valueDisplay.textContent = value.toFixed(1);
            callback(value);
        });
    }

    togglePlayback() {
        const playStopBtn = document.getElementById('playStopBtn');
        
        if (this.isPlaying) {
            this.oscillator.stop();
            playStopBtn.textContent = '播放';
            playStopBtn.classList.remove('playing');
            this.isPlaying = false;
        } else {
            this.oscillator.start();
            playStopBtn.textContent = '停止';
            playStopBtn.classList.add('playing');
            this.isPlaying = true;
        }
    }

    initVisualEffects() {
        const pitchSlider = document.getElementById('pitchSlider');
        const reverbSlider = document.getElementById('reverbSlider');
        
        // 音高與線條粗細連動
        pitchSlider.addEventListener('input', (e) => {
            const pitchValue = parseFloat(e.target.value);
            const lineThickness = 2 + (pitchValue * 8); // 2px 到 10px
            
            document.getElementById('lineHorizontal').style.height = `${lineThickness}px`;
            document.getElementById('lineVertical').style.width = `${lineThickness}px`;
            document.getElementById('lineDiagonal').style.height = `${lineThickness}px`;
        });

        // 迴響與背景模糊連動
        reverbSlider.addEventListener('input', (e) => {
            const reverbValue = parseFloat(e.target.value);
            const blurAmount = reverbValue * 10; // 0px 到 10px
            
            document.getElementById('backgroundOverlay').style.filter = `blur(${blurAmount}px)`;
        });
    }

    initBackgroundCustomization() {
        const colorPicker = document.getElementById('colorPicker');
        const fileUpload = document.getElementById('fileUpload');
        const backgroundOverlay = document.getElementById('backgroundOverlay');

        // 調色盤功能
        colorPicker.addEventListener('change', (e) => {
            const color = e.target.value;
            document.body.style.background = `linear-gradient(135deg, ${color} 0%, #764ba2 100%)`;
        });

        // 圖片上傳功能
        fileUpload.addEventListener('click', async () => {
            try {
                const result = await ipcRenderer.invoke('open-file-dialog');
                if (!result.canceled && result.filePaths.length > 0) {
                    const imagePath = result.filePaths[0];
                    backgroundOverlay.style.backgroundImage = `url(file://${imagePath})`;
                    backgroundOverlay.style.opacity = '0.6';
                }
            } catch (error) {
                console.error('Error opening file dialog:', error);
            }
        });

        // 拖放功能
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            fileUpload.style.background = 'rgba(255, 255, 255, 0.2)';
        });

        fileUpload.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileUpload.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            fileUpload.style.background = 'rgba(255, 255, 255, 0.1)';
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            fileUpload.style.background = 'rgba(255, 255, 255, 0.1)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        backgroundOverlay.style.backgroundImage = `url(${event.target.result})`;
                        backgroundOverlay.style.opacity = '0.6';
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }

    // 切換波形類型
    changeWaveform(type) {
        if (this.oscillator) {
            this.oscillator.type = type;
        }
    }

    // 設置頻率
    setFrequency(freq) {
        if (this.oscillator) {
            this.oscillator.frequency.value = freq;
        }
    }

    // 清理資源
    destroy() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.dispose();
        }
        if (this.distortion) this.distortion.dispose();
        if (this.reverb) this.reverb.dispose();
        if (this.lowPassFilter) this.lowPassFilter.dispose();
        if (this.highPassFilter) this.highPassFilter.dispose();
        if (this.pitchShift) this.pitchShift.dispose();
    }
}

// 當頁面載入完成時初始化音訊模組
document.addEventListener('DOMContentLoaded', () => {
    window.audioModule = new AudioModule();
});

// 當視窗關閉時清理資源
window.addEventListener('beforeunload', () => {
    if (window.audioModule) {
        window.audioModule.destroy();
    }
});
