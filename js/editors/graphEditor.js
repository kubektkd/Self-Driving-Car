import Segment from "../primitives/segment.js";
import {getNearestPoint, mouseButtons} from "../math/utils.js";

export default class GraphEditor {
    constructor(viewport, graph) {
        this.viewport = viewport;
        this.canvas = this.viewport.canvas;
        this.graph = graph;

        this.ctx = this.canvas.getContext("2d");

        this.selected = null;
        this.hovered = null;
        this.dragging = false;
        this.mousePosition = null;
    }

    enable() {
        this._addEventListeners();
    }

    disable() {
        this._removeEventListeners();
        this.selected = false;
        this.hovered = false;
    }

    _addEventListeners() {
        this.boundMouseDown = this._handleMouseDown.bind(this);
        this.boundMouseMove = this._handleMouseMove.bind(this);
        this.boundMouseUp = () => this.dragging = false;
        this.boundContextMenu = evt => evt.preventDefault();

        this.canvas.addEventListener("mousedown", this.boundMouseDown);
        this.canvas.addEventListener("mousemove", this.boundMouseMove);
        this.canvas.addEventListener("mouseup", this.boundMouseUp);
        this.canvas.addEventListener("contextmenu", this.boundContextMenu);
    }

    _removeEventListeners() {
        this.canvas.removeEventListener("mousedown", this.boundMouseDown);
        this.canvas.removeEventListener("mousemove", this.boundMouseMove);
        this.canvas.removeEventListener("mouseup", this.boundMouseUp);
        this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
    }

    _handleMouseMove(evt) {
        this.mousePosition = this.viewport.getMouse(evt, true)
        this.hovered = getNearestPoint(this.mousePosition, this.graph.points, 10 * this.viewport.zoom);
        if (this.dragging === true) {
            this.selected.x = this.mousePosition.x;
            this.selected.y = this.mousePosition.y;
        }
    }

    _handleMouseDown(evt) {
        if (evt.button === mouseButtons.RIGHT_CLICK) {
            if (this.selected) {
                this.selected = null;
            } else if (this.hovered) {
                this._removePoint(this.hovered);
            }
        }
        if (evt.button === mouseButtons.LEFT_CLICK) {
            if (this.hovered) {
                this._selectPoint(this.hovered);
                this.dragging = true;
                return;
            }
            this.graph.addPoint(this.mousePosition);
            this._selectPoint(this.mousePosition);
            this.hovered = this.mousePosition;
        }
    }

    _selectPoint(point) {
        if (this.selected)
            this.graph.tryAddSegment(new Segment(this.selected, point));
        this.selected = point;
    }

    _removePoint(point) {
        this.graph.removePoint(point);
        this.hovered = null;
        if (this.selected === point)
            this.selected = null;
    }

    dispose() {
        this.graph.dispose();
        this.selected = null;
        this.hovered = null;
    }

    display() {
        this.graph.draw(this.ctx);
        if (this.hovered) {
            this.hovered.draw(this.ctx, {fill: true});
        }
        if (this.selected) {
            const intent = this.hovered ? this.hovered : this.mousePosition;
            new Segment(this.selected, intent).draw(this.ctx, { dash: [3, 3] });
            this.selected.draw(this.ctx, {outline: true})
        }
    }
}