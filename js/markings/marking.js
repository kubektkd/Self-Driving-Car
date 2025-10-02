import {angle, translate} from "../math/utils.js";
import Point from "../primitives/point.js";
import Segment from "../primitives/segment.js";
import Envelope from "../primitives/envelope.js";

export default class Marking {
    constructor(center, directionVector, width, height) {
        this.center = center;
        this.directionVector = directionVector;
        this.width = width;
        this.height = height;

        this.support = new Segment(
            translate(center, angle(directionVector), height / 2),
            translate(center, angle(directionVector), -height / 2),
        );
        this.poly = new Envelope(this.support, width, 0).poly;

        this.type = "marking";
    }

    static load(data) {
        const point = new Point(data.center.x, data.center.y);
        const direction = new Point(data.directionVector.x, data.directionVector.y);
        return new Marking(point, direction, data.width, data.height);
    }

    draw(ctx) {
        this.poly.draw(ctx);
    }
}