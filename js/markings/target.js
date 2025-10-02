import Marking from "./marking.js";
import Point from "../primitives/point.js";

export default class Target extends Marking {
    constructor(center, directionVector, width, height) {
        super(center, directionVector, width, height);

        this.border = this.poly.segments[2];
        this.type = "target";
    }

    static load(data) {
        const point = new Point(data.center.x, data.center.y);
        const direction = new Point(data.directionVector.x, data.directionVector.y);
        return new Target(point, direction, data.width, data.height);
    }

    draw(ctx) {
        this.center.draw(ctx, { color: "red", size: 30 });
        this.center.draw(ctx, { color: "white", size: 20 });
        this.center.draw(ctx, { color: "red", size: 10 });
    }
}