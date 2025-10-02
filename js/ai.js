import Car from "./ai/car.js";
import Road from "./ai/road.js";
import Visualizer from "./ai/visualizer.js";
import NeuralNetwork from "./ai/network.js";
import {getRandomColor} from "./math/utils.js";

const carCanvas = window.document.getElementById("carCanvas");
const networkCanvas = window.document.getElementById("networkCanvas");

const saveBtn = document.getElementById("saveBtn");
const discardBtn = document.getElementById("discardBtn");

carCanvas.width = 200;
carCanvas.style.backgroundColor = "darkgray";

networkCanvas.width = 600;
networkCanvas.style.backgroundColor = "black";

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const N = 1000;
const cars = generateCars(N);
let bestCar = cars[0];

if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
        if (i > 0) {
            NeuralNetwork.mutate(cars[i].brain, 0.2);
        }
    }
}

const traffic = [
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(2), -500, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(0), -700, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(1), -900, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(2), -900, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(0), -1100, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(2), -1100, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(0), -1300, 30, 50, "DUMMY", getRandomColor(), 2),
    new Car(road.getLaneCenter(2), -1400, 30, 50, "DUMMY", getRandomColor(), 2),
];

animate();

function saveBrain() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}
function discardBrain() {
    localStorage.removeItem("bestBrain");
}

saveBtn.addEventListener("click", () => saveBrain());
discardBtn.addEventListener("click", () => discardBrain());

function generateCars(N) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", i === 0 ? "red" : "blue"));
    }
    return cars;
}

function animate(time) {
    carCanvas.height = window.innerHeight * 0.85;
    networkCanvas.height = window.innerHeight * 0.85;

    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
    }
    bestCar = cars.find(car => car.y === Math.min(...cars.map(c => c.y)));

    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

    road.draw(carCtx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx);
    }

    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx);
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx, true);

    carCtx.restore();

    networkCtx.lineDashOffset = - time / 60;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}