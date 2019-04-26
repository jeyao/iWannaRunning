/*******************************************************************************
- Copyright (C) , 2019, Yaoyuchen
- File name : index.js
- Author : Yaoyuchen    Version: 1.0    Date: 2019年4月21日 星期日
- Description :恐龙避障小游戏
- Model List :
	1.Horizon ：背景
  
- 修改自：@liuwayong
- History :
     <author>      <time>      <version>      <desc>    
	 yaoyuchen	   19/4/21        1.0		  创建此文档

*******************************************************************************/
(function () {
    'use strict';
    /**
	*******************************************************************************
	- Function    : Runner
	- Description : 游戏-构造函数
	- Input   
		1.outerContainerId  ：x和y
		2.opt_config        ：长宽
	- Parameter
		1.playing          ：标志-游戏是否进行
		2.soundFx          ：存储音频数据（可以直接播放）
	*******************************************************************************
	**/
	
	
    function Runner(outerContainerId, opt_config) {
        // Singleton
        if (Runner.instance_) {
            return Runner.instance_;
        }
        Runner.instance_ = this;

        this.outerContainerEl = document.querySelector(outerContainerId);
        this.containerEl = null;
        this.snackbarEl = null;
		//
        this.detailsButton = this.outerContainerEl.querySelector('#details-button');

        this.config = opt_config || Runner.config;

        this.dimensions = Runner.defaultDimensions;

        this.canvas = null;
        this.canvasCtx = null;

        this.tRex = null;

        this.distanceMeter = null;
        this.distanceRan = 0;

        this.highestScore = 0;

        this.time = 0;
        this.runningTime = 0;
        this.msPerFrame = 1000 / FPS;
        this.currentSpeed = this.config.SPEED;

        this.obstacles = [];

        this.activated = false; // Whether the easter egg has been activated.
        this.playing = false; // Whether the game is currently in play state.
        this.crashed = false;
        this.paused = false;
        this.inverted = false;
        this.invertTimer = 0;
        this.resizeTimerId_ = null;

        this.playCount = 0;

        // Sound FX.
        this.audioBuffer = null;
        this.soundFx = {};

        // Global web audio context for playing sounds.
        this.audioContext = null;

        // Images.
        this.images = {};
        this.imagesLoaded = 0;

        
        this.loadImages();
    }
    window['Runner'] = Runner;


    /**
	*******************************************************************************
	- Description : 游戏-基本属性
	- Parameter
		1.DEFAULT_WIDTH     ： 默认的宽度
		2.FPS               ： 帧率
		3.IS_HIDPI          ： HIDPI模式（devicePixelRatio=物理像素 / dips）
		4.IS_IOS/IS_MOBILE  ： 判断是否为移动系统
		5.IS_TOUCH_ENABLED  ： 是否触摸屏幕
	*******************************************************************************
	**/
	
    var DEFAULT_WIDTH = 600;

    var FPS = 60;

    var IS_HIDPI = window.devicePixelRatio > 1;

    var IS_IOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

    var IS_MOBILE = /Android/.test(window.navigator.userAgent) || IS_IOS;

    var IS_TOUCH_ENABLED = 'ontouchstart' in window;
	

    /**
	*******************************************************************************
	- Function    : Runner.config
	- Description : 游戏-配置常数
	- Input   
		1.outerContainerId  ：x和y
		2.opt_config        ：长宽
	- Parameter
		1.
	*******************************************************************************
	**/
	
    Runner.config = {
        ACCELERATION: 0.001,
        BG_CLOUD_SPEED: 0.2,
        BOTTOM_PAD: 10,
        CLEAR_TIME: 3000,
        CLOUD_FREQUENCY: 0.5,
        GAMEOVER_CLEAR_TIME: 750,
        GAP_COEFFICIENT: 0.6,
        GRAVITY: 0.6,
        INITIAL_JUMP_VELOCITY: 12,
        INVERT_FADE_DURATION: 12000,
        INVERT_DISTANCE: 700,
        MAX_BLINK_COUNT: 3,
        MAX_CLOUDS: 6,
        MAX_OBSTACLE_LENGTH: 3,
        MAX_OBSTACLE_DUPLICATION: 2,
        MAX_SPEED: 13,
        MIN_JUMP_HEIGHT: 35,
        MOBILE_SPEED_COEFFICIENT: 1.2,
        RESOURCE_TEMPLATE_ID: 'audio-resources',
        SPEED: 6,
        SPEED_DROP_COEFFICIENT: 3
    };


    /**
	*******************************************************************************
	- Function    : Runner.defaultDimensions
	- Description : 游戏-维度
	- Input   
		1.outerContainerId  ：x和y
		2.opt_config        ：长宽
	- Parameter
		1.
	*******************************************************************************
	**/
    Runner.defaultDimensions = {
        WIDTH: DEFAULT_WIDTH,
        HEIGHT: 150
    };


    /**
	*******************************************************************************
	- Function    : Runner.defaultDimensions
	- Description : 游戏-css类名
	- Input   
		1.outerContainerId  ：x和y
		2.opt_config        ：长宽
	- Parameter
		1.
	*******************************************************************************
	**/
    Runner.classes = {
        CANVAS: 'runner-canvas',
        CONTAINER: 'runner-container',
        CRASHED: 'crashed',
        ICON: 'icon-offline',
        INVERTED: 'inverted',
        SNACKBAR: 'snackbar',
        SNACKBAR_SHOW: 'snackbar-show',
        TOUCH_CONTROLLER: 'controller'
    };


    /**
	*******************************************************************************
	- Function    : Runner.spriteDefinition
	- Description : sprite图中的x和y
	- Input   
		1.outerContainerId  ：x和y
		2.opt_config        ：长宽
	- Parameter
		1.
	*******************************************************************************
	**/
    Runner.spriteDefinition = {
        LDPI: {
            CACTUS_LARGE: { x: 332, y: 2 },
            CACTUS_SMALL: { x: 228, y: 2 },
            CLOUD: { x: 86, y: 2 },
            HORIZON: { x: 0, y: 55 },
            MOON: { x: 484, y: 2 },
            PTERODACTYL: { x: 134, y: 2 },
            RESTART: { x: 2, y: 2 },
            TEXT_SPRITE: { x: 655, y: 2 },
            TREX: { x: 848, y: 2 },
            STAR: { x: 645, y: 2 }
        },
        HDPI: {
            CACTUS_LARGE: { x: 652, y: 2 },
            CACTUS_SMALL: { x: 446, y: 2 },
            CLOUD: { x: 166, y: 2 },
            HORIZON: { x: 2, y: 104 },
            MOON: { x: 954, y: 2 },
            PTERODACTYL: { x: 260, y: 2 },
            RESTART: { x: 2, y: 2 },
            TEXT_SPRITE: { x: 1294, y: 2 },
            TREX: { x: 1678, y: 2 },
            STAR: { x: 1276, y: 2 }
        }
    };


    /*****************************************************************************
	- Function    : Runner.defaultDimensions
	- Description : 游戏所需音频
	- Parameter
		1.BUTTON_PRESS     ：跳跃音效
		2.HIT              ：触碰障碍音效
		3.SCORE            ：达到一定分数音效
	*****************************************************************************/
    Runner.sounds = {
        BUTTON_PRESS: 'offline-sound-press',
        HIT: 'offline-sound-hit',
        SCORE: 'offline-sound-reached'
    };


   /******************************************************************************
	- Function    : Runner.defaultDimensions
	- Description : 游戏所需键盘按键编码
	- keycodes
		1.38       ：上/Up
		2.32       ：空格/spacebar
		3.40       ：下/Down
		4.13       ：回车/Enter
	******************************************************************************/
    Runner.keycodes = {
        JUMP: { '38': 1, '32': 1 }, 
        DUCK: { '40': 1 },  
        RESTART: { '13': 1 } 
    };


     /*****************************************************************************
	- Function    : Runner.events
	- Description : 游戏事件名
	- Parameter
		1.ANIM_END  ：
		2.CLICK     ：点击
		3.KEYDOWN   ：键按下
		4.KEYUP     ：键松开
		5.MOUSEDOWN ：鼠标按下
		6.MOUSEUP   ：鼠标松开
		7.
	******************************************************************************/
    Runner.events = {
        ANIM_END: 'webkitAnimationEnd',
        CLICK: 'click',
        KEYDOWN: 'keydown',
        KEYUP: 'keyup',
        MOUSEDOWN: 'mousedown',
        MOUSEUP: 'mouseup',
        RESIZE: 'resize',
        TOUCHEND: 'touchend',
        TOUCHSTART: 'touchstart',
        VISIBILITY: 'visibilitychange',
        BLUR: 'blur',
        FOCUS: 'focus',
        LOAD: 'load'
    };
	
    /******************************************************************************
	- Function    : Runner.prototype
	- Description : 游戏-原型
	- SubFunction
		1.updateConfigSetting ：更新配置文件
		2.loadImages          ：将Sprite图加载至程序
		3.loadSounds   		  ：将音频数据加载至soundFx
		4.init                ：游戏初始化
	*****************************************************************************/

    Runner.prototype = {
        /*******************************************************************************
		* - Function    : updateConfigSetting（尚未使用）
		* - Description : 更新配置文件
		* - Input
		* 	1.setting              ：待配置的Key
		* 	2.value                ：待配置的Value
		* - Parameter   
		* 	1.config               ：游戏配置
		* 	2.tRex.config          ：恐龙配置
		* 	3.tRex.setJumpVelocity ：恐龙跳跃速度
		* 	4.setSpeed             ：游戏速度
		* - Content
		*	1.接收到要修改的配置名和数值，对游戏配置进行修改
		*******************************************************************************/
        updateConfigSetting: function (setting, value) {
            if (setting in this.config && value != undefined) {
                this.config[setting] = value;

                switch (setting) {
                    case 'GRAVITY':
                    case 'MIN_JUMP_HEIGHT':
                    case 'SPEED_DROP_COEFFICIENT':
                        this.tRex.config[setting] = value;
                        break;
                    case 'INITIAL_JUMP_VELOCITY':
                        this.tRex.setJumpVelocity(value);
                        break;
                    case 'SPEED':
                        this.setSpeed(value);
                        break;
                }
            }
        },

        /*******************************************************************************
		* - Function    : loadImages
		* - Description : 将Sprite图加载至程序
		* - Parameter   ：
		* 	1.Runner.imageSprite ：游戏所需的Sprite图
		* 	2.spriteDef          ：当前分辨率设置
		* - Content
		*	1.根据分辨率选取Sprite图
		*	2.如果图片加载完成，初始化游戏（init()）
		*	3.如果图片未加载完，添加loading时间
		*******************************************************************************/
        loadImages: function () {
            if (IS_HIDPI) {
                Runner.imageSprite = document.getElementById('offline-resources-2x');
                this.spriteDef = Runner.spriteDefinition.HDPI;
            } else {
                Runner.imageSprite = document.getElementById('offline-resources-1x');
                this.spriteDef = Runner.spriteDefinition.LDPI;
            }
			
			//是否完成图像加载
            if (Runner.imageSprite.complete) {
                this.init();
            } else {
                // If the images are not yet loaded, add a listener.
                Runner.imageSprite.addEventListener(Runner.events.LOAD,
                    this.init.bind(this));
            }
        },

        /*******************************************************************************
		* - Function    : loadSounds
		* - Description : 将音频数据加载至soundFx
		* - Parameter   ：
		* 	1.audioContext     ：处理音频的对象
		* 	2.soundFx          ：存储音频数据（可以直接播放）
		*******************************************************************************/
        loadSounds: function () {
            if (!IS_IOS) {
				//得到AudioContext实例对象
                this.audioContext = new AudioContext();
				//引用HTML文件中，ID为RESOURCE_TEMPLATE_ID（audio-resources）
				//对应音频文件（三个）
                var resourceTemplate =
                    document.getElementById(this.config.RESOURCE_TEMPLATE_ID).content;
				//提取三个音频对应的文件地址（逗号之后的内容）
				//
                for (var sound in Runner.sounds) {
                    var soundSrc =
                        resourceTemplate.getElementById(Runner.sounds[sound]).src;
					//截取逗号后的内容,并转换成二进制
                    soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
                    var buffer = decodeBase64ToArrayBuffer(soundSrc);

                    // soundFx异步绑定音频
                    this.audioContext.decodeAudioData(buffer, function (index, audioData) {
                        this.soundFx[index] = audioData;
                    }.bind(this, sound));
                }
            }
        },

		 /*******************************************************************************
		* - Function    : setSpeed
		* - Description : 设置游戏速度（一般用于初始化）
		* - Input       
		*	1.	opt_speed      ：
		* - Parameter   
		* 	1.currentSpeed     ：游戏当前速度（初始值：config.SPEED）
		* 	2.soundFx          ：存储音频数据（可以直接播放）
		* - Content
		*	1.获取速度（一般是config.SPEED）
		*	2.如果当前屏幕不符合默认维度，依照当前屏幕调节速度
		*	3.符合就不用其他操作
		*******************************************************************************/
		
        setSpeed: function (opt_speed) {
            var speed = opt_speed || this.currentSpeed;

            // Reduce the speed on smaller mobile screens.
            if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
                var mobileSpeed = speed * this.dimensions.WIDTH / DEFAULT_WIDTH *
                    this.config.MOBILE_SPEED_COEFFICIENT;
                this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
            } else if (opt_speed) {
                this.currentSpeed = opt_speed;
            }
        },

        /*******************************************************************************
		* - Function    : init
		* - Description : 游戏初始化
		* - Input       
		*	1.	opt_speed      ：
		* - Parameter   
		* 	1.currentSpeed     ：游戏当前速度（初始值：config.SPEED）
		* 	2.soundFx          ：存储音频数据（可以直接播放）
		* - Content
		*	1.调节屏幕长宽比，并设置速度
		*	2.
		*******************************************************************************/
		
        init: function () {
            // Hide the static icon.
            // document.querySelector('.' + Runner.classes.ICON).style.visibility = 'hidden';
			if (IS_MOBILE) {
				var box = document.getElementById("hint");
				box.style.visibility="hidden";
            }
            this.adjustDimensions();
            this.setSpeed();

            this.containerEl = document.createElement('div');
            this.containerEl.className = Runner.classes.CONTAINER;

            // Player canvas container.
            this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
                this.dimensions.HEIGHT, Runner.classes.PLAYER);

            this.canvasCtx = this.canvas.getContext('2d');
            this.canvasCtx.fillStyle = '#f7f7f7';
            this.canvasCtx.fill();
            Runner.updateCanvasScaling(this.canvas);

            // Horizon contains clouds, obstacles and the ground.
            this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions,
                this.config.GAP_COEFFICIENT);

            // Distance meter
            this.distanceMeter = new DistanceMeter(this.canvas,
                this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH);

            // Draw t-rex
            this.tRex = new Trex(this.canvas, this.spriteDef.TREX);

            this.outerContainerEl.appendChild(this.containerEl);
			
            if (IS_MOBILE) {
				var box = document.getElementById("begin_text");
				box.style.visibility="hidden";
                this.createTouchController();
            }

            this.startListening();
            this.update();

            window.addEventListener(Runner.events.RESIZE,
                this.debounceResize.bind(this));
        },

        /*******************************************************************************
		- Function    : createTouchController
		- Description : 添加TouchController布局
		- Parameter   ：
			1.touchController  ：触摸动作响应布局（全屏+固定+透明）
			2.outerContainerEl ：父布局
		*******************************************************************************/
        createTouchController: function () {
            this.touchController = document.createElement('div');
            this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
            this.outerContainerEl.appendChild(this.touchController);
        },

        /*******************************************************************************
		- Function    : debounceResize
		- Description : 窗口尺寸改变时调用
		- Parameter   
			1.resizeTimerId_       ：间隔ID，在adjustDimensions用clearInterval清除
		- Content
			1.如果之前没有改变尺寸，获取新的间隔ID（切换250毫秒）
		*******************************************************************************/
        debounceResize: function () {
            if (!this.resizeTimerId_) {
                this.resizeTimerId_ =
                    setInterval(this.adjustDimensions.bind(this), 250);
            }
        },

        /*******************************************************************************
		- Function    : adjustDimensions
		- Description : 调整维度（当屏幕宽度改变时）
		- Parameter   
			1.playing          ：标志-游戏是否进行
		- UsedFunction
			1.clearCanvas      ：清除画布
			2.stop             ：游戏暂停
		- Content
			1.清除间隔ID（如果有）
			2.重新计算画布尺寸，并更新恐龙和背景
			3.如果游戏正在进行中，暂停，按比例调节画面
			4.如果游戏已经结束，重新绘制
		*******************************************************************************/
        adjustDimensions: function () {
            clearInterval(this.resizeTimerId_);
            this.resizeTimerId_ = null;

            var boxStyles = window.getComputedStyle(this.outerContainerEl);
            var padding = Number(boxStyles.paddingLeft.substr(0,
                boxStyles.paddingLeft.length - 2));

            this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;

            // Redraw the elements back onto the canvas.
            if (this.canvas) {
                this.canvas.width = this.dimensions.WIDTH;
                this.canvas.height = this.dimensions.HEIGHT;

                Runner.updateCanvasScaling(this.canvas);

                this.distanceMeter.calcXPos(this.dimensions.WIDTH);
                this.clearCanvas();
                this.horizon.update(0, 0, true);
                this.tRex.update(0);

                // Outer container and distance meter.
                if (this.playing || this.crashed || this.paused) {
                    this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                    this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                    this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                    this.stop();
                } else {
                    this.tRex.draw(0, 0);
                }

                // Game over panel.
                if (this.crashed && this.gameOverPanel) {
                    this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
                    this.gameOverPanel.draw();
                }
            }
        },

        /**
         * Play the game intro.
         * Canvas container width expands out to the full width.
         */
		 
		 /*******************************************************************************
		- Function    : playIntro
		- Description : 
		- Parameter   
			1.playing          ：标志-游戏是否进行
		- Content
			1.
		*******************************************************************************/
        playIntro: function () {
            if (!this.activated && !this.crashed) {
                this.playingIntro = true;
                this.tRex.playingIntro = true;

                // CSS animation definition.
                var keyframes = '@-webkit-keyframes intro { ' +
                    'from { width:' + Trex.config.WIDTH + 'px }' +
                    'to { width: ' + this.dimensions.WIDTH + 'px }' +
                    '}';
                
                // create a style sheet to put the keyframe rule in 
                // and then place the style sheet in the html head    
                var sheet = document.createElement('style');
                sheet.innerHTML = keyframes;
                document.head.appendChild(sheet);

                this.containerEl.addEventListener(Runner.events.ANIM_END,
                    this.startGame.bind(this));

                this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
                this.containerEl.style.width = this.dimensions.WIDTH + 'px';

                // if (this.touchController) {
                //     this.outerContainerEl.appendChild(this.touchController);
                // }
                this.playing = true;
                this.activated = true;
            } else if (this.crashed) {
                this.restart();
            }
        },


         /*******************************************************************************
		- Function    : startGame
		- Description : 
		- Parameter   
			1.runningTime       ：
			2.playingIntro      ：标志-游戏是否进行
			3.tRex.playingIntro ：
			4.playCount         ：
			5.
		- Content
			1.
		*******************************************************************************/
        startGame: function () {
            this.runningTime = 0;
            this.playingIntro = false;
            this.tRex.playingIntro = false;
            this.containerEl.style.webkitAnimation = '';
            this.playCount++;

            // Handle tabbing off the page. Pause the current game.
            document.addEventListener(Runner.events.VISIBILITY,
                this.onVisibilityChange.bind(this));

            window.addEventListener(Runner.events.BLUR,
                this.onVisibilityChange.bind(this));

            window.addEventListener(Runner.events.FOCUS,
                this.onVisibilityChange.bind(this));
        },
		
		/*******************************************************************************
		- Function    : clearCanvas
		- Description : 清除画布
		*******************************************************************************/
		
        clearCanvas: function () {
            this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
                this.dimensions.HEIGHT);
        },

        /**
         * Update the game frame and schedules the next one.
         */
		 
		/******************************************************************************
		- Function    : update
		- Description : 更新-主游戏
		- Parameter   
			1.updatePending
			2.now             		 ：当前时间
			3.deltaTime     		 ：时间间隔（now-time）
			4.time          		 ：上一刻时间
			5.playing         		 ：标志-游戏是否进行            
			6.tRex.jumping    		 ：恐龙跳跃
			7.runningTime	   		 ：跑步时间
			8.this.config.CLEAR_TIME ：游戏一开始没有障碍的时间
			9.tRex.jumpCount         ：跳跃次数
		- UsedFunction
			1.clearCanvas      ：清除画布（每次更新是先清除再绘制）
		- Content
			1.
			2.soundFx          ：存储音频数据（可以直接播放）
		*******************************************************************************/
		 
        update: function () {
            this.updatePending = false;

            var now = getTimeStamp();
            var deltaTime = now - (this.time || now);
            this.time = now;

            if (this.playing) {
                this.clearCanvas();

                if (this.tRex.jumping) {
                    this.tRex.updateJump(deltaTime);
                }

                this.runningTime += deltaTime;
                var hasObstacles = this.runningTime > this.config.CLEAR_TIME;

                // First jump triggers the intro.
                if (this.tRex.jumpCount == 1 && !this.playingIntro) {
                    this.playIntro();
                }

                // The horizon doesn't move until the intro is over.
                if (this.playingIntro) {
                    this.horizon.update(0, this.currentSpeed, hasObstacles);
                } else {
                    deltaTime = !this.activated ? 0 : deltaTime;
                    this.horizon.update(deltaTime, this.currentSpeed, hasObstacles,
                        this.inverted);
                }

                // Check for collisions.
                var collision = hasObstacles &&
                    checkForCollision(this.horizon.obstacles[0], this.tRex);

                if (!collision) {
                    this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;

                    if (this.currentSpeed < this.config.MAX_SPEED) {
                        this.currentSpeed += this.config.ACCELERATION;
                    }
                } else {
                    this.gameOver();
                }

                var playAchievementSound = this.distanceMeter.update(deltaTime,
                    Math.ceil(this.distanceRan));

                if (playAchievementSound) {
                    this.playSound(this.soundFx.SCORE);
                }

                // Night mode.
                if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
                    this.invertTimer = 0;
                    this.invertTrigger = false;
                    this.invert();
                } else if (this.invertTimer) {
                    this.invertTimer += deltaTime;
                } else {
                    var actualDistance =
                        this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));

                    if (actualDistance > 0) {
                        this.invertTrigger = !(actualDistance %
                            this.config.INVERT_DISTANCE);

                        if (this.invertTrigger && this.invertTimer === 0) {
                            this.invertTimer += deltaTime;
                            this.invert();
                        }
                    }
                }
            }

            if (this.playing || (!this.activated &&
                this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
                this.tRex.update(deltaTime);
                this.scheduleNextUpdate();
            }
        },

        /*******************************************************************************
		- Function    : handleEvent
		- Description : 处理事件（将鼠标、键盘、触屏归类）
		- Parameter   ：
			1.onKeyDown        ：按下
			2.onKeyUp          ：松开
		*******************************************************************************/
        handleEvent: function (e) {
            return (function (evtType, events) {
                switch (evtType) {
                    case events.KEYDOWN:
                    case events.TOUCHSTART:
                    case events.MOUSEDOWN:
                        this.onKeyDown(e);
                        break;
                    case events.KEYUP:
                    case events.TOUCHEND:
                    case events.MOUSEUP:
                        this.onKeyUp(e);
                        break;
                }
            }.bind(this))(e.type, Runner.events);
        },

        /*******************************************************************************
		- Function    : startListening
		- Description : 添加TouchController布局
		- Parameter   ：
			1.touchController  ：触摸动作响应布局（全屏+固定+透明）
			2.outerContainerEl ：父布局
		*******************************************************************************/
        startListening: function () {
            // Keys.
            document.addEventListener(Runner.events.KEYDOWN, this);
            document.addEventListener(Runner.events.KEYUP, this);

            if (IS_MOBILE) {
                // Mobile only touch devices.
                this.touchController.addEventListener(Runner.events.TOUCHSTART, this);
                this.touchController.addEventListener(Runner.events.TOUCHEND, this);
                this.containerEl.addEventListener(Runner.events.TOUCHSTART, this);
            } else {
                // Mouse.
                document.addEventListener(Runner.events.MOUSEDOWN, this);
                document.addEventListener(Runner.events.MOUSEUP, this);
            }
        },

        /**
         * Remove all listeners.
         */
        stopListening: function () {
            document.removeEventListener(Runner.events.KEYDOWN, this);
            document.removeEventListener(Runner.events.KEYUP, this);

            if (IS_MOBILE) {
                this.touchController.removeEventListener(Runner.events.TOUCHSTART, this);
                this.touchController.removeEventListener(Runner.events.TOUCHEND, this);
                this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this);
            } else {
                document.removeEventListener(Runner.events.MOUSEDOWN, this);
                document.removeEventListener(Runner.events.MOUSEUP, this);
            }
        },

        /*******************************************************************************
		- Function    : onKeyDown
		- Description : 按下事件处理
		- Input       
			e         ：事件
		- Parameter   
			1.playing          ：标志-游戏是否进行
			2.detailsButton    ：
			3.soundFx          ：存储音频数据（可以直接播放）
		*******************************************************************************/

        onKeyDown: function (e) {
            // 移动设备在游戏中不响应
            if (IS_MOBILE && this.playing) {
                e.preventDefault();
            }
			
			// Condition:??
            if (e.target != this.detailsButton) {
				/******************************************************************
				* - Description:执行跳跃部分
				* - Condition:
				*	1.未结束游戏（crashed！=1）
				*	2.跳跃键按下（电脑）或者触屏（移动设备）
				* - Content:
				*	1.游戏未开始（playing==0），开始游戏（加载声音，更新帧）
				*	2.除跳、躲状态外，接收按键后，播放跳跃声音+开始跳跃
				********************************************************************/
                if (!this.crashed && (Runner.keycodes.JUMP[e.keyCode] ||
                    e.type == Runner.events.TOUCHSTART)) {
                    if (!this.playing) {
                        this.loadSounds();
                        this.playing = true;
                        this.update();
                        if (window.errorPageController) {
                            errorPageController.trackEasterEgg();
                        }
                    }
                    
                    if (!this.tRex.jumping && !this.tRex.ducking) {
                        this.playSound(this.soundFx.BUTTON_PRESS);
                        this.tRex.startJump(this.currentSpeed);
                    }
                }
				
				//当游戏结束是，再次触碰重启游戏
                if (this.crashed && e.type == Runner.events.TOUCHSTART &&
                    e.currentTarget == this.containerEl) {
                    this.restart();
                }
            }
			
			/******************************************************************
				* - Description:执行闪躲部分
				* - Condition:
				*	1.未结束游戏（crashed！=1）
				*	2.游戏进行中（playing == 1）
				*	3.闪躲键按下（电脑）
				* - Content:
				*	1.跳跃时，按下闪避键，实现快速下落
				*	2.非跳跃时，进入闪躲状态
			********************************************************************/
            if (this.playing && !this.crashed && Runner.keycodes.DUCK[e.keyCode]) {
                e.preventDefault();
                if (this.tRex.jumping) {
                    // Speed drop, activated only when jump key is not pressed.
                    this.tRex.setSpeedDrop();
                } else if (!this.tRex.jumping && !this.tRex.ducking) {
                    // Duck.
                    this.tRex.setDuck(true);
                }
            }
        },

        /*******************************************************************************
		- Function    : onKeyDown
		- Description : 松开按键
		- Input       
			e         ：事件
		- Parameter   
			1.playing          ：标志-游戏是否进行
			2.detailsButton    ：
			3.soundFx          ：存储音频数据（可以直接播放）
		*******************************************************************************/
		
        onKeyUp: function (e) {
            var keyCode = String(e.keyCode);
            var isjumpKey = Runner.keycodes.JUMP[keyCode] ||
                e.type == Runner.events.TOUCHEND ||
                e.type == Runner.events.MOUSEDOWN;

            if (this.isRunning() && isjumpKey) {
                this.tRex.endJump();
            } else if (Runner.keycodes.DUCK[keyCode]) {
                this.tRex.speedDrop = false;
                this.tRex.setDuck(false);
            } else if (this.crashed) {
                // Check that enough time has elapsed before allowing jump key to restart.
                var deltaTime = getTimeStamp() - this.time;

                if (Runner.keycodes.RESTART[keyCode] || this.isLeftClickOnCanvas(e) ||
                    (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
                        Runner.keycodes.JUMP[keyCode])) {
                    this.restart();
                }
            } else if (this.paused && isjumpKey) {
                // Reset the jump state
                this.tRex.reset();
                this.play();
            }
        },

        /*******************************************************************************
		- Function    : isLeftClickOnCanvas
		- Description : 判断鼠标是否左击画布
		- Input       
			e         ：事件
		*******************************************************************************/
        isLeftClickOnCanvas: function (e) {
            return e.button != null && e.button < 2 &&
                e.type == Runner.events.MOUSEUP && e.target == this.canvas;
        },

        /*******************************************************************************
		- Function    : scheduleNextUpdate
		- Description : 松开按键
		- Input       
			e         ：事件
		- Parameter   
			1.playing          ：标志-游戏是否进行
			2.detailsButton    ：
			3.soundFx          ：存储音频数据（可以直接播放）
		*******************************************************************************/
        scheduleNextUpdate: function () {
            if (!this.updatePending) {
                this.updatePending = true;
                this.raqId = requestAnimationFrame(this.update.bind(this));
            }
        },

        /**
         * Whether the game is running.
         * @return {boolean}
         */
        isRunning: function () {
            return !!this.raqId;
        },

        /**
         * Game over state.
         */
		 
		 /*******************************************************************************
		- Function    : gameOver
		- Description : 
		- UsedFunction
			1.stop           ：游戏暂停
		- Parameter   ：
			1.soundFx          ：存储音频数据（可以直接播放）
			2.crashed          ：标志-撞击
			3.distanceMeter    ：积分榜
			4.gameOverPanel    ：标志-是否进入结束状态
			5.distanceRan      ：本次分数
			6.highestScore     ：最高分
		*******************************************************************************/
		
        gameOver: function () {
            this.playSound(this.soundFx.HIT);
            vibrate(200);

            this.stop();
            this.crashed = true;
            this.distanceMeter.acheivement = false;

            this.tRex.update(100, Trex.status.CRASHED);

            // Game over panel.
            if (!this.gameOverPanel) {
                this.gameOverPanel = new GameOverPanel(this.canvas,
                    this.spriteDef.TEXT_SPRITE, this.spriteDef.RESTART,
                    this.dimensions);
            } else {
                this.gameOverPanel.draw();
            }

            // Update the high score.
            if (this.distanceRan > this.highestScore) {
                this.highestScore = Math.ceil(this.distanceRan);
                this.distanceMeter.setHighScore(this.highestScore);
            }

            // Reset the time clock.
            this.time = getTimeStamp();
        },
		
		/*******************************************************************************
		- Function    : stop
		- Description : 游戏结束，画面定格
		- Parameter   
			1.playing          ：标志-游戏是否进行
		*******************************************************************************/

        stop: function () {
            this.playing = false;
            this.paused = true;
            cancelAnimationFrame(this.raqId);
            this.raqId = 0;
        },
		
		/*******************************************************************************
		- Function    : play
		- Description : 游戏开始
		- Parameter   
			1.playing          ：标志-游戏是否进行
		- Content
			1.更新标志
			2.恐龙更新至奔跑状态，间隔为0
			3.获取当前时间
			4.更新画面
		*******************************************************************************/

        play: function () {
            if (!this.crashed) {
                this.playing = true;
                this.paused = false;
                this.tRex.update(0, Trex.status.RUNNING);
                this.time = getTimeStamp();
                this.update();
            }
        },
		
		/*******************************************************************************
		- Function    : restart
		- Description : 重新开始
		- Parameter   
			1.playing          ：标志-游戏是否进行
			2.soundFx          ：存储音频数据（可以直接播放）
		- UsedFunction
			1.clearCanvas      ：清除画布
		- Content
			1.更新标志
		*******************************************************************************/

        restart: function () {
            if (!this.raqId) {
                this.playCount++;
                this.runningTime = 0;
                this.playing = true;
                this.crashed = false;
                this.distanceRan = 0;
                this.setSpeed(this.config.SPEED);
                this.time = getTimeStamp();
                this.containerEl.classList.remove(Runner.classes.CRASHED);
                this.clearCanvas();
                this.distanceMeter.reset(this.highestScore);
                this.horizon.reset();
                this.tRex.reset();
                this.playSound(this.soundFx.BUTTON_PRESS);
                this.invert(true);
                this.update();
            }
        },

        /*******************************************************************************
		- Function    : onVisibilityChange
		- Description : 可见状态改变
		- UsedFunction
			1.stop           ：游戏暂停
			2.tRex.reset	 ：
			3.play           ：游戏开始
		- Content
			1.失去焦点，被隐藏时，游戏暂停
			2.恢复焦点，游戏只要未结束，重启该游戏
		*******************************************************************************/
        onVisibilityChange: function (e) {
            if (document.hidden || document.webkitHidden || e.type == 'blur' ||
                document.visibilityState != 'visible') {
                this.stop();
            } else if (!this.crashed) {
                this.tRex.reset();
                this.play();
            }
        },

        /*******************************************************************************
		- Function    : playSound
		- Description : 播放音乐
		- Input
			1.soundBuffer    ：数据流
		*******************************************************************************/
        playSound: function (soundBuffer) {
            if (soundBuffer) {
                var sourceNode = this.audioContext.createBufferSource();
                sourceNode.buffer = soundBuffer;
                sourceNode.connect(this.audioContext.destination);
                sourceNode.start(0);
            }
        },

        /**
         * Inverts the current page / canvas colors.
         * @param {boolean} Whether to reset colors.
         */
        invert: function (reset) {
            if (reset) {
                document.body.classList.toggle(Runner.classes.INVERTED, false);
                this.invertTimer = 0;
                this.inverted = false;
            } else {
                this.inverted = document.body.classList.toggle(Runner.classes.INVERTED,
                    this.invertTrigger);
            }
        }
    };


    /**
     * Updates the canvas size taking into
     * account the backing store pixel ratio and
     * the device pixel ratio.
     *
     * See article by Paul Lewis:
     * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
     *
     * @param {HTMLCanvasElement} canvas
     * @param {number} opt_width
     * @param {number} opt_height
     * @return {boolean} Whether the canvas was scaled.
     */
    Runner.updateCanvasScaling = function (canvas, opt_width, opt_height) {
        var context = canvas.getContext('2d');

        // Query the various pixel ratios
        var devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
        var backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
        var ratio = devicePixelRatio / backingStoreRatio;

        // Upscale the canvas if the two ratios don't match
        if (devicePixelRatio !== backingStoreRatio) {
            var oldWidth = opt_width || canvas.width;
            var oldHeight = opt_height || canvas.height;

            canvas.width = oldWidth * ratio;
            canvas.height = oldHeight * ratio;

            canvas.style.width = oldWidth + 'px';
            canvas.style.height = oldHeight + 'px';

            // Scale the context to counter the fact that we've manually scaled
            // our canvas element.
            context.scale(ratio, ratio);
            return true;
        } else if (devicePixelRatio == 1) {
            // Reset the canvas width / height. Fixes scaling bug when the page is
            // zoomed and the devicePixelRatio changes accordingly.
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
        }
        return false;
    };


    /*******************************************************************************
	- Function    : getRandomNum
	- Description : 得到随机数
	- Input
		min/max   ；范围
	*******************************************************************************/	
    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


	/*******************************************************************************
	- Function    : vibrate
	- Description : 振动
	*******************************************************************************/	
    function vibrate(duration) {
        if (IS_MOBILE && window.navigator.vibrate) {
            window.navigator.vibrate(duration);
        }
    }


    /**
     * Create canvas element.
     * @param {HTMLElement} container Element to append canvas to.
     * @param {number} width
     * @param {number} height
     * @param {string} opt_classname
     * @return {HTMLCanvasElement}
     */
    function createCanvas(container, width, height, opt_classname) {
        var canvas = document.createElement('canvas');
        canvas.className = opt_classname ? Runner.classes.CANVAS + ' ' +
            opt_classname : Runner.classes.CANVAS;
        canvas.width = width;
        canvas.height = height;
        container.appendChild(canvas);

        return canvas;
    }


    /*******************************************************************************
	- Function    : decodeBase64ToArrayBuffer
	- Description : 将64加密字符串转换成对应
	- Input       : 
		base64String       : 64加密字符串
	- Output   ：
		bytes.buffer       ：返回的二进制
	*******************************************************************************/
    function decodeBase64ToArrayBuffer(base64String) {
		//得到64Base解密后字符串的长度和文本
        var len = (base64String.length / 4) * 3;
        var str = atob(base64String);
		
		//得到文本对应的二进制字符串（charCodeAt字符转为Unicode编码）
        var arrayBuffer = new ArrayBuffer(len);
        var bytes = new Uint8Array(arrayBuffer);
        for (var i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
		
        return bytes.buffer;
    }


    /**
     * Return the current timestamp.
     * @return {number}
     */
    function getTimeStamp() {
        return IS_IOS ? new Date().getTime() : performance.now();
    }


    //******************************************************************************


	/*******************************************************************************
	- Function    : GameOverPanel
	- Description : 结束游戏-构造函数
	- Input
		1.canvas        ：画布
		2.textImgPos    ：GAMEOVER文字起始坐标
		3.restartImgPos ：重新开始图片起始坐标
		4.dimensions    ：相关维度
	*******************************************************************************/	
    function GameOverPanel(canvas, textImgPos, restartImgPos, dimensions) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.canvasDimensions = dimensions;
        this.textImgPos = textImgPos;
        this.restartImgPos = restartImgPos;
        this.draw();
    };


	/*******************************************************************************
	- Function    : GameOverPanel.dimensions
	- Description : 结束游戏-维度
	- Parameter
		1.TEXT_X/TEXT_Y ：文字相对坐标
		2.TEXT_WIDTH    ：文字图片的长宽
		3.RESTART_WIDTH ：重新开始图片的长宽
	*******************************************************************************/	
    GameOverPanel.dimensions = {
        TEXT_X: 0,
        TEXT_Y: 13,
        TEXT_WIDTH: 191,
        TEXT_HEIGHT: 11,
        RESTART_WIDTH: 36,
        RESTART_HEIGHT: 32
    };
	/*******************************************************************************
	- Function    : GameOverPanel.prototype
	- Description : 游戏结束-原型
	- SubFunction   
		1.updateDimensions   ：更新维度
		2.draw               ：绘制

	*******************************************************************************/	

    GameOverPanel.prototype = {
        /*******************************************************************************
		* - Function：updateDimensions
		* - Description : 更新维度
		****************************************************************/
        updateDimensions: function (width, opt_height) {
            this.canvasDimensions.WIDTH = width;
            if (opt_height) {
                this.canvasDimensions.HEIGHT = opt_height;
            }
        },

       /*******************************************************************************
		* - Function：draw
		* - Description : 绘制
		****************************************************************/
        draw: function () {
            var dimensions = GameOverPanel.dimensions;

            var centerX = this.canvasDimensions.WIDTH / 2;

            // Game over text.
            var textSourceX = dimensions.TEXT_X;
            var textSourceY = dimensions.TEXT_Y;
            var textSourceWidth = dimensions.TEXT_WIDTH;
            var textSourceHeight = dimensions.TEXT_HEIGHT;

            var textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
            var textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
            var textTargetWidth = dimensions.TEXT_WIDTH;
            var textTargetHeight = dimensions.TEXT_HEIGHT;

            var restartSourceWidth = dimensions.RESTART_WIDTH;
            var restartSourceHeight = dimensions.RESTART_HEIGHT;
            var restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
            var restartTargetY = this.canvasDimensions.HEIGHT / 2;

            if (IS_HIDPI) {
                textSourceY *= 2;
                textSourceX *= 2;
                textSourceWidth *= 2;
                textSourceHeight *= 2;
                restartSourceWidth *= 2;
                restartSourceHeight *= 2;
            }

            textSourceX += this.textImgPos.x;
            textSourceY += this.textImgPos.y;

            // Game over text from sprite.
            this.canvasCtx.drawImage(Runner.imageSprite,
                textSourceX, textSourceY, textSourceWidth, textSourceHeight,
                textTargetX, textTargetY, textTargetWidth, textTargetHeight);

            // Restart button.
            this.canvasCtx.drawImage(Runner.imageSprite,
                this.restartImgPos.x, this.restartImgPos.y,
                restartSourceWidth, restartSourceHeight,
                restartTargetX, restartTargetY, dimensions.RESTART_WIDTH,
                dimensions.RESTART_HEIGHT);
        }
    };


    //******************************************************************************

    /**
     * Check for a collision.
     * @param {!Obstacle} obstacle
     * @param {!Trex} tRex T-rex object.
     * @param {HTMLCanvasContext} opt_canvasCtx Optional canvas context for drawing
     *    collision boxes.
     * @return {Array<CollisionBox>}
     */
    function checkForCollision(obstacle, tRex, opt_canvasCtx) {
        var obstacleBoxXPos = Runner.defaultDimensions.WIDTH + obstacle.xPos;

        // Adjustments are made to the bounding box as there is a 1 pixel white
        // border around the t-rex and obstacles.
        var tRexBox = new CollisionBox(
            tRex.xPos + 1,
            tRex.yPos + 1,
            tRex.config.WIDTH - 2,
            tRex.config.HEIGHT - 2);

        var obstacleBox = new CollisionBox(
            obstacle.xPos + 1,
            obstacle.yPos + 1,
            obstacle.typeConfig.width * obstacle.size - 2,
            obstacle.typeConfig.height - 2);

        // Debug outer box
        if (opt_canvasCtx) {
            drawCollisionBoxes(opt_canvasCtx, tRexBox, obstacleBox);
        }

        // Simple outer bounds check.
        if (boxCompare(tRexBox, obstacleBox)) {
            var collisionBoxes = obstacle.collisionBoxes;
            var tRexCollisionBoxes = tRex.ducking ?
                Trex.collisionBoxes.DUCKING : Trex.collisionBoxes.RUNNING;

            // Detailed axis aligned box check.
            for (var t = 0; t < tRexCollisionBoxes.length; t++) {
                for (var i = 0; i < collisionBoxes.length; i++) {
                    // Adjust the box to actual positions.
                    var adjTrexBox =
                        createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox);
                    var adjObstacleBox =
                        createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
                    var crashed = boxCompare(adjTrexBox, adjObstacleBox);

                    // Draw boxes for debug.
                    if (opt_canvasCtx) {
                        drawCollisionBoxes(opt_canvasCtx, adjTrexBox, adjObstacleBox);
                    }

                    if (crashed) {
                        return [adjTrexBox, adjObstacleBox];
                    }
                }
            }
        }
        return false;
    };


    /**
     * Adjust the collision box.
     * @param {!CollisionBox} box The original box.
     * @param {!CollisionBox} adjustment Adjustment box.
     * @return {CollisionBox} The adjusted collision box object.
     */
    function createAdjustedCollisionBox(box, adjustment) {
        return new CollisionBox(
            box.x + adjustment.x,
            box.y + adjustment.y,
            box.width,
            box.height);
    };


    /**
     * Draw the collision boxes for debug.
     */
    function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
        canvasCtx.save();
        canvasCtx.strokeStyle = '#f00';
        canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);

        canvasCtx.strokeStyle = '#0f0';
        canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
            obstacleBox.width, obstacleBox.height);
        canvasCtx.restore();
    };


    /**
     * Compare two collision boxes for a collision.
     * @param {CollisionBox} tRexBox
     * @param {CollisionBox} obstacleBox
     * @return {boolean} Whether the boxes intersected.
     */
    function boxCompare(tRexBox, obstacleBox) {
        var crashed = false;
        var tRexBoxX = tRexBox.x;
        var tRexBoxY = tRexBox.y;

        var obstacleBoxX = obstacleBox.x;
        var obstacleBoxY = obstacleBox.y;

        // Axis-Aligned Bounding Box method.
        if (tRexBox.x < obstacleBoxX + obstacleBox.width &&
            tRexBox.x + tRexBox.width > obstacleBoxX &&
            tRexBox.y < obstacleBox.y + obstacleBox.height &&
            tRexBox.height + tRexBox.y > obstacleBox.y) {
            crashed = true;
        }

        return crashed;
    };


    //******************************************************************************

    /**
     * Collision box object.
     * @param {number} x X position.
     * @param {number} y Y Position.
     * @param {number} w Width.
     * @param {number} h Height.
     */
    function CollisionBox(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    };


    //******************************************************************************

	/*******************************************************************************
	- Function    : Obstacle
	- Description : 障碍-构造函数
	- Input       : 
		1.canvasCtx      : 画笔对象
		2.type           ：障碍物类型
		3.spriteImgPos   ：素材图中坐标
		4.dimensions     ：屏幕尺寸
		5.gapCoefficient ：最大间距系数
		6.speed          ：障碍物移动速度
		7.opt_xOffset    ：障碍物水平修正量
	- Parameter   ：
		1.spritePos/canvasCtx         ：同上
		2.typeConfig/gapCoefficient   ：同上
		3.dimensions                  ：同上
		4.size                        ：障碍物的数量(1~3)
		5.remove                      ：是否移除
		6.xPos，yPos                  : 在游戏图中的x和y
		7.collisionBoxes              : 碰撞盒子
		8.gap                         ：间隔
		9.speedOffset                 ：速度偏移
		10.currentFrame               ：当前动画帧
		11.timer                      ：动画计时器
	*******************************************************************************/
    function Obstacle(canvasCtx, type, spriteImgPos, dimensions,
        gapCoefficient, speed, opt_xOffset) {

        this.canvasCtx = canvasCtx;
        this.spritePos = spriteImgPos;
        this.typeConfig = type;
        this.gapCoefficient = gapCoefficient;
        this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
        this.dimensions = dimensions;
        this.remove = false;
        this.xPos = dimensions.WIDTH + (opt_xOffset || 0);
        this.yPos = 0;
        this.width = 0;
        this.collisionBoxes = [];
        this.gap = 0;
        this.speedOffset = 0;

        // For animated obstacles.
        this.currentFrame = 0;
        this.timer = 0;

        this.init(speed);
    };

	/*******************************************************************************
	- Description 
		1.MAX_GAP_COEFFICIENT ：最大间距系数
		2.MAX_OBSTACLE_LENGTH ：最大障碍物数
	*******************************************************************************/
    Obstacle.MAX_GAP_COEFFICIENT = 1.5;

    Obstacle.MAX_OBSTACLE_LENGTH = 3,

		/*******************************************************************************
		- Function    : Obstacle
		- Description : 障碍原型链
		- SubFunction   
			1.init             ：初始化各个参数
			2.draw        ：得到随机地形（两种）
			3.draw                 ：绘制（两个）
			4.updateXPos           ：更新x位置
		*******************************************************************************/	
        Obstacle.prototype = {
            /****************************************************************
			* - Function：init
			* - Description : 初始化
			* - Input
			*	1.speed    ：游戏刷新率
			* - Parameter        
			* 	1.yPos      ：第一个云彩高度
			*  
			****************************************************************/
            init: function (speed) {
                this.cloneCollisionBoxes();

                // Only allow sizing if we're at the right speed.
                if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
                    this.size = 1;
                }

                this.width = this.typeConfig.width * this.size;

                // Check if obstacle can be positioned at various heights.
                if (Array.isArray(this.typeConfig.yPos)) {
                    var yPosConfig = IS_MOBILE ? this.typeConfig.yPosMobile :
                        this.typeConfig.yPos;
                    this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
                } else {
                    this.yPos = this.typeConfig.yPos;
                }

                this.draw();

                // Make collision box adjustments,
                // Central box is adjusted to the size as one box.
                //      ____        ______        ________
                //    _|   |-|    _|     |-|    _|       |-|
                //   | |<->| |   | |<--->| |   | |<----->| |
                //   | | 1 | |   | |  2  | |   | |   3   | |
                //   |_|___|_|   |_|_____|_|   |_|_______|_|
                //
                if (this.size > 1) {
                    this.collisionBoxes[1].width = this.width - this.collisionBoxes[0].width -
                        this.collisionBoxes[2].width;
                    this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
                }

                // For obstacles that go at a different speed from the horizon.
                if (this.typeConfig.speedOffset) {
                    this.speedOffset = Math.random() > 0.5 ? this.typeConfig.speedOffset :
                        -this.typeConfig.speedOffset;
                }

                this.gap = this.getGap(this.gapCoefficient, speed);
            },

            /**
             * Draw and crop based on size.
             */
            draw: function () {
                var sourceWidth = this.typeConfig.width;
                var sourceHeight = this.typeConfig.height;

                if (IS_HIDPI) {
                    sourceWidth = sourceWidth * 2;
                    sourceHeight = sourceHeight * 2;
                }

                // X position in sprite.
                var sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) +
                    this.spritePos.x;

                // Animation frames.
                if (this.currentFrame > 0) {
                    sourceX += sourceWidth * this.currentFrame;
                }

                this.canvasCtx.drawImage(Runner.imageSprite,
                    sourceX, this.spritePos.y,
                    sourceWidth * this.size, sourceHeight,
                    this.xPos, this.yPos,
                    this.typeConfig.width * this.size, this.typeConfig.height);
            },

            /**
             * Obstacle frame update.
             * @param {number} deltaTime
             * @param {number} speed
             */
            update: function (deltaTime, speed) {
                if (!this.remove) {
                    if (this.typeConfig.speedOffset) {
                        speed += this.speedOffset;
                    }
                    this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);

                    // Update frame
                    if (this.typeConfig.numFrames) {
                        this.timer += deltaTime;
                        if (this.timer >= this.typeConfig.frameRate) {
                            this.currentFrame =
                                this.currentFrame == this.typeConfig.numFrames - 1 ?
                                    0 : this.currentFrame + 1;
                            this.timer = 0;
                        }
                    }
                    this.draw();

                    if (!this.isVisible()) {
                        this.remove = true;
                    }
                }
            },

            /**
             * Calculate a random gap size.
             * - Minimum gap gets wider as speed increses
             * @param {number} gapCoefficient
             * @param {number} speed
             * @return {number} The gap size.
             */
            getGap: function (gapCoefficient, speed) {
                var minGap = Math.round(this.width * speed +
                    this.typeConfig.minGap * gapCoefficient);
                var maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
                return getRandomNum(minGap, maxGap);
            },

            /**
             * Check if obstacle is visible.
             * @return {boolean} Whether the obstacle is in the game area.
             */
            isVisible: function () {
                return this.xPos + this.width > 0;
            },

            /**
             * Make a copy of the collision boxes, since these will change based on
             * obstacle type and size.
             */
            cloneCollisionBoxes: function () {
                var collisionBoxes = this.typeConfig.collisionBoxes;

                for (var i = collisionBoxes.length - 1; i >= 0; i--) {
                    this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x,
                        collisionBoxes[i].y, collisionBoxes[i].width,
                        collisionBoxes[i].height);
                }
            }
        };


	/*******************************************************************************
	- Function    : Obstacle.types
	- Description : 障碍种类
	- Type   
		1.CACTUS_SMALL  ：小障碍物
		2.CACTUS_LARGE  ：大障碍物
		3.PTERODACTYL   ：翼龙
	- partParameter
		1.numFrames     ：一个物体的帧数
		2.frameRate     ：动画帧的切换速率，这里为一秒6帧
		3.speedOffset   ：速度偏移
	*******************************************************************************/	
    Obstacle.types = [
        {
            type: 'CACTUS_SMALL',
            width: 17,
            height: 35,
            yPos: 105,
            multipleSpeed: 4,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
                new CollisionBox(0, 7, 5, 27),
                new CollisionBox(4, 0, 6, 34),
                new CollisionBox(10, 4, 7, 14)
            ]
        },
        {
            type: 'CACTUS_LARGE',
            width: 25,
            height: 50,
            yPos: 90,
            multipleSpeed: 7,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
                new CollisionBox(0, 12, 7, 38),
                new CollisionBox(8, 0, 7, 49),
                new CollisionBox(13, 10, 10, 38)
            ]
        },
        {
            type: 'PTERODACTYL',
            width: 46,
            height: 29,
            yPos: [100, 95, 50], // Variable height.
            yPosMobile: [100, 50], // Variable height mobile.
            multipleSpeed: 999,
            minSpeed: 8.5,
            minGap: 150,
            collisionBoxes: [
                new CollisionBox(1, 7, 40, 13),
                new CollisionBox(18, 0, 14, 29)
            ],
            numFrames: 2,
            frameRate: 1000 / 6,
            speedOffset: .8
        }
    ];


	/*******************************************************************************
	- Function    : Trex
	- Description : 恐龙类
	- Input       : 
		1.canvasCtx      : 画笔对象
		2.spritePos      ：障碍物类型
	- Parameter   ：
		1.spritePos/canvasCtx         ：同上
		2.canvasCtx                   ：画笔
		3.xPos，yPos                  : 在游戏图中的x和y
		4.groundYPos                  ：初始化地面的高度
		5.currentFrame                ：当前帧
		6.currentAnimFrames           : 记录当前状态的动画帧
		7.blinkDelay                  : 眨眼延迟(随机)
		8.blinkCount                  ：眨眼计数
		9.animStartTime               ：动画开始的时间
		10.timer                      ：动画计时器
		11.msPerFrame                 ：每秒几帧
		12.config                     ：配置副本
		13.status                     ：恐龙状态
		14.jumping                    ：是否处于跳跃状态
		15.ducking                    ：是否处于闪避状态
		16.jumpVelocity               ：跳跃初始速度
		17.reachedMinHeight           ：是否到达最小跳跃高度
		18.speedDrop                  ：是否加速降落
		19.jumpCount                  ：跳跃次数
		20.jumpspotX                  ：跳跃横向距离
	*******************************************************************************/	
	
    function Trex(canvas, spritePos) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.xPos = 0;
        this.yPos = 0;
        // Position when on the ground.
        this.groundYPos = 0;
        this.currentFrame = 0;
        this.currentAnimFrames = [];
        this.blinkDelay = 0;
        this.blinkCount = 0;
        this.animStartTime = 0;
        this.timer = 0;
        this.msPerFrame = 1000 / FPS;
        this.config = Trex.config;
        // Current status.
        this.status = Trex.status.WAITING;

        this.jumping = false;
        this.ducking = false;
        this.jumpVelocity = 0;
        this.reachedMinHeight = false;
        this.speedDrop = false;
        this.jumpCount = 0;
        this.jumpspotX = 0;

        this.init();
    };


	/*******************************************************************************
	- Function    : Trex.config
	- Description : 恐龙配置
	- Parameter   
		1.WIDTH/HEIGHT            : Sprite图中正常长高
		2.HEIGHT_DUCK/ WIDTH_DUCK ：Sprite图中躲避长高
		3.GRAVITY                 ：重力参数
		4.DROP_VELOCITY           ：下降速度
		5.INIITAL_JUMP_VELOCITY   ：初始跳跃速度
		6.JUMP_HEIGHT             : 跳跃高度
		7.SPEED_DROP_COEFFICIENT  ：快速下降系数
		8.SPRITE_WIDTH         	  ：
		9.START_X_POS             ：起始位置
	*******************************************************************************/	
    Trex.config = {
		HEIGHT: 43,
        HEIGHT_DUCK: 43,
		WIDTH: 77,
        WIDTH_DUCK: 90,
		INIITAL_JUMP_VELOCITY: -10,
        DROP_VELOCITY: -5,
        GRAVITY: 0.6,
		SPEED_DROP_COEFFICIENT: 3,
        INTRO_DURATION: 1500,
        MAX_JUMP_HEIGHT: 20,
        MIN_JUMP_HEIGHT: 50,
        SPRITE_WIDTH: 262,
        START_X_POS: 50
    };


	/*******************************************************************************
	- Function    : Trex.collisionBoxes
	- Description : 恐龙碰撞盒子
	- Content 
		1.DUCKING    ：躲闪-碰撞盒子（一个）
		2.RUNNING    ：跑步-碰撞盒子（翅膀。身，后脚，前脚，脖子，头）
	*******************************************************************************/
    Trex.collisionBoxes = {
        DUCKING: [
            new CollisionBox(3, 14, 90, 28)
        ],
        RUNNING: [
            new CollisionBox(12, 1, 43, 26),
            new CollisionBox(4, 27, 63, 13),
            new CollisionBox(32, 41, 10, 3),
            new CollisionBox(51, 41, 9, 2),
            new CollisionBox(60, 0, 8, 25),
            new CollisionBox(71, 0, 13, 14)
        ]
    };


	/*******************************************************************************
	- Function    : Trex.status
	- Description : 恐龙状态
	- Status   
		1.CRASHED  ：碰撞
		2.DUCKING  ：躲闪
		3.JUMPING  : 跳跃
		4.RUNNING  ：跑动
		5.WAITING  ：等待
	*******************************************************************************/	
    Trex.status = {
        CRASHED: 'CRASHED',
        DUCKING: 'DUCKING',
        JUMPING: 'JUMPING',
        RUNNING: 'RUNNING',
        WAITING: 'WAITING'
    };

    /*******************************************************************************
	- Parameter    : Trex.BLINK_TIMING
	- Description : 眨眼时间间隔
	*******************************************************************************/	
    Trex.BLINK_TIMING = 200;


	/*******************************************************************************
	- Function    : Trex.animFrames
	- Description : 恐龙动画帧
	- Status   
		1.CRASHED    ：碰撞
		2.DUCKING    ：躲闪
		3.JUMPING    : 跳跃
		4.RUNNING    ：跑动
		5.WAITING    ：待机
	- Parameter
		1.frames     : 对应Sprite的初始x和y
		2.msPerFrame : 一秒几帧
	*******************************************************************************/
    Trex.animFrames = {
        WAITING: {
            frames: [0, 77],
            msPerFrame: 1000 / 3
        },
        RUNNING: {
            frames: [77, 154],
            msPerFrame: 1000 / 6
        },
        CRASHED: {
            frames: [410],
            msPerFrame: 1000 / 60
        },
        JUMPING: {
            frames: [0],
            msPerFrame: 1000 / 60
        },
        DUCKING: {
            frames: [231, 321],
            msPerFrame: 1000 / 8
        }
    };
	
	/*******************************************************************************
	- Function    : Trex.prototype
	- Description : 恐龙原型
	- SubFunction   
		1.init                    ：初始化
		2.setJumpVelocity         ：设置速度
	*******************************************************************************/	
    Trex.prototype = {
        /*******************************************************************************
		* - Function：init
		* - Description : 初始化（地面、恐龙初始位置，最小跳跃高的y）
		* - Parameter        
		* 	1.groundYPos      ：地面高度
		* 	2.yPos            ：恐龙位置y(站在地上的位置)
		*	3.minJumpHeight   ：最小跳跃的高度
		* - UsedFunction
		*	1.draw            :绘制等待图（0.0）
		*	2.update          :更新至“等待状态”
		****************************************************************/
        init: function () {
            this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
                Runner.config.BOTTOM_PAD;
            this.yPos = this.groundYPos;
            this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

            this.draw(0, 0);
            this.update(0, Trex.status.WAITING);
        },

        /*******************************************************************************
		* - Function：setJumpVelocity
		* - Description : 设置跳跃速度
		* - Input
		* 	1.setting         		   ：设置的速度
		* - Parameter        
		* 	1.INIITAL_JUMP_VELOCITY    ：跳跃上升速度
		* 	2.DROP_VELOCITY            ：落下速度（上升的二分之一）
		****************************************************************/
        setJumpVelocity: function (setting) {
            this.config.INIITAL_JUMP_VELOCITY = -setting;
            this.config.DROP_VELOCITY = -setting / 2;
        },

		/*******************************************************************************
		* - Function：update
		* - Description : 更新时间间隔和状态（可选）
		* - Input
		* 	1.deltaTime       ：距上一个状态的时间间隔
		*	2.opt_status      ：刷新的状态
		* - Parameter        
		* 	1.INIITAL_JUMP_VELOCITY    ：跳跃上升速度
		* 	2.DROP_VELOCITY            ：落下速度（上升的二分之一）
		****************************************************************/
        update: function (deltaTime, opt_status) {
            this.timer += deltaTime;

            // Update the status.
            if (opt_status) {
                this.status = opt_status;
                this.currentFrame = 0;
                this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
                this.currentAnimFrames = Trex.animFrames[opt_status].frames;

                if (opt_status == Trex.status.WAITING) {
                    this.animStartTime = getTimeStamp();
                    this.setBlinkDelay();
                }
            }

            // Game intro animation, T-rex moves in from the left.
            if (this.playingIntro && this.xPos < this.config.START_X_POS) {
                this.xPos += Math.round((this.config.START_X_POS /
                    this.config.INTRO_DURATION) * deltaTime);
            }

            if (this.status == Trex.status.WAITING) {
                this.blink(getTimeStamp());
            } else {
                this.draw(this.currentAnimFrames[this.currentFrame], 0);
            }

            // Update the frame position.
            if (this.timer >= this.msPerFrame) {
                this.currentFrame = this.currentFrame ==
                    this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
                this.timer = 0;
            }

            // Speed drop becomes duck if the down key is still being pressed.
            if (this.speedDrop && this.yPos == this.groundYPos) {
                this.speedDrop = false;
                this.setDuck(true);
            }
        },

        /*******************************************************************************
		* - Function：draw
		* - Description : 恐龙-绘制
		* - Input
		* 	1.x             ：在恐龙相对x
		*	2.y             ：在恐龙相对y
		* - Parameter        
		* 	1.ducking       ：标识-躲闪
		* 	2.status        ：状态
		****************************************************************/
        draw: function (x, y) {
            var sourceX = x;
            var sourceY = y;
            var sourceWidth = this.ducking && this.status != Trex.status.CRASHED ?
                this.config.WIDTH_DUCK : this.config.WIDTH;
            var sourceHeight = this.config.HEIGHT;

            if (IS_HIDPI) {
                sourceX *= 2;
                sourceY *= 2;
                sourceWidth *= 2;
                sourceHeight *= 2;
            }

            // Adjustments for sprite sheet position.
            sourceX += this.spritePos.x;
            sourceY += this.spritePos.y;

            // Ducking.
            if (this.ducking && this.status != Trex.status.CRASHED) {
                this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY,
                    sourceWidth, sourceHeight,
                    this.xPos, this.yPos,
                    this.config.WIDTH_DUCK, this.config.HEIGHT);
            } else {
                // Crashed whilst ducking. Trex is standing up so needs adjustment.
                if (this.ducking && this.status == Trex.status.CRASHED) {
                    this.xPos++;
                }
                // Standing / running
                this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY,
                    sourceWidth, sourceHeight,
                    this.xPos, this.yPos,
                    this.config.WIDTH, this.config.HEIGHT);
            }
        },

        /*******************************************************************************
		* - Function：setBlinkDelay
		* - Description : 设置眨眼时间间距
		* - Parameter        
		* 	1.blinkDelay    ：通过默认眨眼间隔乘以一个随机系数
		****************************************************************/
        setBlinkDelay: function () {
            this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
        },

		/*******************************************************************************
		* - Function：blink
		* - Description : 设置眨眼时间间距
		* - Input 
		*	1.time          : 当前时间
		* - Parameter        
		* 	1.deltaTime         ：与前一时刻的时间间隔
		*	2.currentAnimFrames : 该帧对应的所有动画图（存储的是图像的x值）
		*	3.currentFrame      ：对应该动画第几个图
		****************************************************************/
        blink: function (time) {
            var deltaTime = time - this.animStartTime;

            if (deltaTime >= this.blinkDelay) {
                this.draw(this.currentAnimFrames[this.currentFrame], 0);

                if (this.currentFrame == 1) {
                    // Set new random delay to blink.
                    this.setBlinkDelay();
                    this.animStartTime = time;
                    this.blinkCount++;
                }
            }
        },

		/*******************************************************************************
		* - Function：startJump
		* - Description : 开始跳跃
		* - Input 
		*	1.speed             : 当前游戏速度
		* - Parameter        
		* 	1.jumpVelocity      ：跳跃速度
		*	2.jumping           : 跳跃标识符
		*	3.reachedMinHeight  ：未达到最小跳跃高度
		****************************************************************/
        startJump: function (speed) {
            if (!this.jumping) {
                this.update(0, Trex.status.JUMPING);
                // Tweak the jump velocity based on the speed.
                this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - (speed / 10);
                this.jumping = true;
                this.reachedMinHeight = false;
                this.speedDrop = false;
            }
        },

        /*******************************************************************************
		* - Function：endJump
		* - Description : 结束跳跃
		* - Parameter        
		* 	1.jumpVelocity      ：跳跃速度
		* - Content
		*	同时满足以下条件视为结束跳跃
		*	1.达到最小高度的
		*	2.跳跃速度小于降落速度（二分之一）
		****************************************************************/
        endJump: function () {
            if (this.reachedMinHeight &&
                this.jumpVelocity < this.config.DROP_VELOCITY) {
                this.jumpVelocity = this.config.DROP_VELOCITY;
            }
        },

        /*******************************************************************************
		* - Function：updateJump
		* - Description : 更新跳跃状态
		* - Input
		*	1.deltaTime     ：与前一时刻的时间间隔
		*	2.speed         ：当前游戏速度
		* - Content
		*	同时满足以下条件视为结束跳跃
		*	1.达到最小高度的
		*	2.跳跃速度小于降落速度（二分之一）
		****************************************************************/
        updateJump: function (deltaTime, speed) {
            var msPerFrame = Trex.animFrames[this.status].msPerFrame;
            var framesElapsed = deltaTime / msPerFrame;

            // Speed drop makes Trex fall faster.
            if (this.speedDrop) {
                this.yPos += Math.round(this.jumpVelocity *
                    this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
            } else {
                this.yPos += Math.round(this.jumpVelocity * framesElapsed);
            }

            this.jumpVelocity += this.config.GRAVITY * framesElapsed;

            // Minimum height has been reached.
            if (this.yPos < this.minJumpHeight || this.speedDrop) {
                this.reachedMinHeight = true;
            }

            // Reached max height
            if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
                this.endJump();
            }

            // Back down at ground level. Jump completed.
            if (this.yPos > this.groundYPos) {
                this.reset();
                this.jumpCount++;
            }

            this.update(deltaTime);
        },

        /*******************************************************************************
		* - Function：setSpeedDrop
		* - Description : 开始快速下落
		* - Parameter        
		* 	1.speedDrop         ：标识-快速下落
		*	2.jumpVelocity      : 跳跃速度
		****************************************************************/
        setSpeedDrop: function () {
            this.speedDrop = true;
            this.jumpVelocity = 1;
        },

        /*******************************************************************************
		* - Function：setDuck
		* - Description : 开始躲闪
		* - Input
		*	1.isDucking         ：标识-是否要躲闪
		* - Parameter        
		* 	1.status            ：状态
		*	2.ducking           : 标识-躲闪
		* - UsedFunction
		*	1.update            ：更新状态（躲闪/奔跑）间隔为0
		****************************************************************/
        setDuck: function (isDucking) {
            if (isDucking && this.status != Trex.status.DUCKING) {
                this.update(0, Trex.status.DUCKING);
                this.ducking = true;
            } else if (this.status == Trex.status.DUCKING) {
                this.update(0, Trex.status.RUNNING);
                this.ducking = false;
            }
        },

		/*******************************************************************************
		* - Function：reset
		* - Description : 恐龙-重置
		* - Parameter        
		* 	1.yPos              ：恐龙位置
		*	2.jumpVelocity      : 跳跃速度
		*	3.jumping           ：标识-跳跃（F）
		*	4.ducking           ：标识-躲闪（F）
		*	5.speedDrop         ：标识-快速下落（F）
		*	6.jumpCount			：跳跃次数
		* - UsedFunction
		*	1.update            ：更新状态（奔跑）
		****************************************************************/
        reset: function () {
            this.yPos = this.groundYPos;
            this.jumpVelocity = 0;
            this.jumping = false;
            this.ducking = false;
            this.update(0, Trex.status.RUNNING);
            this.speedDrop = false;
            this.jumpCount = 0;
        }
    };

    /**
     * Handles displaying the distance meter.
     * @param {!HTMLCanvasElement} canvas
     * @param {Object} spritePos Image position in sprite.
     * @param {number} canvasWidth
     * @constructor
     */
    function DistanceMeter(canvas, spritePos, canvasWidth) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.image = Runner.imageSprite;
        this.spritePos = spritePos;
        this.x = 0;
        this.y = 5;

        this.currentDistance = 0;
        this.maxScore = 0;
        this.highScore = 0;
        this.container = null;

        this.digits = [];
        this.acheivement = false;
        this.defaultString = '';
        this.flashTimer = 0;
        this.flashIterations = 0;
        this.invertTrigger = false;

        this.config = DistanceMeter.config;
        this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
        this.init(canvasWidth);
    };


    /**
     * @enum {number}
     */
    DistanceMeter.dimensions = {
        WIDTH: 10,
        HEIGHT: 13,
        DEST_WIDTH: 11//间距
    };


    /**
     * Y positioning of the digits in the sprite sheet.
     * X position is always 0.
     * @type {Array<number>}
     */
    DistanceMeter.yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];


    /**
     * Distance meter config.
     * @enum {number}
     */
    DistanceMeter.config = {
        // Number of digits.
        MAX_DISTANCE_UNITS: 5,

        // Distance that causes achievement animation.
        ACHIEVEMENT_DISTANCE: 100,

        // Used for conversion from pixel distance to a scaled unit.
        COEFFICIENT: 0.025,

        // Flash duration in milliseconds.
        FLASH_DURATION: 1000 / 4,

        // Flash iterations for achievement animation.
        FLASH_ITERATIONS: 3
    };


    DistanceMeter.prototype = {
        /**
         * Initialise the distance meter to '00000'.
         * @param {number} width Canvas width in px.
         */
        init: function (width) {
            var maxDistanceStr = '';

            this.calcXPos(width);
            this.maxScore = this.maxScoreUnits;
            for (var i = 0; i < this.maxScoreUnits; i++) {
                this.draw(i, 0);
                this.defaultString += '0';
                maxDistanceStr += '9';
            }

            this.maxScore = parseInt(maxDistanceStr);
        },

        /**
         * Calculate the xPos in the canvas.
         * @param {number} canvasWidth
         */
        calcXPos: function (canvasWidth) {
            this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH *
                (this.maxScoreUnits + 1));
        },

        /**
         * Draw a digit to canvas.
         * @param {number} digitPos Position of the digit.
         * @param {number} value Digit value 0-9.
         * @param {boolean} opt_highScore Whether drawing the high score.
         */
        draw: function (digitPos, value, opt_highScore) {
            var sourceWidth = DistanceMeter.dimensions.WIDTH;
            var sourceHeight = DistanceMeter.dimensions.HEIGHT;
            var sourceX = DistanceMeter.dimensions.WIDTH * value;
            var sourceY = 0;

            var targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
            var targetY = this.y;
            var targetWidth = DistanceMeter.dimensions.WIDTH;
            var targetHeight = DistanceMeter.dimensions.HEIGHT;

            // For high DPI we 2x source values.
            if (IS_HIDPI) {
                sourceWidth *= 2;
                sourceHeight *= 2;
                sourceX *= 2;
            }

            sourceX += this.spritePos.x;
            sourceY += this.spritePos.y;

            this.canvasCtx.save();

            if (opt_highScore) {
                // Left of the current score.
                var highScoreX = this.x - (this.maxScoreUnits * 4) *
                    DistanceMeter.dimensions.WIDTH;
                this.canvasCtx.translate(highScoreX, this.y);
            } else {
                this.canvasCtx.translate(this.x, this.y);
            }

            this.canvasCtx.drawImage(this.image, sourceX, sourceY,
                sourceWidth, sourceHeight,
                targetX, targetY,
                targetWidth, targetHeight
            );

            this.canvasCtx.restore();
        },

        /**
         * Covert pixel distance to a 'real' distance.
         * @param {number} distance Pixel distance ran.
         * @return {number} The 'real' distance ran.
         */
        getActualDistance: function (distance) {
            return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
        },

        /**
         * Update the distance meter.
         * @param {number} distance
        * - Input
		*	1.deltaTime     ：与前一时刻的时间间隔
         * @return {boolean} Whether the acheivement sound fx should be played.
         */
        update: function (deltaTime, distance) {
            var paint = true;
            var playSound = false;

            if (!this.acheivement) {
                distance = this.getActualDistance(distance);
                // Score has gone beyond the initial digit count.
                if (distance > this.maxScore && this.maxScoreUnits ==
                    this.config.MAX_DISTANCE_UNITS) {
                    this.maxScoreUnits++;
                    this.maxScore = parseInt(this.maxScore + '9');
                } else {
                    this.distance = 0;
                }

                if (distance > 0) {
                    // Acheivement unlocked
                    if (distance % this.config.ACHIEVEMENT_DISTANCE == 0) {
                        // Flash score and play sound.
                        this.acheivement = true;
                        this.flashTimer = 0;
                        playSound = true;
                    }

                    // Create a string representation of the distance with leading 0.
                    var distanceStr = (this.defaultString +
                        distance).substr(-this.maxScoreUnits);
                    this.digits = distanceStr.split('');
                } else {
                    this.digits = this.defaultString.split('');
                }
            } else {
                // Control flashing of the score on reaching acheivement.
                if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
                    this.flashTimer += deltaTime;

                    if (this.flashTimer < this.config.FLASH_DURATION) {
                        paint = false;
                    } else if (this.flashTimer >
                        this.config.FLASH_DURATION * 2) {
                        this.flashTimer = 0;
                        this.flashIterations++;
                    }
                } else {
                    this.acheivement = false;
                    this.flashIterations = 0;
                    this.flashTimer = 0;
                }
            }

            // Draw the digits if not flashing.
            if (paint) {
                for (var i = this.digits.length - 1; i >= 0; i--) {
                    this.draw(i, parseInt(this.digits[i]));
                }
            }

            this.drawHighScore();
            return playSound;
        },

        /**
         * Draw the high score.
         */
        drawHighScore: function () {
            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = .8;
            for (var i = this.highScore.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.highScore[i], 10), true);
            }
            this.canvasCtx.restore();
        },

        /**
         * Set the highscore as a array string.
         * Position of char in the sprite: H - 10, I - 11.
         * @param {number} distance Distance ran in pixels.
         */
        setHighScore: function (distance) {
            distance = this.getActualDistance(distance);
            var highScoreStr = (this.defaultString +
                distance).substr(-this.maxScoreUnits);

            this.highScore = ['10', '11','12','13', ''].concat(highScoreStr.split(''));
        },

        /**
         * Reset the distance meter back to '00000'.
         */
        reset: function () {
            this.update(0);
            this.acheivement = false;
        }
    };

	/*******************************************************************************
	- Function    : Cloud
	- Description : 云彩-构造方法
	- Input       : 
		1.canvas         : 画布对象
		2.spritePos      ：在素材图中的基准x和y
		3.containerWidth ：
	- Parameter   ：
		1.spritePos/canvas ：同上
		2.containerWidth   ：同上
		3.xPos，yPos       : 在游戏图中的x和y
		7.remove           : 是否移除
		8.cloudGap         ：云间距（随机）
	*******************************************************************************/
    function Cloud(canvas, spritePos, containerWidth) {
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.spritePos = spritePos;
        this.containerWidth = containerWidth;
        this.xPos = containerWidth;
        this.yPos = 0;
        this.remove = false;
        this.cloudGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP,
            Cloud.config.MAX_CLOUD_GAP);

        this.init();
    };


	/*******************************************************************************
	- Function    : Cloud.config
	- Description : 云彩-常量
	- Parameter   ：
		1.WIDTH/HEIGHT       ：素材图的长高
		2.MAX_CLOUD_GAP/MIN  ：云彩间隔范围
		3.MAX_SKY_LEVEL/MIN  : 云彩高低
	*******************************************************************************/
    Cloud.config = {
        HEIGHT: 14,
        MAX_CLOUD_GAP: 400,
        MAX_SKY_LEVEL: 30,
        MIN_CLOUD_GAP: 100,
        MIN_SKY_LEVEL: 71,
        WIDTH: 46
    };
	/*******************************************************************************
	- Function    : Cloud
	- Description : 云-原型
	- SubFunction   
		1.init           ：初始化
		2.draw           ：绘制
		3.update         ：更新
		4.isVisible      ：是否可见（判断是否移出）
	*******************************************************************************/	

    Cloud.prototype = {
        /****************************************************************
		* - Function：init
		* - Description : 初始化
		* - Parameter        
		* 	yPos        ：第一个云彩高度
		* - UsedFunction
		*	draw        ：绘制第一个云彩
		****************************************************************/
        init: function () {
            this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL,
                Cloud.config.MIN_SKY_LEVEL);
            this.draw();
        },

        /****************************************************************
		* - Function：draw
		* - Description : 绘制
		* - Parameter        
		*	1.canvasCtx      : 画笔
		*	2.spritePos      ：在素材图中的基准x和y
		****************************************************************/
        draw: function () {
            this.canvasCtx.save();
            var sourceWidth = Cloud.config.WIDTH;
            var sourceHeight = Cloud.config.HEIGHT;

            if (IS_HIDPI) {
                sourceWidth = sourceWidth * 2;
                sourceHeight = sourceHeight * 2;
            }

            this.canvasCtx.drawImage(Runner.imageSprite, this.spritePos.x,
                this.spritePos.y,
                sourceWidth, sourceHeight,
                this.xPos, this.yPos,
                Cloud.config.WIDTH, Cloud.config.HEIGHT);

            this.canvasCtx.restore();
        },

        /****************************************************************
		* - Function：update
		* - Description : 更新
		* - Input
		*	speed       ：游戏速度
		* - Parameter
		*	1.xPos      ：在画布中的x（增量直接取自于速度）
		*	2.remove    ：标志-是否移除
		*	3.isVisible ：标志-是否在屏幕外
		****************************************************************/
        update: function (speed) {
            if (!this.remove) {
                this.xPos -= Math.ceil(speed);
                this.draw();

                // Mark as removeable if no longer in the canvas.
                if (!this.isVisible()) {
                    this.remove = true;
                }
            }
        },

        /****************************************************************
		* - Function：isVisible
		* - Description : 是否在屏幕外
		****************************************************************/
        isVisible: function () {
            return this.xPos + Cloud.config.WIDTH > 0;
        }
    };


	/*******************************************************************************
	- Function    : NightMode
	- Description : 夜晚-构造对象
	- Input       : 
		1.canvas         : 画布对象
		2.spritePos      ：在素材图中的基准x和y
		3.containerWidth ：
	- Parameter   
		1.spritePos/canvas ：同上
		2.containerWidth   ：同上
		3.canvasCtx        ：画笔
		4.xPos，yPos       : 在游戏图中的x和y
		7.currentPhase     : 当前月相
		8.opacity          ：度
		9.stars            ：用于储存星星
		10.drawStars       ：是否画星星
	*******************************************************************************/
    function NightMode(canvas, spritePos, containerWidth) {
        this.spritePos = spritePos;
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.xPos = containerWidth - 50;
        this.yPos = 30;
        this.currentPhase = 0;
        this.opacity = 0;
        this.containerWidth = containerWidth;
        this.stars = [];
        this.drawStars = false;
        this.placeStars();
    };

	/*******************************************************************************
	- Function    : NightMode.config
	- Description : 夜晚模式-常量
	- Parameter   
		1.WIDTH/HEIGHT   ：素材图的长高
		2.FADE_SPEED     ：淡入淡出速度
		3.MOON_SPEED     ：月亮移动速度
		4.NUM_STARS      ：星星数
		5.STAR_SIZE      : 星星宽度
		6.STAR_SPEED     : 星星移动速度
		7.STAR_MAX_Y     : 星星在游戏图中的最大y值
	*******************************************************************************/
    NightMode.config = {
        FADE_SPEED: 0.035,
        HEIGHT: 40,
        MOON_SPEED: 0.25,
        NUM_STARS: 3,
        STAR_SIZE: 9,
        STAR_SPEED: 0.3,
        STAR_MAX_Y: 70,
        WIDTH: 20
    };

    NightMode.phases = [140, 120, 100, 60, 40, 20, 0];
	/*******************************************************************************
	- Function    : NightMode
	- Description : 夜晚-原型
	- SubFunction   
		1.update          ：更新
		2.updateXPos      ：更新x位置
		3.
	*******************************************************************************/	
    NightMode.prototype = {
        /****************************************************************
		* - Function：update
		* - Description : 更新
		* - Input       
		*	1.activated     : 标志-是否激活游戏
		*	2.delta         ：在素材图中的基准x和y
		* 	
		****************************************************************/
        update: function (activated, delta) {
            // 控制月相（换图，通过数组对应的基坐标）
            if (activated && this.opacity == 0) {
                this.currentPhase++;

                if (this.currentPhase >= NightMode.phases.length) {
                    this.currentPhase = 0;
                }
            }

            // 淡入 / 淡出.
            if (activated && (this.opacity < 1 || this.opacity == 0)) {
                this.opacity += NightMode.config.FADE_SPEED;
            } else if (this.opacity > 0) {
                this.opacity -= NightMode.config.FADE_SPEED;
            }
            
            if (this.opacity > 0) {
				// 月移动
                this.xPos = this.updateXPos(this.xPos, NightMode.config.MOON_SPEED);

                // 星移动
                if (this.drawStars) {
                    for (var i = 0; i < NightMode.config.NUM_STARS; i++) {
                        this.stars[i].x = this.updateXPos(this.stars[i].x,
                            NightMode.config.STAR_SPEED);
                    }
                }
                this.draw();
            } else {
                this.opacity = 0;
                this.placeStars();
            }
			//表示已经画了星星
            this.drawStars = true;
        },
		/****************************************************************
		* - Function：updateXPos
		* - Description : 更新x位置（以月亮为准）
		* - Input       
		*	1.currentPos    : 当前位置
		*	2.speed         ：更新速度
		* - Output
		*	1.currentPos    ：更新后位置
		****************************************************************/
        updateXPos: function (currentPos, speed) {
            if (currentPos < -NightMode.config.WIDTH) {
                currentPos = this.containerWidth;
            } else {
                currentPos -= speed;
            }
            return currentPos;
        },
		/****************************************************************
		* - Function：draw
		* - Description : 绘制
		* - Parameter   
		*	1.moonSourceWidth ：月在素材图中的长度（currentPhase=3时，为圆月，长度二倍）
		*	2.moonSourceHeight：月在素材图中的宽度
		*	3.moonSourceX     ：素材图的x
		*	4.moonOutputWidth ：在背景图中的宽度
		****************************************************************/
        draw: function () {
            var moonSourceWidth = this.currentPhase == 3 ? NightMode.config.WIDTH * 2 :
                NightMode.config.WIDTH;
            var moonSourceHeight = NightMode.config.HEIGHT;
            var moonSourceX = this.spritePos.x + NightMode.phases[this.currentPhase];
            var moonOutputWidth = moonSourceWidth;
            var starSize = NightMode.config.STAR_SIZE;
            var starSourceX = Runner.spriteDefinition.LDPI.STAR.x;

            if (IS_HIDPI) {
                moonSourceWidth *= 2;
                moonSourceHeight *= 2;
                moonSourceX = this.spritePos.x +
                    (NightMode.phases[this.currentPhase] * 2);
                starSize *= 2;
                starSourceX = Runner.spriteDefinition.HDPI.STAR.x;
            }

            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = this.opacity;

            // Stars.
            if (this.drawStars) {
                for (var i = 0; i < NightMode.config.NUM_STARS; i++) {
                    this.canvasCtx.drawImage(Runner.imageSprite,
                        starSourceX, this.stars[i].sourceY, starSize, starSize,
                        Math.round(this.stars[i].x), this.stars[i].y,
                        NightMode.config.STAR_SIZE, NightMode.config.STAR_SIZE);
                }
            }

            // Moon.
            this.canvasCtx.drawImage(Runner.imageSprite, moonSourceX,
                this.spritePos.y, moonSourceWidth, moonSourceHeight,
                Math.round(this.xPos), this.yPos,
                moonOutputWidth, NightMode.config.HEIGHT);

            this.canvasCtx.globalAlpha = 1;
            this.canvasCtx.restore();
        },
		/****************************************************************
		* - Function：placeStars
		* - Description : 确定星星位置
		* - Parameter   
		*	1.segmentSize     ：每部分长度（将画布分成几部分）
		*	2.stars           ：星星数组
		****************************************************************/
        placeStars: function () {
            var segmentSize = Math.round(this.containerWidth /
                NightMode.config.NUM_STARS);

            for (var i = 0; i < NightMode.config.NUM_STARS; i++) {
                this.stars[i] = {};
                this.stars[i].x = getRandomNum(segmentSize * i, segmentSize * (i + 1));
                this.stars[i].y = getRandomNum(0, NightMode.config.STAR_MAX_Y);

                if (IS_HIDPI) {
                    this.stars[i].sourceY = Runner.spriteDefinition.HDPI.STAR.y +
                        NightMode.config.STAR_SIZE * 2 * i;
                } else {
                    this.stars[i].sourceY = Runner.spriteDefinition.LDPI.STAR.y +
                        NightMode.config.STAR_SIZE * i;
                }
            }
        },
		/****************************************************************
		* - Function：placeStars
		* - Description : 重置
		* - Parameter   
		*	1.currentPhase     ：当前月相
		*	2.opacity          ：月亮透明度
		****************************************************************/
        reset: function () {
            this.currentPhase = 0;
            this.opacity = 0;
            this.update(false);
        }

    };


    //******************************************************************************

	/*******************************************************************************
	- Function    : HorizonLine
	- Description : 地平线类
	- Input       : 
		1.canvas    : 画布对象
		2.spritePos ：在素材图中的基准x和y
	- Parameter   ：
		1.spritePos/canvas ：同上
		2.canvasCtx        ：画笔对象（2d）
		3.dimensions       ：素材图中地平线的初始长高
		4.sourceDimensions ：素材图中地平线的使用长高
		5.sourceXPos       ：素材图中所要的地平线的x
		6.xPos，yPos       : 在游戏图中的x和y
		7.bumpThreshold    : 随机地形系数
	*******************************************************************************/
    function HorizonLine(canvas, spritePos) {
        this.spritePos = spritePos;
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.sourceDimensions = {};
        this.dimensions = HorizonLine.dimensions;
		
        this.sourceXPos = [this.spritePos.x, this.spritePos.x +
            this.dimensions.WIDTH];
        this.xPos = [];
        this.yPos = 0;
		//随机地形系数
        this.bumpThreshold = 0.5;
		//初始化地面资源
        this.setSourceDimensions();
        this.draw();
    };


	/*******************************************************************************
	- Function    : HorizonLine.dimensions
	- Description : 地平线所用常量
	- Parameter   ：
		1.WIDTH/HEIGHT  ：素材图的长高
		2.YPOS          ：在画布中的y
	*******************************************************************************/	
    HorizonLine.dimensions = {
        WIDTH: 600,
        HEIGHT: 12,
		//地面在图中位置，越大也向下
        YPOS: 127
    };
	/*******************************************************************************
	- Function    : HorizonLine.dimensions
	- Description : 地平线-原型
	- SubFunction   
		1.setSourceDimensions  ：初始化各个参数
		2.getRandomType        ：得到随机地形（两种）
		3.draw                 ：绘制（两个）
		4.updateXPos           ：更新x位置
	*******************************************************************************/	

    HorizonLine.prototype = {
        /**
         * Set the source dimensions of the horizon line.
         */
        setSourceDimensions: function () {

            for (var dimension in HorizonLine.dimensions) {
                if (IS_HIDPI) {
                    if (dimension != 'YPOS') {
                        this.sourceDimensions[dimension] =
                            HorizonLine.dimensions[dimension] * 2;
                    }
                } else {
                    this.sourceDimensions[dimension] =
                        HorizonLine.dimensions[dimension];
                }
                this.dimensions[dimension] = HorizonLine.dimensions[dimension];
            }

            this.xPos = [0, HorizonLine.dimensions.WIDTH];
            this.yPos = HorizonLine.dimensions.YPOS;
        },

		/****************************************************************
		* - Function    ： getRandomType
		* - Description ： 随机地形
		****************************************************************/
        getRandomType: function () {
            return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
        },

		/****************************************************************
		* - Function    ： draw
		* - Description ： 绘制两端地形，一个在画面里，一个在画面外
		* - Parameter   
		* 	1.Runner.imageSprite       : 原图
		* 	2.sourceXPos/spritePos.y   : 素材图中的x和y
		* 	3.sourceDimensions         : 素材图中的长高
		* 	4.xPos/yPos                : 游戏图中的x和y
		* 	5.dimensions               ：实际在游戏图中的长高（高画质会缩放）
		* 	
		****************************************************************/
        draw: function () {
            this.canvasCtx.drawImage(Runner.imageSprite, this.sourceXPos[0],
                this.spritePos.y,
                this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
                this.xPos[0], this.yPos,
                this.dimensions.WIDTH, this.dimensions.HEIGHT);

            this.canvasCtx.drawImage(Runner.imageSprite, this.sourceXPos[1],
                this.spritePos.y,
                this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
                this.xPos[1], this.yPos,
                this.dimensions.WIDTH, this.dimensions.HEIGHT);
        },

		/****************************************************************
		* - Function：updateXPos
		* - Description : 负责图像移动
		* - Input        
		* 	1.pos       ：当前图，在sourceXPos的第几个位置
		* 	2.increment ：增量
		* - Parameter   
		* 	1.line1     ：前一图
		*	2.line2     ：后一图
		****************************************************************/
        updateXPos: function (pos, increment) {
            var line1 = pos;
            var line2 = pos == 0 ? 1 : 0;

            this.xPos[line1] -= increment;
            this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;

            if (this.xPos[line1] <= -this.dimensions.WIDTH) {
                this.xPos[line1] += this.dimensions.WIDTH * 2;
                this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
                this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
            }
        },

		/****************************************************************
		* - Function：update
		* - Description : 负责控制更新频率（increment），并绘制
		* - Input        
		* 	1.deltaTime ：与前一时刻的时间间隔
		* 	2.speed     ：刷新速度
		****************************************************************/
        update: function (deltaTime, speed) {
            var increment = Math.floor(speed * (FPS / 1000) * deltaTime);

            if (this.xPos[0] <= 0) {
                this.updateXPos(0, increment);
            } else {
                this.updateXPos(1, increment);
            }
            this.draw();
        },
	
		/****************************************************************
		* - Function：reset
		* - Description : 重置
		* 
		****************************************************************/
        reset: function () {
            this.xPos[0] = 0;
            this.xPos[1] = HorizonLine.dimensions.WIDTH;
        }
    };


    //******************************************************************************

    /**
     * Horizon background class.
     * @param {HTMLCanvasElement} canvas
     * @param {Object} spritePos Sprite positioning.
     * @param {Object} dimensions Canvas dimensions.
     * @param {number} gapCoefficient
     * @constructor
     */
    function Horizon(canvas, spritePos, dimensions, gapCoefficient) {
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.config = Horizon.config;
        this.dimensions = dimensions;
        this.gapCoefficient = gapCoefficient;
        this.obstacles = [];
        this.obstacleHistory = [];
        this.horizonOffsets = [0, 0];
        this.cloudFrequency = this.config.CLOUD_FREQUENCY;
        this.spritePos = spritePos;
        this.nightMode = null;

        // Cloud
        this.clouds = [];
        this.cloudSpeed = this.config.BG_CLOUD_SPEED;

        // Horizon
        this.horizonLine = null;
        this.init();
    };


    /**
     * Horizon config.
     * @enum {number}
     */
    Horizon.config = {
        BG_CLOUD_SPEED: 0.2,
        BUMPY_THRESHOLD: .3,
        CLOUD_FREQUENCY: .5,
        HORIZON_HEIGHT: 16,
        MAX_CLOUDS: 6
    };


    Horizon.prototype = {
        /**
         * Initialise the horizon. Just add the line and a cloud. No obstacles.
         */
        init: function () {
            this.addCloud();
            this.horizonLine = new HorizonLine(this.canvas, this.spritePos.HORIZON);
            this.nightMode = new NightMode(this.canvas, this.spritePos.MOON,
                this.dimensions.WIDTH);
        },
		
		/*
		* - Input
		*	1.deltaTime     ：与前一时刻的时间间隔
         * @param {number} deltaTime
         * @param {number} currentSpeed
         * @param {boolean} updateObstacles Used as an override to prevent
         *     the obstacles from being updated / added. This happens in the
         *     ease in section.
         * @param {boolean} showNightMode Night mode activated.
         */
        update: function (deltaTime, currentSpeed, updateObstacles, showNightMode) {
            this.runningTime += deltaTime;
            this.horizonLine.update(deltaTime, currentSpeed);
            this.nightMode.update(showNightMode);
            this.updateClouds(deltaTime, currentSpeed);

            if (updateObstacles) {
                this.updateObstacles(deltaTime, currentSpeed);
            }
        },

        /**
         * Update the cloud positions.
         * @param {number} deltaTime
         * @param {number} currentSpeed
         */
        updateClouds: function (deltaTime, speed) {
            var cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
            var numClouds = this.clouds.length;

            if (numClouds) {
                for (var i = numClouds - 1; i >= 0; i--) {
                    this.clouds[i].update(cloudSpeed);
                }

                var lastCloud = this.clouds[numClouds - 1];

                // Check for adding a new cloud.
                if (numClouds < this.config.MAX_CLOUDS &&
                    (this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
                    this.cloudFrequency > Math.random()) {
                    this.addCloud();
                }

                // Remove expired clouds.
                this.clouds = this.clouds.filter(function (obj) {
                    return !obj.remove;
                });
            } else {
                this.addCloud();
            }
        },

        /**
         * Update the obstacle positions.
         * @param {number} deltaTime
         * @param {number} currentSpeed
         */
        updateObstacles: function (deltaTime, currentSpeed) {
            // Obstacles, move to Horizon layer.
            var updatedObstacles = this.obstacles.slice(0);

            for (var i = 0; i < this.obstacles.length; i++) {
                var obstacle = this.obstacles[i];
                obstacle.update(deltaTime, currentSpeed);

                // Clean up existing obstacles.
                if (obstacle.remove) {
                    updatedObstacles.shift();
                }
            }
            this.obstacles = updatedObstacles;

            if (this.obstacles.length > 0) {
                var lastObstacle = this.obstacles[this.obstacles.length - 1];

                if (lastObstacle && !lastObstacle.followingObstacleCreated &&
                    lastObstacle.isVisible() &&
                    (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
                    this.dimensions.WIDTH) {
                    this.addNewObstacle(currentSpeed);
                    lastObstacle.followingObstacleCreated = true;
                }
            } else {
                // Create new obstacles.
                this.addNewObstacle(currentSpeed);
            }
        },

        removeFirstObstacle: function () {
            this.obstacles.shift();
        },

        /**
         * Add a new obstacle.
         * @param {number} currentSpeed
         */
        addNewObstacle: function (currentSpeed) {
            var obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
            var obstacleType = Obstacle.types[obstacleTypeIndex];

            // Check for multiples of the same type of obstacle.
            // Also check obstacle is available at current speed.
            if (this.duplicateObstacleCheck(obstacleType.type) ||
                currentSpeed < obstacleType.minSpeed) {
                this.addNewObstacle(currentSpeed);
            } else {
                var obstacleSpritePos = this.spritePos[obstacleType.type];

                this.obstacles.push(new Obstacle(this.canvasCtx, obstacleType,
                    obstacleSpritePos, this.dimensions,
                    this.gapCoefficient, currentSpeed, obstacleType.width));

                this.obstacleHistory.unshift(obstacleType.type);

                if (this.obstacleHistory.length > 1) {
                    this.obstacleHistory.splice(Runner.config.MAX_OBSTACLE_DUPLICATION);
                }
            }
        },

        /**
         * Returns whether the previous two obstacles are the same as the next one.
         * Maximum duplication is set in config value MAX_OBSTACLE_DUPLICATION.
         * @return {boolean}
         */
        duplicateObstacleCheck: function (nextObstacleType) {
            var duplicateCount = 0;

            for (var i = 0; i < this.obstacleHistory.length; i++) {
                duplicateCount = this.obstacleHistory[i] == nextObstacleType ?
                    duplicateCount + 1 : 0;
            }
            return duplicateCount >= Runner.config.MAX_OBSTACLE_DUPLICATION;
        },

        /**
         * Reset the horizon layer.
         * Remove existing obstacles and reposition the horizon line.
         */
        reset: function () {
            this.obstacles = [];
            this.horizonLine.reset();
            this.nightMode.reset();
        },

        /**
         * Update the canvas width and scaling.
         * @param {number} width Canvas width.
         * @param {number} height Canvas height.
         */
        resize: function (width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
        },

        /**
         * Add a new cloud to the horizon.
         */
        addCloud: function () {
            this.clouds.push(new Cloud(this.canvas, this.spritePos.CLOUD,
                this.dimensions.WIDTH));
        }
    };
})();


function onDocumentLoad() {
    new Runner('.interstitial-wrapper');
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
