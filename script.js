var circle = {
	centerX: null,
	centerY: null,
	radius: null
};

function Point(x, y, theta) {
	this.x = x;
	this.y = y;
	this.theta = theta;
}

Point.prototype.getX = function() {
	return (this.x + circle.centerX);
};
Point.prototype.getY = function() {
	return (circle.centerY - this.y);
}
Point.prototype.getTheta = function() {
	return (this.theta * 180)/Math.PI;
}

function log(message) {
	$('#log').html(message);
}

function getRandom(start, end) {
	var range = end - start;
	return ((Math.random() * range) + start);
}

var simulation = {
	status: {
		is_running: false,
		positions: null,
		end_iteration: null,
		config: {
			num_robots: null,
			max_iterations: null,
			delay: null,
			type: null
		},
		faultyRobot: null
	},

	step: (2*Math.PI)/1000,

	iteration: {
		num: -1,
		activated: null,
		next: null
	},

	parameters: {
			num_robots: null,
			max_iterations: null,
			delay: null,
			type: null,
			button: null
		},

	canvas: null,
	context: null,

	statusDivision: {
		iteration_num: null,
		simulation_stat: null,
		robot_num: null,
		robots: null,
		activated: null
	},

	stopSimulation: function() {
		if(!this.status.is_running)
			return;

		this.clearCanvas();
		this.iteration.num = -1;
		this.iteration.activated = null;

		if(this.iteration.next != null)
			clearTimeout(this.iteration.next);
		this.status.positions = null;
		this.status.faultyRobot = null;
		this.status.config.delay = null;
		this.status.config.max_iterations = null;
		this.status.config.num_robots = null;
		this.status.config.type = null;
		this.status.end_iteration = null;

		this.status.is_running = false;

		this.showStatus();

		log("Simulation stopped!");
		setTimeout(function() { log(""); }, 2000);
	},

	setParameters: function() {
		this.status.is_running = true;

		this.status.config.delay = (this.parameters.delay.val() == "1");
		this.status.config.max_iterations = parseInt(this.parameters.max_iterations.val());
		this.status.config.num_robots = parseInt(this.parameters.num_robots.val());
		this.status.config.type = (this.parameters.type.val() == "1");
	},

	drawPoint: function(x, y, color) {
		if(!color)
			color = 'red';
		else
			color = '#00008b';

		var ctx = this.context;
		ctx.beginPath();
		ctx.arc(x, y, 5, 0, 2 * Math.PI, true);
		ctx.fillStyle = color;
		ctx.fill();
	},

	drawCircle: function() {
		var ctx = this.context;

		ctx.beginPath();
		ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'black';
		ctx.stroke();
	},

	clearCanvas: function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},

	drawAxis: function() {
		var ctx = this.context,
			cv = this.canvas;

		ctx.beginPath();
		ctx.moveTo(circle.centerX, 0);
		ctx.lineTo(circle.centerX, cv.height);
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(0, circle.centerY);
		ctx.lineTo(cv.width, circle.centerY);
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.stroke();
	},

	drawRobots: function() {
		var pos = this.status.positions,
			num = this.status.config.num_robots;

		for(var i = 0; i<num; i++) {
			this.drawPoint(pos[i].getX(), pos[i].getY(), false);
		}

		if(this.status.faultyRobot != null) {
			this.drawPoint(pos[this.status.faultyRobot].getX(), pos[this.status.faultyRobot].getY(), true);
		}
	},

	drawConnectingLines: function() {
		var ctx = this.context,
			num = this.status.config.num_robots;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.moveTo(this.status.positions[0].getX(), this.status.positions[0].getY());
		for(var i=1; i<num; i++) {
			ctx.lineTo(this.status.positions[i].getX(), this.status.positions[i].getY());
		}
		ctx.lineTo(this.status.positions[0].getX(), this.status.positions[0].getY());
		ctx.stroke();
	},

	drawCanvas: function() {
		this.clearCanvas();

		this.drawAxis();
		this.drawCircle();
		this.drawRobots();
		this.drawConnectingLines();
	},

	generateRandomPoints: function() {
		this.status.positions = Array();

		var p,
			x, y,
			num = this.status.config.num_robots,
			range = (2*Math.PI)/num, current = 0,
			theta;
		for(var i=0; i<num; i++) {
			theta = getRandom(current, current+range);
			x = Math.cos(theta) * circle.radius;
			y = Math.sin(theta) * circle.radius;

			p = new Point(x, y, theta);
			this.status.positions.push(p);

			current = current+range;
		}
	},

	getActivatedRobots: function() {
		var num = this.status.config.num_robots;
		var robos = Array();
		if(this.status.config.type) {
			for(var i =0; i<num; i++) {
				if(getRandom(0,1) <= 0.5)
					continue;
				else {
					robos.push(i);
				}
			}
		} else {
			for(var i =0; i<num; i++) {
				if(getRandom(0,1) <= 0.5)
					continue;
				else {
					if(i != this.status.faultyRobot)
						robos.push(i);
				}
			}
		}

		return robos;
	},

	calcNewPos_2: function(rob) {
		var toReturn = {
			robot: rob,
			newTheta: this.status.positions[rob].theta
		};
		var nextRob = (rob + 1)%this.status.config.num_robots,
			diff, toCheck = (2 * Math.PI)/this.status.config.num_robots,
			clockwise;

		if(nextRob > rob) {
			diff = this.status.positions[nextRob].theta - this.status.positions[rob].theta - toCheck;
		} else {
			diff = (2*Math.PI) + this.status.positions[nextRob].theta - this.status.positions[rob].theta - toCheck;
		}

		if(diff < 0 && diff < -0.0001) {
			toReturn.newTheta = this.status.positions[rob].theta - Math.min(-1*diff, this.step);
		} else if(diff > 0.0001){
			toReturn.newTheta = this.status.positions[rob].theta + Math.min(diff, this.step);
		}

		if(toReturn.newTheta < 0) {
			toReturn.newTheta += 2*Math.PI;
		}

		return toReturn;
	},

	calcNewPos_1: function(rob) {
		var toReturn = {
			robot: rob,
			newTheta: this.status.positions[rob].theta
		};
		var num = this.status.config.num_robots,
			nextRob = (rob+1)%num,
			prevRob = (rob + num - 1)%num,
			nextTheta = this.status.positions[nextRob].theta <= Math.PI ? this.status.positions[nextRob].theta : this.status.positions[nextRob].theta - (2*Math.PI),
			prevTheta = this.status.positions[prevRob].theta <= Math.PI ? this.status.positions[prevRob].theta : this.status.positions[prevRob].theta - (2*Math.PI),
			currentTheta = toReturn.newTheta <= Math.PI ? toReturn.newTheta : toReturn.newTheta - (2*Math.PI);

		if(prevTheta*nextTheta > 0) {
			var avgTheta = (nextTheta + prevTheta)/ 2;
			if(avgTheta > currentTheta) {
				var diff = avgTheta - currentTheta;
				if(diff > 0.00005) {
					toReturn.newTheta = toReturn.newTheta + Math.min(diff, this.step);
				}
			}
		} else {
			if(prevTheta > 0) {
				nextTheta = (2*Math.PI) + nextTheta;
				var avgTheta = (nextTheta + prevTheta)/ 2;
				if(currentTheta < 0)
					currentTheta = (2*Math.PI) + currentTheta;

				if(avgTheta > currentTheta) {
					var diff = avgTheta - currentTheta;
					if(diff > 0.00005) {
						toReturn.newTheta = toReturn.newTheta + Math.min(diff, this.step);
					}
				}
			} else {
				var avgTheta = (nextTheta - prevTheta)/2;
				var diff = (nextTheta - currentTheta);

				if(avgTheta < diff) {
					diff = diff - avgTheta;

					if(diff > 0.00005) {
						toReturn.newTheta = toReturn.newTheta + Math.min(diff, this.step);
					}
				}
			}
		}

		return toReturn;
	},

	checkAngularCloseness: function(angle1, angle2) {
		if(Math.abs((angle1 - angle2)) < 0.0002) {
//			console.log("Difference is very less");
			return true;
		} else {
//			if(this.iteration.num > 300) {
////				console.log(angle1.toPrecision(7) + ", " + angle2.toPrecision(7));
//			}
			return false;
		}
	},

	checkStable: function() {
		var correctDiff = (2*Math.PI)/this.status.config.num_robots,
			diff, num = this.status.config.num_robots;

		for(var i=1; i<num; i++) {
			diff = this.status.positions[i].theta - this.status.positions[i-1].theta;
			if(!this.checkAngularCloseness(correctDiff, diff)) {
//				console.log("still not stable!");
				return false;
			}
		}

		return true;
	},

	nextIteration: function() {
		this.iteration.num++;
		this.iteration.activated = this.getActivatedRobots();

		this.showStatus();
		if(this.status.config.type) {
			for(var i in this.iteration.activated) {
				this.iteration.activated[i] = this.calcNewPos_1(this.iteration.activated[i]);
			}
		} else {
			for(var i in this.iteration.activated) {
				this.iteration.activated[i] = this.calcNewPos_2(this.iteration.activated[i]);
			}
		}

		var rob, newTheta, p, x, y;
		for(var i in this.iteration.activated) {
			rob = this.iteration.activated[i].robot;
			newTheta = this.iteration.activated[i].newTheta;

			x = Math.cos(newTheta) * circle.radius;
			y = Math.sin(newTheta) * circle.radius;

			p = new Point(x, y, newTheta);
			this.status.positions[rob] = p;
		}
		this.drawCanvas();

		if(this.iteration.num < this.status.config.max_iterations) {
			if(this.checkStable()) {
				if(this.status.end_iteration == null)
					this.status.end_iteration = this.iteration.num;
				log("Simulation ended." + this.status.end_iteration);
//				return;
			}
			this.iteration.next = setTimeout(function() {
				simulation.nextIteration(); }, this.status.config.delay ? 1000 : 300);
		}
	},

	startIterating: function() {
		this.nextIteration();
	},

	showStatus: function() {
		var stat = this.statusDivision;

		stat.iteration_num.html(this.iteration.num);
		if(this.status.is_running) {
			stat.simulation_stat.html("Started");
			stat.robot_num.html(this.status.config.num_robots);

			var pos = this.status.positions,
				num = this.status.config.num_robots,
				str = "";
			for(var i = 0; i<num; i++) {
				str += "<li>" + (i+1) + ": (" + pos[i].x.toPrecision(5) + ", " + pos[i].y.toPrecision(5) + ", " + pos[i].getTheta().toPrecision(5) +")</li>";
			}
			stat.robots.html(str);

			if(this.iteration.activated != null) {
				str = "";
				var rob;
				for(var i in this.iteration.activated) {
					rob = this.iteration.activated[i];

					str += "<li>" + (rob+1) + ": (" + pos[rob].x.toPrecision(5) + ", " + pos[rob].y.toPrecision(5) + ", " + pos[rob].getTheta().toPrecision(5) +")</li>";
				}
				stat.activated.html(str);
			}
		} else {
			stat.simulation_stat.html("Stopped");
			stat.robot_num.html("");
			stat.robots.html("");
			stat.activated.html("");
		}
	},

	startSimulation: function() {
		log("Starting Simulation");

		this.setParameters();
		if(!this.status.config.type) {
			/* Faulty robot situation */
			this.status.faultyRobot = Math.floor(getRandom(0, this.status.config.num_robots));
		} else {
			this.status.faultyRobot = null;
		}

		if(this.status.config.num_robots < 3 && this.status.config.type) {
			log("Simulation cannot start for n < 3");
			setTimeout(function() { this.stopSimulation(); }, 1000);
			return;
		} else if(this.status.config.num_robots < 2 && !this.status.config.type) {
			log("Simulation cannot start for n < 2");
			setTimeout(function() { this.stopSimulation(); }, 1000);
			return;
		}

		log("Generating random points");
		this.generateRandomPoints();
		log("Points generated");

		log("Simulation started");
		this.drawCanvas();
		this.showStatus();
		setTimeout(function() { log(""); }, 2000);
		this.startIterating();
	},

	clickHandler: function() {
		if(this.status.is_running) {
			this.stopSimulation();
			this.parameters.button.html("Start Simulation");
		} else {
			this.startSimulation();
			this.parameters.button.html("Stop Simulation");
		}
	},

	init: function() {
		/* canvas settings */
		this.canvas = document.getElementById('simulation_canvas');
		this.context = this.canvas.getContext('2d');

		/* status Divisions */
		this.statusDivision.iteration_num = $('#iteration_number');
		this.statusDivision.simulation_stat = $('#simulation_run_status');
		this.statusDivision.robot_num = $('#robo_num');
		this.statusDivision.robots = $('#robots_status').children('.status').first();
		this.statusDivision.activated = $('#activated_robots').children('.status').first();

		/* parameters */
		this.parameters.delay = $('#iter_delay');
		this.parameters.max_iterations = $('#total_iters');
		this.parameters.num_robots = $('#robo_num_para');
		this.parameters.type = $('#simul_type');
		this.parameters.button = $('#simulation_button');

		/* circle parameters */
		circle.centerX = this.canvas.width/2;
		circle.centerY = this.canvas.height/2;
		circle.radius = Math.min(circle.centerX, circle.centerY) - 10;

		/* eventHandler on button */
		this.parameters.button.click(function(e) {
			simulation.clickHandler();
		});
	}
};

$(document).ready(function() {
	simulation.init();
});