import {add, lerp2D, perpendicular, scale} from "../math/utils.js";
import Marking from "./marking.js";
import Segment from "../primitives/segment.js";
import Point from "../primitives/point.js";

export default class Light extends Marking {
    constructor(center, directionVector, width, height) {
        super(center, directionVector, width, 18);

        this.state = "off";
        this.border = this.poly.segments[0];
        this.type = "light";
    }

    static load(data) {
        const point = new Point(data.center.x, data.center.y);
        const direction = new Point(data.directionVector.x, data.directionVector.y);
        return new Light(point, direction, data.width, data.height);
    }

    draw(ctx) {
        const perp = perpendicular(this.directionVector);
        const line = new Segment(
            add(this.center, scale(perp, this.width / 2)),
            add(this.center, scale(perp, -this.width / 2))
        );

        const green = lerp2D(line.p1, line.p2, 0.2);
        const yellow = lerp2D(line.p1, line.p2, 0.5);
        const red = lerp2D(line.p1, line.p2, 0.8);

        new Segment(red, green).draw(ctx, {
            width: this.height,
            cap: "round"
        });

        green.draw(ctx, { size: this.height * 0.6, color: "#060" });
        yellow.draw(ctx, { size: this.height * 0.6, color: "#660" });
        red.draw(ctx, { size: this.height * 0.6, color: "#600" });

        switch (this.state) {
            case "green":
                green.draw(ctx, { size: this.height * 0.6, color: "#0F0" });
                break;
            case "yellow":
                yellow.draw(ctx, { size: this.height * 0.6, color: "#FF0" });
                break;
            case "red":
                red.draw(ctx, { size: this.height * 0.6, color: "#F00" });
                break;
        }
    }
}