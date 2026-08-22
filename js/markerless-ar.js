import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


// ==========================================
// DOM REFERENCES
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

const xrViewport =
    document.getElementById("xrViewport");

const arControls =
    document.getElementById("arControls");

const interactionControls =
    document.getElementById("interactionControls");

const rotateLeftBtn =
    document.getElementById("rotateLeftBtn");

const rotateRightBtn =
    document.getElementById("rotateRightBtn");

const sizeDownBtn =
    document.getElementById("sizeDownBtn");

const sizeUpBtn =
    document.getElementById("sizeUpBtn");

const moveBtn =
    document.getElementById("moveBtn");

const removeBtn =
    document.getElementById("removeBtn");

const confirmBtn =
    document.getElementById("confirmBtn");


// ==========================================
// APPLICATION STATES
// ==========================================
//
// INITIALIZING
// READY_TO_SCAN
// SCANNING
// SURFACE_FOUND
// PLACED
// MOVE_MODE
// CONFIRMED
// UNSUPPORTED
//

const menuARState = {

    selectedFood:
        "burger",

    appState:
        "INITIALIZING",

    placedObject:
        null,

    surfaceFound:
        false,

    modelsReady:
        false,

    xrSupported:
        false,

    // User-controlled scale multiplier.
    // 1 = model's normal configured size.
    scaleFactor:
        1,

    // Used mainly for state/debug information.
    currentRotation:
        0

};


// ==========================================
// MODEL CONFIGURATION
// ==========================================
//
// These are model-specific.
//
// When we replace Kenney with more realistic
// models later, this is one of the main places
// we will need to adjust.
//

const MODEL_CONFIG = {

    burger: {

        src:
            "assets/models/burger.glb",

        baseScale:
            0.22,

        surfaceOffset:
            0.015

    },


    pizza: {

        src:
            "assets/models/pizza.glb",

        baseScale:
            0.24,

        surfaceOffset:
            0.012

    }

};


// ==========================================
// INTERACTION CONFIGURATION
// ==========================================

const ROTATION_STEP =
    THREE.MathUtils.degToRad(15);


const SCALE_STEP =
    0.15;


const MIN_SCALE_FACTOR =
    0.55;


const MAX_SCALE_FACTOR =
    2.0;


// ==========================================
// THREE.JS / WEBXR VARIABLES
// ==========================================

let scene;

let camera;

let renderer;

let reticle;

let controller;


let xrSession =
    null;


let hitTestSource =
    null;


let viewerSpace =
    null;


let referenceSpace =
    null;


// ==========================================
// LOADED MODEL TEMPLATES
// ==========================================

const modelTemplates = {

    burger:
        null,

    pizza:
        null

};


// ==========================================
// THREE.JS INITIALIZATION
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

            alpha:
                true,

            antialias:
                true

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
    // LIGHTING
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
    // PLACEMENT RETICLE
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
    // XR TOUCH CONTROLLER
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
    // RENDER LOOP
    // --------------------------------------

    renderer.setAnimationLoop(
        render
    );

}


// ==========================================
// STATUS MESSAGE
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
// FOOD DISPLAY NAME
// ==========================================

function getFoodName(food) {

    return food === "burger"
        ? "Burger"
        : "Pizza";

}


// ==========================================
// LOAD ONE MODEL
// ==========================================

function loadModel(food) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

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


                    reject(
                        error
                    );

                }

            );

        }

    );

}


// ==========================================
// LOAD BOTH MODELS
// ==========================================

async function loadModels() {

    try {

        setStatus(
            "Loading Burger and Pizza models..."
        );


        await Promise.all([

            loadModel(
                "burger"
            ),

            loadModel(
                "pizza"
            )

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
// UPDATE FOOD BUTTON APPEARANCE
// ==========================================

function updateFoodButtons(food) {

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

}


// ==========================================
// FOOD SELECTION
// ==========================================
//
// Food can be changed:
//
// - before AR starts
// - while scanning
// - when a surface is found
// - after placement
// - during Move Mode
//
// Food selection is locked only after
// Confirm Preview.
//

function selectFood(food) {

    if (
        menuARState.appState ===
        "CONFIRMED"
    ) {

        return;

    }


    const previousFood =
        menuARState.selectedFood;


    menuARState.selectedFood =
        food;


    updateFoodButtons(
        food
    );


    const foodName =
        getFoodName(
            food
        );


    // --------------------------------------
    // MODEL ALREADY PLACED
    // --------------------------------------

    if (
        menuARState.placedObject
    ) {

        if (
            previousFood ===
            food
        ) {

            if (
                menuARState.appState ===
                "MOVE_MODE"
            ) {

                setMoveModeStatus();

            } else {

                setStatus(
                    `${foodName} is already displayed.`
                );

            }


            return;

        }


        replacePlacedFood(

            food,

            previousFood

        );


        return;

    }


    // --------------------------------------
    // BEFORE AR
    // --------------------------------------

    if (
        !xrSession
    ) {

        if (
            menuARState.xrSupported &&
            menuARState.modelsReady
        ) {

            setStatus(
                `${foodName} selected. Ready to start AR.`
            );

        }


        return;

    }


    // --------------------------------------
    // SURFACE ALREADY FOUND
    // --------------------------------------

    if (
        menuARState.appState ===
        "SURFACE_FOUND"
    ) {

        setStatus(
            `${foodName} selected. Tap the white circle to place it.`
        );


        return;

    }


    // --------------------------------------
    // SCANNING
    // --------------------------------------

    setStatus(
        `${foodName} selected. Move your tablet slowly to scan the table.`
    );

}


// ==========================================
// REPLACE ALREADY-PLACED FOOD
// ==========================================
//
// Position is preserved.
// Rotation is preserved.
// User scale factor is preserved.
// Move Mode is also preserved if active.
//

function replacePlacedFood(

    newFood,

    previousFood

) {

    if (
        !menuARState.placedObject
    ) {

        return;

    }


    const template =
        modelTemplates[newFood];


    if (
        !template
    ) {

        setStatus(
            "Selected model is not ready."
        );


        return;

    }


    const oldModel =
        menuARState.placedObject;


    const newConfig =
        MODEL_CONFIG[newFood];


    const previousConfig =
        MODEL_CONFIG[previousFood];


    // --------------------------------------
    // SAVE CURRENT TRANSFORM
    // --------------------------------------

    const savedPosition =
        oldModel.position.clone();


    const savedQuaternion =
        oldModel.quaternion.clone();


    // --------------------------------------
    // REMOVE OLD MODEL
    // --------------------------------------

    scene.remove(
        oldModel
    );


    // --------------------------------------
    // CREATE REPLACEMENT
    // --------------------------------------

    const newModel =
        template.clone(true);


    // --------------------------------------
    // PRESERVE POSITION
    // --------------------------------------

    newModel.position.copy(
        savedPosition
    );


    // Correct only for the difference between
    // each model's vertical surface offset.

    newModel.position.y +=

        newConfig.surfaceOffset -

        previousConfig.surfaceOffset;


    // --------------------------------------
    // PRESERVE ROTATION
    // --------------------------------------

    newModel.quaternion.copy(
        savedQuaternion
    );


    // --------------------------------------
    // PRESERVE USER SIZE
    // --------------------------------------

    const replacementScale =

        newConfig.baseScale *

        menuARState.scaleFactor;


    newModel.scale.setScalar(
        replacementScale
    );


    // --------------------------------------
    // ADD REPLACEMENT
    // --------------------------------------

    scene.add(
        newModel
    );


    menuARState.placedObject =
        newModel;


    const foodName =
        getFoodName(
            newFood
        );


    // --------------------------------------
    // PRESERVE MOVE MODE
    // --------------------------------------

    if (
        menuARState.appState ===
        "MOVE_MODE"
    ) {

        setMoveModeStatus();

    } else {

        menuARState.appState =
            "PLACED";


        setStatus(
            `Changed to ${foodName}. Position, rotation and size preserved.`
        );

    }


    console.log(
        `Changed placed food to ${foodName}.`
    );

}


// ==========================================
// WEBXR SUPPORT CHECK
// ==========================================

async function checkXRSupport() {

    if (
        !navigator.xr
    ) {

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


        if (
            supported
        ) {

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
// UPDATE START AR BUTTON
// ==========================================

function updateStartButton() {

    const ready =

        menuARState.xrSupported &&

        menuARState.modelsReady;


    startARBtn.disabled =
        !ready;


    if (
        ready
    ) {

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
// START AR SESSION
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


        menuARState.scaleFactor =
            1;


        menuARState.currentRotation =
            0;


        document.body.classList.add(
            "xr-session-active"
        );


        hideInteractionControls();


        const foodName =
            getFoodName(
                menuARState.selectedFood
            );


        setStatus(
            `${foodName} selected. Move your tablet slowly across the table.`
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
// END AR SESSION
// ==========================================

async function endARSession() {

    if (
        xrSession
    ) {

        await xrSession.end();

    }

}


// ==========================================
// REMOVE MODEL FROM THREE.JS SCENE
// ==========================================

function removePlacedObjectFromScene() {

    if (
        !menuARState.placedObject
    ) {

        return;

    }


    scene.remove(
        menuARState.placedObject
    );


    menuARState.placedObject =
        null;

}


// ==========================================
// SHOW INTERACTION CONTROLS
// ==========================================

function showInteractionControls() {

    interactionControls.classList.add(
        "is-visible"
    );

}


// ==========================================
// HIDE INTERACTION CONTROLS
// ==========================================

function hideInteractionControls() {

    interactionControls.classList.remove(
        "is-visible"
    );

}


// ==========================================
// ENABLE MANIPULATION
// ==========================================

function enableManipulationControls() {

    rotateLeftBtn.disabled =
        false;


    rotateRightBtn.disabled =
        false;


    sizeDownBtn.disabled =
        false;


    sizeUpBtn.disabled =
        false;


    moveBtn.disabled =
        false;


    removeBtn.disabled =
        false;


    confirmBtn.disabled =
        false;


    moveBtn.textContent =
        "↔ Move";


    moveBtn.classList.remove(
        "active"
    );


    confirmBtn.textContent =
        "Confirm Preview";

}


// ==========================================
// DISABLE MANIPULATION
// ==========================================

function disableManipulationControls() {

    rotateLeftBtn.disabled =
        true;


    rotateRightBtn.disabled =
        true;


    sizeDownBtn.disabled =
        true;


    sizeUpBtn.disabled =
        true;


    moveBtn.disabled =
        true;


    removeBtn.disabled =
        true;


    confirmBtn.disabled =
        true;

}


// ==========================================
// MOVE MODE CONTROLS
// ==========================================
//
// During Move Mode:
//
// Burger/Pizza remain available.
// Other manipulation controls are disabled
// until a new position is selected.
//

function setMoveModeControls() {

    rotateLeftBtn.disabled =
        true;


    rotateRightBtn.disabled =
        true;


    sizeDownBtn.disabled =
        true;


    sizeUpBtn.disabled =
        true;


    removeBtn.disabled =
        true;


    confirmBtn.disabled =
        true;


    moveBtn.disabled =
        true;


    moveBtn.textContent =
        "Move Mode Active";


    moveBtn.classList.add(
        "active"
    );

}


// ==========================================
// RESET ALL CONTROLS
// ==========================================

function resetControls() {

    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;


    disableManipulationControls();


    hideInteractionControls();


    moveBtn.textContent =
        "↔ Move";


    moveBtn.classList.remove(
        "active"
    );


    confirmBtn.textContent =
        "Confirm Preview";

}


// ==========================================
// SESSION CLEANUP
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


    removePlacedObjectFromScene();


    menuARState.surfaceFound =
        false;


    menuARState.scaleFactor =
        1;


    menuARState.currentRotation =
        0;


    menuARState.appState =
        "READY_TO_SCAN";


    resetControls();


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
        "WebXR session ended and MenuAR reset."
    );

}


// ==========================================
// PLACE SELECTED FOOD
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


    if (
        !template
    ) {

        return;

    }


    const config =
        MODEL_CONFIG[food];


    const placedModel =
        template.clone(true);


    // --------------------------------------
    // POSITION
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
    // INITIAL SURFACE ORIENTATION
    // --------------------------------------

    const placementRotation =
        new THREE.Quaternion();


    const ignoredScale =
        new THREE.Vector3();


    reticle.matrix.decompose(

        new THREE.Vector3(),

        placementRotation,

        ignoredScale

    );


    placedModel.quaternion.copy(
        placementRotation
    );


    // --------------------------------------
    // INITIAL SCALE
    // --------------------------------------

    menuARState.scaleFactor =
        1;


    placedModel.scale.setScalar(
        config.baseScale
    );


    // --------------------------------------
    // ADD TO SCENE
    // --------------------------------------

    scene.add(
        placedModel
    );


    menuARState.placedObject =
        placedModel;


    menuARState.appState =
        "PLACED";


    menuARState.currentRotation =
        0;


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;


    // Food switching remains available.

    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;


    showInteractionControls();


    enableManipulationControls();


    const foodName =
        getFoodName(
            food
        );


    setStatus(
        `${foodName} placed. Rotate, resize, move, change dish, remove or confirm.`
    );


    console.log(
        `${foodName} placed.`,
        placedModel.position
    );

}


// ==========================================
// ROTATE LEFT
// ==========================================

function rotateLeft() {

    if (
        !canManipulate()
    ) {

        return;

    }


    menuARState.placedObject.rotateY(
        ROTATION_STEP
    );


    menuARState.currentRotation +=
        ROTATION_STEP;


    setStatus(
        `${getFoodName(menuARState.selectedFood)} rotated left.`
    );

}


// ==========================================
// ROTATE RIGHT
// ==========================================

function rotateRight() {

    if (
        !canManipulate()
    ) {

        return;

    }


    menuARState.placedObject.rotateY(
        -ROTATION_STEP
    );


    menuARState.currentRotation -=
        ROTATION_STEP;


    setStatus(
        `${getFoodName(menuARState.selectedFood)} rotated right.`
    );

}


// ==========================================
// CAN OBJECT BE MANIPULATED?
// ==========================================

function canManipulate() {

    return (

        menuARState.placedObject !==
            null &&

        menuARState.appState ===
            "PLACED"

    );

}


// ==========================================
// CHANGE MODEL SIZE
// ==========================================

function changeSize(direction) {

    if (
        !canManipulate()
    ) {

        return;

    }


    const newFactor =

        menuARState.scaleFactor +

        (
            SCALE_STEP *
            direction
        );


    menuARState.scaleFactor =
        THREE.MathUtils.clamp(

            newFactor,

            MIN_SCALE_FACTOR,

            MAX_SCALE_FACTOR

        );


    const config =
        MODEL_CONFIG[
            menuARState.selectedFood
        ];


    const actualScale =

        config.baseScale *

        menuARState.scaleFactor;


    menuARState.placedObject.scale.setScalar(
        actualScale
    );


    const percentage =
        Math.round(
            menuARState.scaleFactor *
            100
        );


    setStatus(
        `${getFoodName(menuARState.selectedFood)} size: ${percentage}%.`
    );

}


// ==========================================
// ENTER MOVE MODE
// ==========================================

function enterMoveMode() {

    if (
        !canManipulate()
    ) {

        return;

    }


    menuARState.appState =
        "MOVE_MODE";


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;


    setMoveModeControls();


    setStatus(
        "Move mode — scan for a new position on the table."
    );


    console.log(
        "MenuAR entered MOVE_MODE."
    );

}


// ==========================================
// MOVE MODE STATUS
// ==========================================

function setMoveModeStatus() {

    const foodName =
        getFoodName(
            menuARState.selectedFood
        );


    if (
        menuARState.surfaceFound
    ) {

        setStatus(
            `${foodName} selected. Move mode — tap the white circle to reposition it.`
        );

    } else {

        setStatus(
            `${foodName} selected. Move mode — scan for a new position.`
        );

    }

}


// ==========================================
// REPOSITION PLACED FOOD
// ==========================================
//
// Position changes.
//
// Existing rotation and scale remain
// completely untouched.
//

function repositionPlacedFood() {

    if (

        menuARState.appState !==
            "MOVE_MODE" ||

        !menuARState.placedObject ||

        !reticle.visible

    ) {

        return;

    }


    const newPosition =
        new THREE.Vector3();


    newPosition.setFromMatrixPosition(
        reticle.matrix
    );


    const config =
        MODEL_CONFIG[
            menuARState.selectedFood
        ];


    menuARState.placedObject.position.copy(
        newPosition
    );


    menuARState.placedObject.position.y +=
        config.surfaceOffset;


    // IMPORTANT:
    // quaternion is not changed.
    // scale is not changed.


    menuARState.appState =
        "PLACED";


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;


    enableManipulationControls();


    const foodName =
        getFoodName(
            menuARState.selectedFood
        );


    setStatus(
        `${foodName} moved. Rotation and size preserved.`
    );


    console.log(
        `${foodName} repositioned.`
    );

}


// ==========================================
// REMOVE / RESET
// ==========================================

function removeFood() {

    if (

        !menuARState.placedObject ||

        menuARState.appState ===
            "CONFIRMED"

    ) {

        return;

    }


    removePlacedObjectFromScene();


    menuARState.scaleFactor =
        1;


    menuARState.currentRotation =
        0;


    menuARState.surfaceFound =
        false;


    menuARState.appState =
        "SCANNING";


    reticle.visible =
        false;


    hideInteractionControls();


    disableManipulationControls();


    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;


    const foodName =
        getFoodName(
            menuARState.selectedFood
        );


    setStatus(
        `${foodName} removed. Scan the table to place a new dish.`
    );


    console.log(
        "Placed food removed. Returned to scanning."
    );

}


// ==========================================
// CONFIRM PREVIEW
// ==========================================

function confirmPreview() {

    if (
        !canManipulate()
    ) {

        return;

    }


    menuARState.appState =
        "CONFIRMED";


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;


    // Lock dish selection.

    burgerBtn.disabled =
        true;


    pizzaBtn.disabled =
        true;


    // Lock all manipulation.

    disableManipulationControls();


    confirmBtn.textContent =
        "✓ Preview Confirmed";


    const foodName =
        getFoodName(
            menuARState.selectedFood
        );


    setStatus(
        `Preview confirmed — ${foodName} is locked in place.`
    );


    console.log(
        "MenuAR preview confirmed."
    );

}


// ==========================================
// XR TAP / SELECT EVENT
// ==========================================

function onXRSelect() {

    // --------------------------------------
    // FIRST PLACEMENT
    // --------------------------------------

    if (

        menuARState.appState ===
            "SURFACE_FOUND" &&

        !menuARState.placedObject &&

        reticle.visible

    ) {

        placeSelectedFood();


        return;

    }


    // --------------------------------------
    // MOVE / REPOSITION
    // --------------------------------------

    if (

        menuARState.appState ===
            "MOVE_MODE" &&

        menuARState.placedObject &&

        reticle.visible

    ) {

        repositionPlacedFood();

    }

}


// ==========================================
// XR FRAME LOOP
// ==========================================

function render(
    timestamp,
    frame
) {

    const shouldRunHitTest =

        menuARState.appState ===
            "SCANNING" ||

        menuARState.appState ===
            "SURFACE_FOUND" ||

        menuARState.appState ===
            "MOVE_MODE";


    if (

        frame &&

        hitTestSource &&

        referenceSpace &&

        shouldRunHitTest

    ) {

        const hitTestResults =

            frame.getHitTestResults(
                hitTestSource
            );


        // ----------------------------------
        // SURFACE FOUND
        // ----------------------------------

        if (
            hitTestResults.length > 0
        ) {

            const hit =
                hitTestResults[0];


            const pose =
                hit.getPose(
                    referenceSpace
                );


            if (
                pose
            ) {

                reticle.visible =
                    true;


                reticle.matrix.fromArray(
                    pose.transform.matrix
                );


                menuARState.surfaceFound =
                    true;


                // --------------------------
                // INITIAL PLACEMENT MODE
                // --------------------------

                if (

                    !menuARState.placedObject &&

                    menuARState.appState !==
                        "MOVE_MODE"

                ) {

                    menuARState.appState =
                        "SURFACE_FOUND";


                    const foodName =
                        getFoodName(
                            menuARState.selectedFood
                        );


                    setStatus(
                        `${foodName} selected. Tap the white circle to place it.`
                    );

                }


                // --------------------------
                // MOVE MODE
                // --------------------------

                if (
                    menuARState.appState ===
                    "MOVE_MODE"
                ) {

                    setMoveModeStatus();

                }

            }

        }

        // ----------------------------------
        // NO SURFACE FOUND
        // ----------------------------------

        else {

            reticle.visible =
                false;


            menuARState.surfaceFound =
                false;


            // ------------------------------
            // MOVE MODE
            // ------------------------------

            if (
                menuARState.appState ===
                "MOVE_MODE"
            ) {

                setMoveModeStatus();

            }

            // ------------------------------
            // INITIAL SCANNING
            // ------------------------------

            else {

                menuARState.appState =
                    "SCANNING";


                const foodName =
                    getFoodName(
                        menuARState.selectedFood
                    );


                setStatus(
                    `${foodName} selected. Move your tablet slowly to scan the table.`
                );

            }

        }

    }


    // --------------------------------------
    // Hide reticle when no hit-testing mode
    // is active.
    // --------------------------------------

    if (
        !shouldRunHitTest
    ) {

        reticle.visible =
            false;

    }


    renderer.render(
        scene,
        camera
    );

}


// ==========================================
// FOOD BUTTON EVENTS
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
// ROTATION EVENTS
// ==========================================

rotateLeftBtn.addEventListener(

    "click",

    rotateLeft

);


rotateRightBtn.addEventListener(

    "click",

    rotateRight

);


// ==========================================
// SIZE EVENTS
// ==========================================

sizeDownBtn.addEventListener(

    "click",

    () => {

        changeSize(
            -1
        );

    }

);


sizeUpBtn.addEventListener(

    "click",

    () => {

        changeSize(
            1
        );

    }

);


// ==========================================
// MOVE EVENT
// ==========================================

moveBtn.addEventListener(

    "click",

    enterMoveMode

);


// ==========================================
// REMOVE EVENT
// ==========================================

removeBtn.addEventListener(

    "click",

    removeFood

);


// ==========================================
// CONFIRM EVENT
// ==========================================

confirmBtn.addEventListener(

    "click",

    confirmPreview

);


// ==========================================
// START / EXIT EVENTS
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
// PREVENT DOM BUTTON TAPS FROM ALSO
// BECOMING XR WORLD TAPS
// ==========================================
//
// This helps prevent pressing Burger/Pizza
// or another HTML control from accidentally
// placing or moving the 3D object.
//

arControls.addEventListener(

    "beforexrselect",

    (event) => {

        event.preventDefault();

    }

);


// ==========================================
// WINDOW RESIZE
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
// APPLICATION INITIALIZATION
// ==========================================

async function initializeApplication() {

    initThreeJS();


    resetControls();


    updateFoodButtons(
        "burger"
    );


    await Promise.all([

        loadModels(),

        checkXRSupport()

    ]);


    updateStartButton();

}


// ==========================================
// START MENUAR
// ==========================================

initializeApplication();