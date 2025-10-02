import {add, perpendicular, scale} from "../math/utils.js";
import Marking from "./marking.js";
import Segment from "../primitives/segment.js";
import Point from "../primitives/point.js";

export default class Crossing extends Marking {
    constructor(center, directionVector, width, height) {
        super(center, directionVector, width, height);

        this.borders = [this.poly.segments[0], this.poly.segments[2]];
        this.type = "crossing";
    }

    static load(data) {
        const point = new Point(data.center.x, data.center.y);
        const direction = new Point(data.directionVector.x, data.directionVector.y);
        return new Crossing(point, direction, data.width, data.height);
    }

    draw(ctx) {
        const perp = perpendicular(this.directionVector);
        const line = new Segment(
            add(this.center, scale(perp, this.width / 2)),
            add(this.center, scale(perp, -this.width / 2))
        );
        line.draw(ctx, {
            width: this.height,
            color: "white",
            dash: [11, 11]
        });
    }
}