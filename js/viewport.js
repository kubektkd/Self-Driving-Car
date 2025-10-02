import Point from "./primitives/point.js";
import {mouseButtons, add, subtract, scale} from "./math/utils.js";

export default class Viewport {
    constructor(canvas, zoom = 1, offset = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.zoom = zoom;
        this.center = new Point(canvas.width / 2, canvas.height / 2);
        this.offset = offset ? offset : scale(this.center, -1);

        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false
        }

        this._addEventListeners();
    }

    reset() {
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.center.x, this.center.y);
        this.ctx.scale(1 / this.zoom, 1 / this.zoom);
        const offset = this.getOffset();
        this.ctx.translate(offset.x, offset.y);
    }

    getMouse(evt, subtractDragOffset = false) {
        const point = new Point(
            (evt.offsetX - this.center.x) * this.zoom - this.offset.x,
            (evt.offsetY - this.center.y) * this.zoom - this.offset.y
        );
        return subtractDragOffset ? subtract(point, this.drag.offset) : point;
    }

    getOffset() {
        return add(this.offset, this.drag.offset);
    }

    _addEventListeners() {
        this.canvas.addEventListener("mousewheel", this._handleMouseWheel.bind(this));
        this.canvas.addEventListener("mousedown", this._handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this._handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this._handleMouseUp.bind(this));
    }

    _handleMouseDown(evt) {
        if (evt.button === mouseButtons.MIDDLE_CLICK) {
            this.drag.start = this.getMouse(evt);
            this.drag.active = true;
        }
    }

    _handleMouseMove(evt) {
        if (this.drag.active) {
            this.drag.end = this.getMouse(evt);
            this.drag.offset = subtract(this.drag.end, this.drag.start);
        }
    }

    _handleMouseUp(evt) {
        if (this.drag.active) {
            this.offset = add(this.offset, this.drag.offset);
        }
        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false
        }
    }

    _handleMouseWheel(evt) {
        const direction = Math.sign(evt.deltaY);
        const step = 0.1;
        this.zoom += direction * step;
        this.zoom = Math.max(1, Math.min(5, this.zoom));
    }
}