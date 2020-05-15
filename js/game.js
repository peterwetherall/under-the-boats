//Global object
let g = {
	playing: false,
	debug: false
};

$(document).ready(() => {
	//Setup canvas
	g.canvas = document.getElementsByTagName("canvas")[0];
	resize();
	g.ctx = g.canvas.getContext("2d");
	animate();
	//Wait for login
	$("article input").keypress((e) => {
		if (e.keyCode === 13) {
			login();
		}
	});
	$("#lets-swim").click(login);
});
window.onresize = function(event) {
    resize();
};
//On resize function
function resize () {
	g.canvas.width = window.innerWidth;
	g.canvas.height = window.innerHeight;
	g.scale = g.canvas.width / Math.round(g.canvas.width / 50);
	g.mouse = {
		x: 0,
		y: 0
	};
	document.onmousemove = function (e) {
		g.mouse.x = e.pageX;
		g.mouse.y = e.pageY;
	}
	g.tileCount = {
		x: Math.round(g.canvas.width / 50),
		y: Math.ceil(g.canvas.height / g.scale),
	};
	g.tileCount.xE = Math.ceil(g.tileCount.x / 2);
	g.tileCount.yE = Math.ceil(g.tileCount.y / 2);
	g.tileCount.mD = Math.sqrt(Math.pow(g.tileCount.xE, 2) + Math.pow(g.tileCount.yE, 2));
}

//Setup function
function setup () {
	$("#username").html(g.username);
	$("#monster").animate({opacity: "1"}, 1000);
	$("#right-ui").animate({right: "10px"}, 1000);
	$("article").animate({top: "-100%"}, 1000, () => {
		$(document).click((e) => {
			if (me.boost === -1) {
				$("#boost-bar").css("background", "rgba(0, 255, 0, 0.5)");
				me.boost = 180;
				me.speed = 0.3;
			}
		});
		g.playing = true;
	});
}

//Login function
function login () {
	g.username = $("article input").val();
	setup();
}

let me = {
	x: Math.floor(Math.random() * 500),
	y: Math.floor(Math.random() * 500),
	degrees: null,
	speed: 0.1,
	boost: -1
};

me.move = function () {
	//Get distances between mouse and centre
	let dists = {
		x: Math.abs(g.canvas.width / 2 - g.mouse.x),
		y: Math.abs(g.canvas.height / 2 - g.mouse.y)
	};
	//Calc x/x+y ratio
	let ratio = dists.x / (dists.x + dists.y);
	let change = {
		x: this.speed * ratio,
		y: this.speed * (1 - ratio)
	}
	if (g.mouse.x >= g.canvas.width / 2) {
		this.x += change.x;
	} else {
		this.x -= change.x;
	}
	if (g.mouse.y >= g.canvas.height / 2) {
		this.y += change.y;
	} else {
		this.y -= change.y;
	}
	//Round both co-ords to two decimal places
	this.x = Math.round(this.x * 100) / 100;
	this.y = Math.round(this.y * 100) / 100;
	//Limit edges of map
	this.x = this.x < 0 ? 0 : this.x;
	this.y = this.y < 0 ? 0 : this.y;
	this.x = this.x > 499.99 ? 499.99 : this.x;
	this.y = this.y > 499.99 ? 499.99 : this.y;
	//Decrease boost cooldown if neccessary
	if (this.boost > -1) {
		if (this.boost === 0) {
			$("#boost-bar").css("background", "rgba(0, 255, 0, 1)");
		}
		this.boost--;
		$("#boost-bar").css("width", ((180 - this.boost) * 155) / 180 + "px");
		if (this.boost > 120) {
			this.speed -= 1 / 300;
		}
	}
	//Calculate head hitbox
	this.head = {
		x: g.canvas.width / 2 + 110 * Math.sin((this.degrees - 90) * Math.PI / 180),
		y: g.canvas.height / 2 - 110 * Math.cos((this.degrees - 90) * Math.PI / 180)
	}
	//Draw hitboxes
	if (g.debug) {
		g.ctx.beginPath();
		g.ctx.arc(this.head.x, this.head.y, 50, 0, Math.PI * 2);
		g.ctx.strokeStyle = "lime";
		g.ctx.stroke();
	}
	//Detect for collision with boat
	for (let boat of g.boats) {
		if (boat.visible) {
			if (Math.sqrt(Math.pow(this.head.x - boat.pos.accX, 2) + Math.pow(this.head.y - (boat.pos.accY + g.scale), 2)) < g.scale + 50) {
				//Head has collided with boat
				if (boat.snap === 6) {
					boat.snap = 5;
				}
			}
		}
	}
};
me.show = function () {
	//Rotate monster
	let monsterRads = Math.atan2(
		g.canvas.height / 2 - g.mouse.y,
		g.canvas.width / 2 - g.mouse.x
	);
	this.degrees = (monsterRads / Math.PI) * 180;
	$("#monster").css("transform", "rotate(" + (this.degrees - 90) + "deg)");
	//Show me on minimap
	$("#minimap div").css("left", me.x * 1.5 / 5 + "px");
	$("#minimap div").css("top", me.y * 1.5 / 5 + "px");
};

//Boat class
class Boat {
	constructor (initX, initY) {
		this.pos = {x: initX, y: initY, accX: initX, accY: initY, visible: false};
		this.direction = Math.random() < 0.5;
		//Circle offset accurate to one degree
		this.circleOffset = (Math.round(Math.random() * 360) / 360) * 2 * Math.PI;
		this.radius = 5 + Math.round(Math.random() * 15);
		this.speed = 2 + Math.round(Math.random() * 4);
		this.snap = 6;
	}
	show () {
		//Draw boat
		if (this.direction) {
			this.circleOffset += this.speed * Math.PI / 1440;
		} else {
			this.circleOffset -= this.speed * Math.PI / 1440;
		}
		//If boat is in range of player's vision (reduce lag)
		if (Math.sqrt(Math.pow(me.x - this.pos.x, 2) + Math.pow(me.y - this.pos.y, 2)) <= g.tileCount.mD + this.radius) {
			this.visible = true;
		} else {
			this.visible = false;
		}
		if (this.visible) {
			if (g.debug) {
				g.ctx.beginPath();
				g.ctx.arc(
					(this.pos.x - me.x) * g.scale + g.canvas.width / 2,
					(this.pos.y - me.y) * g.scale + g.canvas.height / 2,
					this.radius * g.scale,
					0,
					Math.PI * 2
				);
				g.ctx.lineWidth = 1;
				g.ctx.strokeStyle = "red";
				g.ctx.stroke();
			}
			this.pos.accX = ((this.pos.x - me.x) * g.scale + Math.cos(this.circleOffset) * this.radius * g.scale) + g.canvas.width / 2;
			this.pos.accY = ((this.pos.y - me.y) * g.scale + Math.sin(this.circleOffset) * this.radius * g.scale) + g.canvas.height / 2 - g.scale;
			//Draw hitbox
			if (g.debug) {
				g.ctx.beginPath();
				g.ctx.arc(this.pos.accX, this.pos.accY + g.scale, g.scale, 0, Math.PI * 2);
				g.ctx.strokeStyle = "red";
				g.ctx.lineWidth = 1;
				g.ctx.stroke();
			}
			g.ctx.save();
			g.ctx.beginPath();
			g.ctx.translate(this.pos.accX, this.pos.accY + g.scale);
			g.ctx.rotate(this.direction ? this.circleOffset + Math.PI : this.circleOffset);
			g.ctx.drawImage(
				g.boatImage,
				-g.scale / 2 * (this.snap / 6),
				-g.scale * (this.snap / 6),
				g.scale * (this.snap / 6),
				g.scale * 2 * (this.snap / 6)
			);
			if (this.snap < 6) {
				this.snap--;
				if (this.snap <= 0) {
					this.die();
				}
			}
			g.ctx.restore();
		}
	}
	die () {
		g.boats.splice(g.boats.indexOf(this), 1);
	}
}

g.boats = [];
g.boatImage = new Image();
g.boatImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAJYCAMAAADv+CsNAAAA21BMVEUAAABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLABwLACGNQCZPQCWPQGTPQOQPQVnLgmDNABhMBBsLANkLw17MABpLQZuLAGANQR0LQCBMgCCNQN+MQB5LwCTOgCKNgB3LgCHNQCNNwCQOACNOgSKOAN4+gJHAAAALXRSTlMA/Pj07wnq4Q3bJSwZEeY5HtXOUaVwZ55gV0WxMsh8xKuXShW2kbs/i8B3gocyAgtqAABVQElEQVR42uydSXPaQBCFQdJISICQWMUi9h2TyCkffMCFbZz8/5+UbhlVx0mmJ/gSCfSqXJXklHz1ZuZ1T49SyJUrV65cuXLlypUrV65cuXJlWqLqeV61kOtfWDm1RrfbmK5qTkUUcrGade/GmzAczZutlVfIxS1BZ7pe+qau66Y93k69UiGXTNVysNhYulYsFjXN7+8aubdkErNBdxJahlbc7/fFoumPd7m3ZJqVg3Woga32IPSWPR9OvXyX/6uvasFi5BZBMSyQaffvGk41x/U3X03AV/uziijNDXdTJw9df5yDtVYntLQiwULp1nLdHcxyb31cg+X2uG7E+xUJvWXW191y7q1fWVV626bvagksMpemu5tFUMvPRGLl1VpLG31FsH7Zt0aTIN+3EpWc6XBsm5pGrD54yxpN2rm3iFXf18lXv+MCWs12OS+rQaLc2I0/rsE/vVXvtHuV3Fwlp7vr+xJWCS/dDJutmnPr3qqWG3dzW84qqXxMu9nq3XahKGZO953VnhUuxXpzO71lbwnw1SLElowKFsiwx7dcVovKIFhvXEPjYFGWN+rj4c16S5SgfVV3dQ2khKWBTHt+17vROtGrtaElYyhY0R6v6aY/3zXKt9iyEdBmqLuAgFahkpZhbSYN5/bORG/V6ows8BWx4vXuLXsDLZsbC/NC1LbNuitBxZgLmxDdwU15q+SsWuPQNSSsOFqGvVwHtUrhZlT1sH1lIimGlbRQXN5QgwuiKLYZTJ1BxdEy7M2kfSv7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";
for (let i = 0; i < 250; i++) {
	g.boats.push(new Boat(
		25 + Math.round(Math.random() * 450),
		25 + Math.round(Math.random() * 450)
	));
}
g.visibleBoats = [];

//Animate function
function animate (data) {
	requestAnimationFrame(animate);
	//Clear canvas
	g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
	//Draw entire sea grid
	for (let i = -g.tileCount.xE; i <= g.tileCount.xE; i++) {
		for (let j = -g.tileCount.yE; j <= g.tileCount.yE; j++) {
			if ((me.x + i >= 0) && (me.y + j >= 0) && (me.x + i <= 500) && (me.y + j <= 500)) {
				g.ctx.lineWidth = 1;
				g.ctx.strokeStyle = "#00008b";
				g.ctx.strokeRect(
					(i - (me.x - Math.floor(me.x))) * g.scale + g.canvas.width / 2,
					(j - (me.y - Math.floor(me.y))) * g.scale + g.canvas.height / 2,
					g.scale,
					g.scale
				);
				g.ctx.fillStyle = "#1565C0";
				g.ctx.fillRect(
					(i - (me.x - Math.floor(me.x))) * g.scale + g.canvas.width / 2,
					(j - (me.y - Math.floor(me.y))) * g.scale + g.canvas.height / 2,
					g.scale,
					g.scale
				);
			}
		}
	}
	//Move me
	if (g.playing) {
		me.move();
	}
	me.show();
	//Draw all the boats
	for (let boat of g.boats) {
		boat.show();
	}
}