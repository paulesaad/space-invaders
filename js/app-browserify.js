"use strict";

// es5 polyfills, powered by es5-shim
require("es5-shim")
// es6 polyfills, powered by babel
require("babel/register")
var $ = require('jquery')
var Promise = require('es6-promise').Promise

//self invoking function to run game
;(function () {
	//constructor function for game
	var Game = function (canvasId) {
		//define canvas for new instance of game
		var canvas = document.getElementById(canvasId);
		//drawing context: bundle of functions to draw to canvas
		var screen = canvas.getContext('2d');
		var gameSize = {x: canvas.width, y: canvas.height};

		//player, invader, bullets
		this.bodies = createInvaders(this).concat(new Player(this, gameSize))

		var self = this;
		// loadSound("../../sounds/shoot.wav", function(shootSound) {
			// self.shootSount = shootSound

		//run 60 times a second (all main game logic)
			var tick = function() {
				self.update()
				self.draw(screen, gameSize);
				//browser API(aims for 60 times a second)
				requestAnimationFrame(tick);
			};

			tick()
		// })
	};

	Game.prototype = {
		//run in tick
		update: function() {
			var bodies = this.bodies;
			//filter using callback 'colliding' to see if two bodies are in contact
			var notCollidingWithAnything = function(b1){
				return bodies.filter(function(b2){
					return colliding(b1, b2);
				}).length === 0
			}
			this.bodies = this.bodies.filter(notCollidingWithAnything)

			//apply this logic to all of the bodies in the game
			for (var i=0; i< this.bodies.length; i++) {
				this.bodies[i].update()
			}
		},

		//run in tick
		draw: function(screen, gameSize) {
			//clear screen on every update to make sure that previous locations of bodies get erased when moving
			screen.clearRect(0, 0, gameSize.x, gameSize.y)
			//use callback drawRect to draw each character as a rectangle of certain size
			for (var i=0; i< this.bodies.length; i++) {
				drawRect(screen, this.bodies[i])
			}
		},

		//callback function to add new body to the game
		addBody: function(body) {
			this.bodies.push(body)
		},

		//function returning boolean, uses filter for invaders to see if one is directly above the other
		//true is there are invaders below
		invadersBelow: function(invader){
			return this.bodies.filter(function(b) {
				return b instanceof Invader &&
					b.center.y > invader.center.y &&
					b.center.x - invader.center.x < invader.size.x
			}).length > 0
		}
	};

//PLAYER----------------------------------------------------------------------------------------------------

	//constructor function for Player body
	var Player = function(game, gameSize) {
		this.game = game
		this.size = {x: 15, y: 15}
		//where player is at the moment
		this.center = { x: gameSize.x / 2, y: gameSize.y - this.size.x}
		this.keyboarder= new Keyboarder();
	}

	Player.prototype = {
		update: function () {
			//move right or left using right and left arrow
			if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
				this.center.x -= 2;
			} else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
				this.center.x += 2;
			}

			//create new instance of Bullet whenever space bar down and add it to the game
			if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
				var bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.x / 2}, 
										{x: 0, y: -6})

				this.game.addBody(bullet);
				// this.game.shootSound.load()
				// this.game.shootSound.play()
			}
		}
	}

//BULLET--------------------------------------------------------------------------------------------------

	//constructor function for Bullet body (center for which location to begin and velocity to define speed and direction of travel)
	var Bullet = function(center, velocity) {
		this.size = {x: 3, y: 3}
		this.center = center
		this.velocity = velocity
	}

	Bullet.prototype = {
		//preserve velocity throughout flight of bullet
		update: function () {
			this.center.x += this.velocity.x;
			this.center.y += this.velocity.y;
		}
	}

//INVADER------------------------------------------------------------------------------------------------

//constructor function for Invader body
var Invader = function(game, center) {
		this.game = game
		this.size = {x: 15, y: 15}
		this.center = center
		//where player is at the moment
		this.patrolX = 0;
		this.speedX = 0.3;
	}

	Invader.prototype = {
		//change direction of invaders once hit the border of canvas
		update: function () {
			if (this.patrolX<0 || this.patrolX > 40) {
				this.speedX = -this.speedX
			}

			this.center.x += this.speedX
			this.patrolX += this.speedX

			//Invaders will shoot only if the random number generator gives above 0.995 and no invaders below
			//Create new instance of bullet when true and add it to game
			if (Math.random() > 0.995 && !this.game.invadersBelow(this)) {
				var bullet = new Bullet({ x: this.center.x, y: this.center.y + this.size.x / 2}, 
										{x: Math.random() - 0.5, y: 2})

				this.game.addBody(bullet);	
			}
		}
	}

	//put invaders into the game in 3*8 formation
	var createInvaders = function(game) {
		var invaders = [];
		for(var i = 0; i < 24; i++) {
			var x = 30 + (i%8) * 30
			var y = 30 + (i%3) * 30
			invaders.push(new Invader(game, {x: x, y: y}))
		}
		return invaders
	}

//-----------------------------------------------------------------------------

	var drawRect = function (screen, body) {
		screen.fillRect(body.center.x - body.size.x / 2,
						body.center.y - body.size.y / 2, 
						body.size.x, body.size.y)
	}

	//Find key that was pressed using information from event, turn them into english
	var Keyboarder = function(){
		var keyState = {};

		window.onkeydown = function(e) {
			keyState[e.keyCode] = true;
		}

		window.onkeyup = function(e) {
			keyState[e.keyCode] = false;
		}

		this.isDown = function(keyCode) {
			return keyState[keyCode] === true
		}

		this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32 }
	}

	//callback function to return if two bodies are colliding at the moment
	var colliding = function(b1, b2) {
		return !(b1 === b2 ||
				 b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
				 b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
				 b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
				 b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2);
	}

	// var loadSound = function(url, callback) {
	// 	var loaded = function(){
	// 		callback(sound)
	// 		sound.removeEventListener('canplaythrough', loaded)
	// 	}

	// 	var sound = new Audio(url)
	// 	sound.addEventListener('canplaythrough', loaded)
	// 	sound.load()
	// }

	//bind unload callback (instatiate game when script all loaded and DOM ready with canvas)
	window.onload = function () {
		new Game("screen");
	}
})();

