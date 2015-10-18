/**
 * Created by Win 7 on 06-05-2014.
 */
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
};
Point.prototype.getTheta = function() {
	return this.theta;
};

function getRandom(start, end) {
	var range = end - start;
	return ((Math.random() * range) + start);
}

function calculateDistance(p1, p2) {
	return Math.sqrt(Math.pow(p1.getX() - p2.getX() ,2) + Math.pow(p1.getY() - p2.getY() ,2));
}

var simulation = {
	is_running: false,
	num_robots: null,
	timer: null,
	canvas: null,
	context: null,

	stepCircular: (2*Math.PI)/1000,
	step: 5,
	delay: 0.5,
	epsilon: 0.0001,

	iteration: 0,

	robots: {
		positions: null
	},
	circle: {
		centerX: null,
		centerY: null,
		radius: null
	},

	height: null,
	width: null,

	clearCanvas: function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},

	stopSimulation: function() {
		this.is_running = false;
		$('#start_sim').html("Start Simulation");
		clearTimeout(this.timer);
	},

	makeCircle: function() {
		console.log("Making circle");
		circle.centerX = this.width/2;
		circle.centerY = this.height/2;
		circle.radius = getRandom(Math.min(circle.centerX, circle.centerY) - 150, Math.min(circle.centerX, circle.centerY) - 10);
		console.log("Circle made");
	},

	generateRobots: function() {
		console.log("Generating robots");

		this.robots.positions = [];
		var p,
			x, y,
			num = this.num_robots,
			robotTheta = 2*(Math.asin(10/circle.radius)),
			range = ((2*Math.PI)/num) - robotTheta, current = 0,
			theta;

		for(var i=0; i<num; i++) {
			theta = getRandom(current, current+range);
			x = Math.cos(theta) * circle.radius;
			y = Math.sin(theta) * circle.radius;

			p = new Point(x, y, theta);
			this.robots.positions.push(p);

			current = current + range + robotTheta;
		}
		console.log("Robots generated");
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

	drawCircle: function() {
		var ctx = this.context;

		ctx.beginPath();
		ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'black';
		ctx.stroke();
	},

	drawPoint: function(x, y) {
		var color = 'red';

		var ctx = this.context;
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, 2 * Math.PI, true);
		ctx.fillStyle = color;
		ctx.fill();
	},

	drawRobots: function() {
		var pos = this.robots.positions,
			num = this.num_robots;

		for(var i=0; i<num; i++) {
			this.drawPoint(pos[i].getX(), pos[i].getY());
		}
	},

	drawCanvas: function() {
//		console.log("Drawing canvas");

		this.clearCanvas();
		this.drawAxis();
		this.drawCircle();
		this.drawRobots();

//		console.log("Canvas drawn");
	},

	areRobotsTouching: function() {
		var current, next, num = this.num_robots, rob = this.robots.positions;
		for(var i=0; i<num; i++) {
			current = i%num;
			next = (i+1)%num;

			if(Math.abs(calculateDistance(rob[current], rob[next]) - 20) <= this.epsilon)
				return true;
		}

		return false;
	},

	moveRobotsLeft: function() {
		console.log("left.");

		var robotTheta = 2*(Math.asin(10/circle.radius)),num = this.num_robots,
			bestAngle = (2*Math.PI)/num,
			current, next, distance, angle, rob = this.robots.positions;

		var newThetas = [], newAngle;

		for(var i=0; i<num; i++) {
			current = i%num; next = (i+1)%num;

			distance = calculateDistance(rob[current], rob[next]);
			angle = Math.asin(distance/(2*circle.radius)) * 2;

			if(angle > bestAngle) {
				newAngle = rob[i].getTheta() + (angle - bestAngle);
			} else {
				newAngle = rob[i].getTheta();
			}

			if(newAngle > (2*Math.PI)) {
				newAngle = newAngle - (2*Math.PI);
			}

			newThetas.push(newAngle);
		}

		for(i=0; i<num; i++) {
			rob[i].theta = newThetas[i];
			rob[i].x = Math.cos(rob[i].getTheta()) * circle.radius;
			rob[i].y = Math.sin(rob[i].getTheta()) * circle.radius;
		}
	},

	isSpaceLeft: function() {
		var robotTheta = 2*(Math.asin(10/circle.radius))*this.num_robots;

//		console.log(Math.abs(robotTheta - (2*Math.PI)));
		return !(Math.abs(robotTheta - (2*Math.PI)) <= this.epsilon);
	},

	moveRobotsInside: function() {
		console.log("inside.");

		var current, next, num = this.num_robots,
			minMoveDist = 10000, distance, rob = this.robots.positions,newRad, moveDist;
		for(var i=0; i<num; i++) {
			current = i%num;
			next = (i+1)%num;

			distance = calculateDistance(rob[current], rob[next]);
			newRad = (20 / distance) * circle.radius;
			moveDist = circle.radius - newRad;

			if(moveDist < minMoveDist)
				minMoveDist = moveDist;
		}

		moveDist = Math.min(minMoveDist, simulation.step);

		circle.radius = circle.radius - moveDist;
		for(i=0; i<num; i++) {
			rob[i].x = Math.cos(rob[i].getTheta()) * circle.radius;
			rob[i].y = Math.sin(rob[i].getTheta()) * circle.radius;
		}
	},

	nextIteration: function() {
		if(this.is_running == false)
			return;

		console.log("Next iteration.");
		this.iteration++;

		if(this.areRobotsTouching() && this.isSpaceLeft()) {
			this.moveRobotsLeft();
			this.drawCanvas();

			this.timer = setTimeout(function() {simulation.nextIteration()}, 2000);
		} else if(this.isSpaceLeft()){
			this.moveRobotsInside();
			this.drawCanvas();

			this.timer = setTimeout(function() {simulation.nextIteration()}, 500);
		} else {
			alert("Simulation ended at iteration: " + this.iteration);
		}
	},

	startIteration: function() {
		console.log("Starting iteration.");
		this.nextIteration();
	},

	startSimulation: function() {
		console.log("Starting simulation");

		this.makeCircle();

		this.generateRobots();

		this.drawCanvas();

		this.startIteration();
	},

	initializeSimulation: function() {
		if(this.is_running)
			simulation.stopSimulation();
		else {
			this.num_robots = $('#num_robots').val();
			this.iteration = 0;

			this.canvas = document.getElementById('simulation_canvas');
			this.context = this.canvas.getContext('2d');
			this.height = this.canvas.height;
			this.width = this.canvas.width;

			this.is_running = true;
			$('#start_sim').html("Stop Simulation");
			this.startSimulation();
		}
	},

	init: function() {
		$('#start_sim').on('click', function() {
			simulation.initializeSimulation();
		});
	}
};

$(document).ready(function() {
	simulation.init();
});