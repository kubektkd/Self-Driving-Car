import Segment from "./segment.js";
import Polygon from "./polygon.js";
import {angle, subtract, translate} from "../math/utils.js";

export default class Envelope {
    constructor(skeleton, width, roundness = 1) {
        if (skeleton) {
            this.skeleton = skeleton;
            this.poly = this._generatePolygon(width, roundness);
        }
    }

    static load(data) {
        const envelope = new Envelope();
        envelope.skeleton = new Segment(data.skeleton.p1, data.skeleton.p2);
        envelope.poly = Polygon.load(data.poly);
        return envelope;
    }

    _generatePolygon(width, roundness) {
        const { p1, p2 } = this.skeleton;

        const radius = width / 2;
        const alpha = angle(subtract(p1, p2));
        const alpha_cw = alpha + Math.PI / 2;
        const alpha_ccw = alpha - Math.PI / 2;

        const points = [];
        const step = Math.PI / Math.max(1, roundness);
        const epsilon = step / 2;

        for (let i = alpha_ccw; i <= alpha_cw + epsilon; i += step) {
            points.push(translate(p1, i, radius));
        }
        for (let i = alpha_ccw; i <= alpha_cw + epsilon; i += step) {
            points.push(translate(p2, Math.PI + i, radius));
        }

        return new Polygon(points);
    }

    draw(ctx, options) {
        this.poly.draw(ctx, options);
    }
}