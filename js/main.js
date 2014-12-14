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

    this.boxWith = 40;
    this.boxHeight = 40;
    this.emptyRectsCache = [];


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


    this.initControls();
    this.initialRender();
}

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

    $('html, body').on("click", ".btn-color", function(e){
        if(e) e.preventDefault();
        var color = $(this).attr("data-color").split(",");
        self.makeTurn(color);
    });
};


Game.prototype.makeTurn = function(color) {

    var i, j, rect, r, g, b, noMoreColors = true, removed;


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
        alert("You win motherfucker!");
    }
};


Game.prototype.removeNeighbours = function(pos, color) {
    var i, j, removed = 0, target, targetRect;

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
            removed++;
        }
    }
    this.ctx.save();

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
    if(typeof a === "undefined") a = 1;
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + a + ')';
};


Game.prototype.ctxFillRect = function(ctx, rect) {
    ctx.fillRect(rect[0],rect[1], rect[2], rect[3]);
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