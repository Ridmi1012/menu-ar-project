import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


// ==========================================
// DOM References
// ==========================================

const burgerBtn =
    document.getElementById("burgerBtn");

const pizzaBtn =
    document.getElementById("pizzaBtn");

const statusMessage =
    document.getElementById("statusMessage");

const startARBtn =
    document.getElementById("startARBtn");

const exitARBtn =
    document.getElementById("exitARBtn");

const xrIntro =
    document.getElementById("xrIntro");

const xrViewport =
    document.getElementById("xrViewport");

const rotateLeftBtn =
    document.getElementById("rotateLeftBtn");

const rotateRightBtn =
    document.getElementById("rotateRightBtn");

const sizeDownBtn =
    document.getElementById("sizeDownBtn");

const sizeUpBtn =
    document.getElementById("sizeUpBtn");

const removeBtn =
    document.getElementById("removeBtn");

const confirmBtn =
    document.getElementById("confirmBtn");


// ==========================================
// Application State
// ==========================================

const menuARState = {

    selectedFood: "burger",

    appState: "INITIALIZING",

    placedObject: null,

    currentScale: 1,

    currentRotation: 0,

    surfaceFound: false,

    modelsReady: false,

    xrSupported: false

};


// ==========================================
// Model Configuration
// ==========================================
//
// Keeping model-specific settings here means
// we can replace the Kenney models later without
// rewriting the AR logic.
//

const MODEL_CONFIG = {

    burger: {

        src:
            "assets/models/burger.glb",

        scale:
            0.22,

        surfaceOffset:
            0.015

    },

    pizza: {

        src:
            "assets/models/pizza.glb",

        scale:
            0.24,

        surfaceOffset:
            0.012

    }

};


// ==========================================
// Three.js / WebXR Variables
// ==========================================

let scene;

let camera;

let renderer;

let reticle;

let controller;

let xrSession = null;

let hitTestSource = null;

let viewerSpace = null;

let referenceSpace = null;


// Loaded model templates

const modelTemplates = {

    burger: null,

    pizza: null

};


// ==========================================
// Three.js Initialization
// ==========================================

function initThreeJS() {

    scene =
        new THREE.Scene();


    camera =
        new THREE.PerspectiveCamera(
            70,
            window.innerWidth /
                window.innerHeight,
            0.01,
            20
        );


    renderer =
        new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.xr.enabled =
        true;


    renderer.domElement.classList.add(
        "xr-canvas"
    );


    xrViewport.appendChild(
        renderer.domElement
    );


    // --------------------------------------
    // Lighting
    // --------------------------------------

    const hemisphereLight =
        new THREE.HemisphereLight(
            0xffffff,
            0x666666,
            2.5
        );


    scene.add(
        hemisphereLight
    );


    const directionalLight =
        new THREE.DirectionalLight(
            0xffffff,
            1.5
        );


    directionalLight.position.set(
        1,
        3,
        2
    );


    scene.add(
        directionalLight
    );


    // --------------------------------------
    // Placement Reticle
    // --------------------------------------

    const reticleGeometry =
        new THREE.RingGeometry(
            0.065,
            0.085,
            32
        );


    reticleGeometry.rotateX(
        -Math.PI / 2
    );


    const reticleMaterial =
        new THREE.MeshBasicMaterial({

            color:
                0xffffff,

            side:
                THREE.DoubleSide

        });


    reticle =
        new THREE.Mesh(
            reticleGeometry,
            reticleMaterial
        );


    reticle.matrixAutoUpdate =
        false;


    reticle.visible =
        false;


    scene.add(
        reticle
    );


    // --------------------------------------
    // XR Touch / Select Controller
    // --------------------------------------

    controller =
        renderer.xr.getController(0);


    controller.addEventListener(
        "select",
        onXRSelect
    );


    scene.add(
        controller
    );


    // --------------------------------------
    // Render Loop
    // --------------------------------------

    renderer.setAnimationLoop(
        render
    );

}


// ==========================================
// Status Helper
// ==========================================

function setStatus(message) {

    if (
        statusMessage.textContent !==
        message
    ) {

        statusMessage.textContent =
            message;

    }

}


// ==========================================
// Model Loading
// ==========================================

function loadModel(food) {

    return new Promise(
        (resolve, reject) => {

            const loader =
                new GLTFLoader();


            const config =
                MODEL_CONFIG[food];


            loader.load(

                config.src,

                (gltf) => {

                    modelTemplates[food] =
                        gltf.scene;


                    console.log(
                        `${food} model loaded.`
                    );


                    resolve();

                },

                undefined,

                (error) => {

                    console.error(
                        `Failed to load ${food}:`,
                        error
                    );


                    reject(error);

                }

            );

        }
    );

}


// ==========================================
// Load All Models
// ==========================================

async function loadModels() {

    try {

        setStatus(
            "Loading Burger and Pizza models..."
        );


        await Promise.all([

            loadModel("burger"),

            loadModel("pizza")

        ]);


        menuARState.modelsReady =
            true;


        console.log(
            "All MenuAR models loaded."
        );

    } catch (error) {

        menuARState.modelsReady =
            false;


        setStatus(
            "3D models could not be loaded."
        );


        console.error(
            "Model loading failed:",
            error
        );

    }

}


// ==========================================
// Food Selection
// ==========================================

function selectFood(food) {

    // Do not replace placed object yet.
    // That comes in the manipulation phase.

    if (
        menuARState.placedObject
    ) {

        setStatus(
            "Food is already placed. Dish switching will be enabled in the next interaction phase."
        );


        return;

    }


    menuARState.selectedFood =
        food;


    if (
        food === "burger"
    ) {

        burgerBtn.classList.add(
            "active"
        );


        pizzaBtn.classList.remove(
            "active"
        );

    } else {

        pizzaBtn.classList.add(
            "active"
        );


        burgerBtn.classList.remove(
            "active"
        );

    }


    const foodName =
        getFoodName(food);


    if (!xrSession) {

        if (
            menuARState.xrSupported &&
            menuARState.modelsReady
        ) {

            setStatus(
                `${foodName} selected. Ready to start AR.`
            );

        }

    } else if (
        menuARState.surfaceFound
    ) {

        setStatus(
            `${foodName} selected. Tap the white circle to place it.`
        );

    } else {

        setStatus(
            `${foodName} selected. Move your tablet slowly to scan the table.`
        );

    }


    console.log(
        "Selected food:",
        food
    );

}


// ==========================================
// Human-readable Food Name
// ==========================================

function getFoodName(food) {

    return food === "burger"
        ? "Burger"
        : "Pizza";

}


// ==========================================
// WebXR Support Check
// ==========================================

async function checkXRSupport() {

    if (!navigator.xr) {

        menuARState.xrSupported =
            false;


        menuARState.appState =
            "UNSUPPORTED";


        setStatus(
            "WebXR is not available in this browser."
        );


        updateStartButton();


        return;

    }


    try {

        const supported =
            await navigator.xr.isSessionSupported(
                "immersive-ar"
            );


        menuARState.xrSupported =
            supported;


        if (supported) {

            menuARState.appState =
                "READY_TO_SCAN";

        } else {

            menuARState.appState =
                "UNSUPPORTED";


            setStatus(
                "Immersive AR is not supported on this device."
            );

        }


        updateStartButton();

    } catch (error) {

        console.error(
            "WebXR support check failed:",
            error
        );


        menuARState.xrSupported =
            false;


        menuARState.appState =
            "UNSUPPORTED";


        setStatus(
            "Unable to check WebXR support."
        );


        updateStartButton();

    }

}


// ==========================================
// Start Button Availability
// ==========================================

function updateStartButton() {

    const ready =
        menuARState.xrSupported &&
        menuARState.modelsReady;


    startARBtn.disabled =
        !ready;


    if (ready) {

        startARBtn.textContent =
            "Start AR";


        const foodName =
            getFoodName(
                menuARState.selectedFood
            );


        setStatus(
            `${foodName} selected. Ready to start AR.`
        );

    } else if (
        !menuARState.xrSupported
    ) {

        startARBtn.textContent =
            "AR Unsupported";

    } else {

        startARBtn.textContent =
            "Loading Models...";

    }

}


// ==========================================
// Start AR Session
// ==========================================

async function startARSession() {

    if (
        !menuARState.xrSupported ||
        !menuARState.modelsReady
    ) {

        return;

    }


    try {

        xrSession =
            await navigator.xr.requestSession(
                "immersive-ar",
                {

                    requiredFeatures: [
                        "hit-test"
                    ],

                    optionalFeatures: [
                        "dom-overlay",
                        "local-floor"
                    ],

                    domOverlay: {
                        root:
                            document.body
                    }

                }
            );


        await renderer.xr.setSession(
            xrSession
        );


        viewerSpace =
            await xrSession.requestReferenceSpace(
                "viewer"
            );


        try {

            referenceSpace =
                await xrSession.requestReferenceSpace(
                    "local-floor"
                );

        } catch {

            referenceSpace =
                await xrSession.requestReferenceSpace(
                    "local"
                );

        }


        hitTestSource =
            await xrSession.requestHitTestSource({
                space:
                    viewerSpace
            });


        xrSession.addEventListener(
            "end",
            onARSessionEnded
        );


        menuARState.appState =
            "SCANNING";


        menuARState.surfaceFound =
            false;


        document.body.classList.add(
            "xr-session-active"
        );


        setStatus(
            "Move your tablet slowly across a well-lit table."
        );


        console.log(
            "WebXR AR session started."
        );

    } catch (error) {

        console.error(
            "Could not start AR session:",
            error
        );


        xrSession =
            null;


        setStatus(
            "AR could not start. Check camera permission and WebXR support."
        );

    }

}


// ==========================================
// Exit AR Session
// ==========================================

async function endARSession() {

    if (xrSession) {

        await xrSession.end();

    }

}


// ==========================================
// Session Cleanup
// ==========================================

function onARSessionEnded() {

    if (
        hitTestSource
    ) {

        hitTestSource.cancel();

    }


    hitTestSource =
        null;


    viewerSpace =
        null;


    referenceSpace =
        null;


    xrSession =
        null;


    reticle.visible =
        false;


    menuARState.surfaceFound =
        false;


    menuARState.appState =
        "READY_TO_SCAN";


    document.body.classList.remove(
        "xr-session-active"
    );


    const foodName =
        getFoodName(
            menuARState.selectedFood
        );


    setStatus(
        `${foodName} selected. Ready to start AR.`
    );


    console.log(
        "WebXR AR session ended."
    );

}


// ==========================================
// Place Selected Food
// ==========================================

function placeSelectedFood() {

    if (
        !reticle.visible ||
        menuARState.placedObject
    ) {

        return;

    }


    const food =
        menuARState.selectedFood;


    const template =
        modelTemplates[food];


    if (!template) {

        return;

    }


    const config =
        MODEL_CONFIG[food];


    const placedModel =
        template.clone(true);


    // --------------------------------------
    // Position
    // --------------------------------------

    const placementPosition =
        new THREE.Vector3();


    placementPosition.setFromMatrixPosition(
        reticle.matrix
    );


    placedModel.position.copy(
        placementPosition
    );


    placedModel.position.y +=
        config.surfaceOffset;


    // --------------------------------------
    // Surface Orientation
    // --------------------------------------

    const placementRotation =
        new THREE.Quaternion();


    const placementScale =
        new THREE.Vector3();


    reticle.matrix.decompose(
        new THREE.Vector3(),
        placementRotation,
        placementScale
    );


    placedModel.quaternion.copy(
        placementRotation
    );


    // --------------------------------------
    // Food Scale
    // --------------------------------------

    placedModel.scale.setScalar(
        config.scale
    );


    // --------------------------------------
    // Add to Scene
    // --------------------------------------

    scene.add(
        placedModel
    );


    menuARState.placedObject =
        placedModel;


    menuARState.appState =
        "PLACED";


    menuARState.currentScale =
        config.scale;


    menuARState.currentRotation =
        0;


    reticle.visible =
        false;


    burgerBtn.disabled =
        true;


    pizzaBtn.disabled =
        true;


    const foodName =
        getFoodName(food);


    setStatus(
        `${foodName} placed successfully.`
    );


    console.log(
        `${foodName} placed.`,
        placedModel.position
    );

}


// ==========================================
// XR Tap / Select Event
// ==========================================

function onXRSelect() {

    if (
        menuARState.appState ===
            "SURFACE_FOUND" &&
        reticle.visible
    ) {

        placeSelectedFood();

    }

}


// ==========================================
// XR Frame Loop
// ==========================================

function render(
    timestamp,
    frame
) {

    if (
        frame &&
        hitTestSource &&
        referenceSpace &&
        !menuARState.placedObject
    ) {

        const hitTestResults =
            frame.getHitTestResults(
                hitTestSource
            );


        if (
            hitTestResults.length > 0
        ) {

            const hit =
                hitTestResults[0];


            const pose =
                hit.getPose(
                    referenceSpace
                );


            if (pose) {

                reticle.visible =
                    true;


                reticle.matrix.fromArray(
                    pose.transform.matrix
                );


                if (
                    !menuARState.surfaceFound
                ) {

                    menuARState.surfaceFound =
                        true;


                    menuARState.appState =
                        "SURFACE_FOUND";


                    const foodName =
                        getFoodName(
                            menuARState.selectedFood
                        );


                    setStatus(
                        `${foodName} selected. Tap the white circle to place it.`
                    );


                    console.log(
                        "Surface detected."
                    );

                }

            }

        } else {

            reticle.visible =
                false;


            if (
                menuARState.surfaceFound
            ) {

                menuARState.surfaceFound =
                    false;


                menuARState.appState =
                    "SCANNING";


                const foodName =
                    getFoodName(
                        menuARState.selectedFood
                    );


                setStatus(
                    `${foodName} selected. Surface lost — move your tablet slowly.`
                );

            }

        }

    }


    renderer.render(
        scene,
        camera
    );

}


// ==========================================
// Food Selection Events
// ==========================================

burgerBtn.addEventListener(
    "click",
    () => {

        selectFood(
            "burger"
        );

    }
);


pizzaBtn.addEventListener(
    "click",
    () => {

        selectFood(
            "pizza"
        );

    }
);


// ==========================================
// Start / Exit AR Events
// ==========================================

startARBtn.addEventListener(
    "click",
    async () => {

        await startARSession();

    }
);


exitARBtn.addEventListener(
    "click",
    async () => {

        await endARSession();

    }
);


// ==========================================
// Resize Handling
// ==========================================

window.addEventListener(
    "resize",
    () => {

        if (
            !camera ||
            !renderer
        ) {

            return;

        }


        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


// ==========================================
// Application Startup
// ==========================================

async function initializeApplication() {

    initThreeJS();


    selectFood(
        "burger"
    );


    await Promise.all([

        loadModels(),

        checkXRSupport()

    ]);


    updateStartButton();

}


// Start MenuAR

initializeApplication();