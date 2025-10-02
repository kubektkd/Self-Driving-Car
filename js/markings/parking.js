import {angle} from "../math/utils.js";
import Marking from "./marking.js";
import Point from "../primitives/point.js";

export default class Parking extends Marking {
    constructor(center, directionVector, width, height) {
        super(center, directionVector, width, height);

        this.borders = [this.poly.segments[0], this.poly.segments[2]];
        this.type = "parking";
    }

    static load(data) {
        const point = new Point(data.center.x, data.center.y);
        const direction = new Point(data.directionVector.x, data.directionVector.y);
        return new Parking(point, direction, data.width, data.height);
    }

    draw(ctx) {
        for (const border of this.borders) {
            border.draw(ctx, { width: 5, color: "white" });
        }
        ctx.save();
        ctx.translate(this.center.x, this.center.y);
        ctx.rotate(angle(this.directionVector));

        ctx.beginPath();
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "bold " + this.height * 0.9 + "px Arial";
        ctx.fillText("P", 0, 3);

        ctx.restore();
    }
}