import Car from "./ai/car.js";
import Visualizer from "./ai/visualizer.js";
import NeuralNetwork from "./ai/network.js";
import World from "./world.js";
import Graph from "./math/graph.js";
import Viewport from "./viewport.js";
import {angle, scale} from "./math/utils.js";
import Point from "./primitives/point.js";
import Spawn from "./markings/spawn.js";

const carCanvas = window.document.getElementById("carCanvas");
const networkCanvas = window.document.getElementById("networkCanvas");

const saveBtn = document.getElementById("saveBtn");
const discardBtn = document.getElementById("discardBtn");

networkCanvas.width = 400;
networkCanvas.style.backgroundColor = "black";

carCanvas.width = window.innerWidth - networkCanvas.width - 30;
carCanvas.style.backgroundColor = "#2a5";

carCanvas.height = window.innerHeight * 0.85;
networkCanvas.height = window.innerHeight * 0.85;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const worldString = localStorage.getItem("world");
const worldData = worldString ? JSON.parse(worldString) : null;
const world = worldData
    ? World.load(worldData)
    : new World(new Graph());

const viewport = new Viewport(carCanvas, world.zoom, world.offset);

const N = 1;
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

const traffic = [];
const roadBorders = world.roadBorders.map(segment => [segment.p1, segment.p2]);
// const roadBorders = world.buildings.map(building => building.base.segments).flat().map(segment => [segment.p1, segment.p2]);

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
    const spawnPoints = world.markings.filter(marking => marking instanceof Spawn);
    const spawnPoint = spawnPoints.length > 0 ? spawnPoints[0].center : new Point(100, 100);
    const direction = spawnPoints.length > 0 ? spawnPoints[0].directionVector : new Point(0, -1);
    const spawnAngle = - angle(direction) + Math.PI / 2;

    const cars = [];
    for (let i = 1; i <= N; i++) {
        cars.push(new Car(spawnPoint.x, spawnPoint.y, 30, 50, "AI", i === 1 ? "red" : "blue", 3, spawnAngle));
    }
    return cars;
}

function animate(time) {
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(roadBorders, []);
    }
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(roadBorders, traffic);
    }
    bestCar = cars.find(car => car.fittness === Math.max(...cars.map(c => c.fittness)));

    world.cars = cars;
    world.bestCar = bestCar;

    // viewport.offset.x = - bestCar.x;
    // viewport.offset.y = - bestCar.y;

    viewport.reset();
    const viewPoint = scale(viewport.getOffset(), -1)
    world.draw(carCtx, viewPoint, false);

    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx);
    }

    networkCtx.lineDashOffset = - time / 60;
    networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}