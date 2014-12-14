// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    };
})();



$(document).ready(function(){


    var game = new Game();


});


function Game() {
    this.debug = false;
    this.colors = [[255, 147, 204], [219, 143, 248], [164, 143, 248], [143, 183, 248], [143, 220, 248], [143, 248, 151]];
    this.colorEmpty = [254, 255, 147];
    this.canvas = document.getElementById('canvas');

    this.canvasHeight = 400;
    this.canvasWidth = 400;

    this.difficulty = 1; // easy


    this.emptyRectsCache = [];
    this.moves = 0;


    this.boxWith = 20;
    this.boxHeight = 20;

    this.rows  = this.canvasHeight / this.boxHeight;
    this.columns = this.rows;

    this.ctx = null;

    if(this.canvas && this.canvas.getContext) {
        this.ctx = this.canvas.getContext("2d");
    }

    if(!this.ctx) {
        if(this.debug) console.log("Error: ctx is not found.");
        return;
    }

    this.moveIndicator = document.getElementById('move-indicator');


    this.initControls();
    this.resetGame();
}

Game.prototype.calculateDimensions = function(difficulty) {
    var difficultyLevels = {
        "1" : 40,
        "2" : 25,
        "3" : 10
    };

    this.boxHeight = difficultyLevels[difficulty];
    this.boxWith = difficultyLevels[difficulty];

    this.rows  = this.canvasHeight / this.boxHeight;
    this.columns = this.rows;

};

Game.prototype.resetGame = function() {
    this.moves = 0;
    this.emptyRectsCache = [];
    this.calculateDimensions(this.difficulty);
    this.initialRender();
};

Game.prototype.showMoves = function(count) {

    this.moveIndicator.innerText = 'Moves: ' + count;
};

Game.prototype.initialRender = function() {

    var i, j, color, count = 0;
    // fill canvas.

    for(i = 0; i <= (this.canvasWidth - this.boxWith); i += this.boxWith) {

        for(j = 0; j <= (this.canvasHeight - this.boxHeight); j += this.boxHeight) {

            color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.ctx.fillStyle = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', 1)';
            this.ctx.fillRect(
                i,
                j,
                this.boxWith,
                this.boxHeight
            );
            count++;

        }
    }

    // make first "selected"
    this.ctx.fillStyle = this.rgba(this.colorEmpty, 1);
    this.ctx.fillRect(0, 0, this.boxWith, this.boxHeight);
    this.ctx.save();

    if(this.debug) console.log(count + " rects generated");
};

Game.prototype.cacheEmpty = function(rect) {
    this.emptyRectsCache.push(rect.join("_"));
};

Game.prototype.initControls = function() {
    var self = this;

    $(document).on("click", ".btn-color", function(e){
        if(e)
            e.preventDefault();


        var color = $(this).attr("data-color").split(",");
        self.makeTurn(color);
    });

    $(document).on("click", ".btn-reset", function(e){
        if(e)
            e.preventDefault();
        var d = $("input[name=difficulty]:checked").val();
        self.difficulty = d;
        self.resetGame();
    });
};


Game.prototype.makeTurn = function(color) {

    var i, j, rect, r, g, b, noMoreColors = true, removed;

    this.moves++;
    this.showMoves(this.moves);


    for(i = 0; i <= (this.canvasWidth - this.boxWith); i += this.boxWith) {

        for(j = 0; j <= (this.canvasHeight - this.boxHeight); j += this.boxHeight) {

            rect = this.ctx.getImageData(
                i,
                j,
                this.boxWith,
                this.boxHeight
            );

            r = rect.data[0];
            g = rect.data[1];
            b = rect.data[2];

            if(this.colorMatch(this.colorEmpty, rect.data)) {
                if(this.debug) console.log("empty block found: (" + i + ", " + j + ", " + (i+this.boxWith) + "," + (j+this.boxWith) + ")");
                removed = this.removeNeighbours([i, j, this.boxWith, this.boxHeight], color);
                if(this.debug) console.log(removed + " Neighbours removed");
            } else {
                noMoreColors = false;
            }
        }
    }


    if(noMoreColors) {
        // game over
        this.ctx.font = "25px Verdana";
        var gradient = this.ctx.createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop("0","magenta");
        gradient.addColorStop("0.5","blue");
        gradient.addColorStop("1.0","red");
        this.ctx.fillStyle = gradient;
        this.ctx.textAlign = "center";
        this.ctx.fillText("Game over\nMoves made: " + this.moves, 200, 180);

    }
};


Game.prototype.removeNeighbours = function(pos, color) {
    var i, j, removed = 0, target, targetRect, pg;

    var targets = this.generateTargets(pos);
    for(i = 0; i < targets.length; i++) {
        target = targets[i];
        targetRect = this.ctx.getImageData(
            target[0],
            target[1],
            target[2],
            target[3]
        );

        if(this.colorMatch(targetRect.data, color)) {
            this.ctx.fillStyle = this.rgba(this.colorEmpty, 1);
            this.ctx.fillRect(
                target[0],
                target[1],
                target[2],
                target[3]
            );

            this.cacheEmpty(target);

            // animate particles
            //pg = new ParticleGenerator(target, color);
            //pg.start(this.ctx);


            removed++;
        }
    }

    //this.ctx.save();

    return removed;

};


Game.prototype.colorMatch = function(color1, color2) {

    return (
        color1[0] == color2[0] &&
        color1[1] == color2[1] &&
        color1[2] == color2[2]
    );
};

Game.prototype.rgba = function(rgb, a) {
    //if(typeof a === "undefined") a = .5;
    a |= 0.5;
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + a + ')';
};





Game.prototype.generateTargets = function(pos) {

    var targets = [], i, d,
        maxWidth = this.canvasWidth - this.boxWith,
        maxHeight = this.canvasHeight - this.boxHeight;

    targets.push([pos[0],                 pos[1] - this.boxHeight, this.boxWith, this.boxHeight]); // n
    //targets.push([pos[0] + this.boxWith,  pos[1] - this.boxHeight, this.boxWith, this.boxHeight]); // ne
    targets.push([pos[0] + this.boxWith,  pos[1],                  this.boxWith, this.boxHeight]); // e
    //targets.push([pos[0] + this.boxWith,  pos[1] + this.boxHeight, this.boxWith, this.boxHeight]); // se
    targets.push([pos[0],                 pos[1] + this.boxHeight, this.boxWith, this.boxHeight]); // s
    //targets.push([pos[0] - this.boxWith,  pos[1] + this.boxHeight, this.boxWith, this.boxHeight]); // sw
    targets.push([pos[0] - this.boxWith,  pos[1],                  this.boxWith, this.boxHeight]); // w
    //targets.push([pos[0] - this.boxWith,  pos[1] - this.boxHeight, this.boxWith, this.boxHeight]); // nw


    // filter invalid targets
    for(i = targets.length - 1; i >= 0 ; i--) {
        d = targets[i];


        if(d[0] < 0 || d[1] < 0 || d[2] >= maxWidth || d[3] >= maxHeight) {
            targets.splice(i, 1);
        }

        if(this.emptyRectsCache.indexOf(d.join("_")) > -1) {
            targets.splice(i, 1);
        }
    }


    return targets;

};



function ParticleGenerator(rect, color) {
    var i;

    this.particles = [];
    this.count = 40;
    this.timer = null;

    for(i = 0; i < this.count; i++) {
        this.particles.push(new Particle(rect, color));
    }
}

ParticleGenerator.prototype.start = function(ctx) {
    var self = this;
    ctx.globalCompositeOperation = "source-over";
    this.timer = setInterval(function(){
        self.draw(ctx);
    }, 1000 / 60)
};

ParticleGenerator.prototype.draw = function(ctx) {
    var i, p;

    if(this.particles.length == 0)
        clearInterval(this.timer);

    for(i = this.particles.length - 1; i >= 0 ; i--) {
        p = this.particles[i];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0.5)";
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.radius += .08;

        if(p.radius > 3)
            this.particles.splice(i, 1);
    }
};


function Particle(rect, color) {

    // center
    this.x = (rect[0] + rect[0] + rect[2]) / 2;
    this.y = (rect[1] + rect[1] + rect[3]) / 2;


    this.radius = 1;

    this.vx = -5 + Math.random()*10;
    this.vy = -5 + Math.random()*10;

    this.r = color[0];
    this.g = color[1];
    this.b = color[2];
}