import {getNearestSegment, mouseButtons} from "../math/utils.js";

export default class MarkingEditor {
    constructor(viewport, world, targetSegments) {
        this.viewport = viewport;
        this.world = world;

        this.canvas = viewport.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.mousePosition = null;
        this.intent = null;

        this.targetSegments = targetSegments;

        this.markings = this.world.markings;
    }

    // to be overwritten
    createMarking(center, directionVector) {
        return center;
    }

    enable() {
        this._addEventListeners();
    }

    disable() {
        this._removeEventListeners();
    }

    _addEventListeners() {
        this.boundMouseDown = this._handleMouseDown.bind(this);
        this.boundMouseMove = this._handleMouseMove.bind(this);
        this.boundContextMenu = evt => evt.preventDefault();

        this.canvas.addEventListener("mousedown", this.boundMouseDown);
        this.canvas.addEventListener("mousemove", this.boundMouseMove);
        this.canvas.addEventListener("contextmenu", this.boundContextMenu);
    }

    _removeEventListeners() {
        this.canvas.removeEventListener("mousedown", this.boundMouseDown);
        this.canvas.removeEventListener("mousemove", this.boundMouseMove);
        this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
    }

    _handleMouseMove(evt) {
        this.mousePosition = this.viewport.getMouse(evt, true)
        const segment = getNearestSegment(
            this.mousePosition,
            this.targetSegments,
            10 * this.viewport.zoom
        );
        if (segment) {
            const projection = segment.projectPoint(this.mousePosition);
            if (projection.offset >= 0 && projection.offset <= 1) {
                this.intent = this.createMarking(
                    projection.point,
                    segment.directionVector()
                );
            } else {
                this.intent = null;
            }
        } else {
            this.intent = null;
        }
    }

    _handleMouseDown(evt) {
        if (evt.button === mouseButtons.LEFT_CLICK) {
            if (this.intent) {
                this.markings.push(this.intent);
                this.intent = null;
            }
        }
        if (evt.button === mouseButtons.RIGHT_CLICK) {
            for (let i = 0; i < this.markings.length; i++) {
                const poly = this.markings[i].poly;
                if (poly.containsPoint(this.mousePosition)) {
                    this.markings.splice(i, 1);
                    return;
                }
            }
        }
    }

    display() {
        if (this.intent) {
            this.intent.draw(this.ctx);
        }
    }
}