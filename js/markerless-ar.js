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

const xrIntro =
    document.getElementById("xrIntro");

const xrSupportMessage =
    document.getElementById("xrSupportMessage");

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
// APPLICATION STATE
// ==========================================

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

    scaleFactor:
        1,

    currentRotation:
        0

};



// ==========================================
// MODEL CONFIGURATION
// ==========================================

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


// Prevent HTML control taps from also
// being interpreted as XR placement taps.

const UI_SELECT_GUARD_MS =
    650;


// Prevent the Move button tap itself
// from immediately repositioning the model.

const MOVE_ACTIVATION_DELAY_MS =
    700;


let ignoreXRSelectUntil =
    0;


let moveModeStartedAt =
    0;



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
// MODEL TEMPLATES
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



    // ======================================
    // LIGHTING
    // ======================================

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



    // ======================================
    // HIT-TEST RETICLE
    // ======================================

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



    // ======================================
    // XR CONTROLLER
    // ======================================

    controller =
        renderer.xr.getController(0);



    controller.addEventListener(

        "select",

        onXRSelect

    );



    scene.add(
        controller
    );



    renderer.setAnimationLoop(
        render
    );

}



// ==========================================
// STATUS
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
// PRE-AR SUPPORT MESSAGE
// ==========================================

function showSupportMessage(message) {


    xrSupportMessage.textContent =
        message;


    xrSupportMessage.hidden =
        false;

}



function hideSupportMessage() {


    xrSupportMessage.textContent =
        "";


    xrSupportMessage.hidden =
        true;

}



// ==========================================
// FOOD NAME
// ==========================================

function getFoodName(food) {


    return food === "burger"
        ? "Burger"
        : "Pizza";

}



// ==========================================
// LOAD MODEL
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


    } catch (error) {


        menuARState.modelsReady =
            false;



        showSupportMessage(
            "The 3D food models could not be loaded. Refresh the page and try again."
        );



        console.error(
            "Model loading failed:",
            error
        );

    }

}



// ==========================================
// FOOD BUTTON APPEARANCE
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
// SELECT / CHANGE FOOD
// ==========================================

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



    // ======================================
    // REPLACE ALREADY PLACED MODEL
    // ======================================

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



    // ======================================
    // INSIDE AR BUT NOT PLACED YET
    // ======================================

    if (
        xrSession
    ) {


        if (
            menuARState.appState ===
            "SURFACE_FOUND"
        ) {


            setStatus(
                `${foodName} selected. Tap the white circle to place it.`
            );


        } else {


            setStatus(
                `${foodName} selected. Move your device slowly across the table.`
            );

        }

    }

}



// ==========================================
// REPLACE PLACED FOOD
// ==========================================

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

        return;

    }



    const oldModel =
        menuARState.placedObject;



    const newConfig =
        MODEL_CONFIG[newFood];



    const previousConfig =
        MODEL_CONFIG[previousFood];



    // --------------------------------------
    // Preserve exact transform
    // --------------------------------------

    const savedPosition =
        oldModel.position.clone();



    const savedQuaternion =
        oldModel.quaternion.clone();



    const savedScaleFactor =
        menuARState.scaleFactor;



    scene.remove(
        oldModel
    );



    const newModel =
        template.clone(true);



    // Position

    newModel.position.copy(
        savedPosition
    );



    newModel.position.y +=

        newConfig.surfaceOffset -

        previousConfig.surfaceOffset;



    // Rotation

    newModel.quaternion.copy(
        savedQuaternion
    );



    // Scale

    newModel.scale.setScalar(

        newConfig.baseScale *

        savedScaleFactor

    );



    scene.add(
        newModel
    );



    menuARState.placedObject =
        newModel;



    menuARState.scaleFactor =
        savedScaleFactor;



    const foodName =
        getFoodName(
            newFood
        );



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

}



// ==========================================
// WEBXR SUPPORT
// ==========================================

async function checkXRSupport() {


    // --------------------------------------
    // Browser does not expose WebXR
    // --------------------------------------

    if (
        !navigator.xr
    ) {


        menuARState.xrSupported =
            false;


        menuARState.appState =
            "UNSUPPORTED";



        showSupportMessage(
            "Markerless AR is not supported on this device or browser."
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


            hideSupportMessage();


        } else {


            menuARState.appState =
                "UNSUPPORTED";



            showSupportMessage(
                "Markerless AR is not supported on this device or browser."
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



        showSupportMessage(
            "Unable to confirm markerless AR support on this device."
        );



        updateStartButton();

    }

}



// ==========================================
// START BUTTON
// ==========================================

function updateStartButton() {


    const ready =

        menuARState.xrSupported &&

        menuARState.modelsReady;



    if (
        ready
    ) {


        startARBtn.disabled =
            false;


        startARBtn.textContent =
            "Start";


        hideSupportMessage();


        return;

    }



    startARBtn.disabled =
        true;



    if (
        !menuARState.xrSupported
    ) {


        startARBtn.textContent =
            "Not Supported";


        return;

    }



    if (
        !menuARState.modelsReady
    ) {


        startARBtn.textContent =
            "Loading...";

    }

}



// ==========================================
// SHOW AR INTERFACE
// ==========================================

function showARInterface() {


    xrIntro.hidden =
        true;


    arControls.hidden =
        false;

}



// ==========================================
// SHOW NORMAL INTERFACE
// ==========================================

function showPreARInterface() {


    arControls.hidden =
        true;


    xrIntro.hidden =
        false;

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



    startARBtn.disabled =
        true;



    startARBtn.textContent =
        "Starting...";



    hideSupportMessage();



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



        showARInterface();



        hideInteractionControls();



        updateFoodButtons(
            menuARState.selectedFood
        );



        setStatus(
            `${getFoodName(menuARState.selectedFood)} selected. Move your device slowly across the table.`
        );


    } catch (error) {


        console.error(
            "Unable to start AR:",
            error
        );



        xrSession =
            null;



        showPreARInterface();



        // ----------------------------------
        // Permission denied
        // ----------------------------------

        if (
            error.name ===
            "NotAllowedError"
        ) {


            showSupportMessage(
                "AR permission was not granted. Allow camera and AR access, then try again."
            );


            startARBtn.disabled =
                false;


            startARBtn.textContent =
                "Try Again";


            return;

        }



        // ----------------------------------
        // Required WebXR feature unavailable
        // ----------------------------------

        if (
            error.name ===
            "NotSupportedError"
        ) {


            menuARState.xrSupported =
                false;


            menuARState.appState =
                "UNSUPPORTED";


            showSupportMessage(
                "This device or browser does not support the markerless AR features required by MenuAR."
            );


            startARBtn.disabled =
                true;


            startARBtn.textContent =
                "Not Supported";


            return;

        }



        // ----------------------------------
        // Other failure
        // ----------------------------------

        showSupportMessage(
            "Markerless AR could not start. Check browser permissions and try again."
        );


        startARBtn.disabled =
            false;


        startARBtn.textContent =
            "Try Again";

    }

}



// ==========================================
// END AR
// ==========================================

async function endARSession() {


    if (
        xrSession
    ) {


        await xrSession.end();

    }

}



// ==========================================
// REMOVE FROM SCENE
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
// CONTROL VISIBILITY
// ==========================================

function showInteractionControls() {


    interactionControls.classList.add(
        "is-visible"
    );

}



function hideInteractionControls() {


    interactionControls.classList.remove(
        "is-visible"
    );

}



// ==========================================
// ENABLE MANIPULATION CONTROLS
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
// DISABLE MANIPULATION CONTROLS
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
// RESET CONTROLS
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



    showPreARInterface();



    updateStartButton();

}



// ==========================================
// PLACE FOOD
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



    menuARState.scaleFactor =
        1;



    placedModel.scale.setScalar(
        config.baseScale
    );



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



    showInteractionControls();



    enableManipulationControls();



    setStatus(
        `${getFoodName(food)} placed. Rotate, resize, move, change dish, remove or confirm.`
    );

}



// ==========================================
// ROTATION
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
// CAN MANIPULATE?
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
// SIZE
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



    menuARState.placedObject.scale.setScalar(

        config.baseScale *

        menuARState.scaleFactor

    );



    setStatus(

        `${getFoodName(menuARState.selectedFood)} size: ${Math.round(menuARState.scaleFactor * 100)}%.`

    );

}



// ==========================================
// MOVE MODE
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



    moveModeStartedAt =
        performance.now();



    ignoreXRSelectUntil =

        performance.now() +

        UI_SELECT_GUARD_MS;



    setMoveModeControls();



    setStatus(
        "Move mode — point at a new position, then tap the white circle."
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
            `${foodName} move mode — tap the white circle to reposition it.`
        );


    } else {


        setStatus(
            `${foodName} move mode — scan for a new position.`
        );

    }

}



// ==========================================
// REPOSITION MODEL
// ==========================================
//
// ONLY THE POSITION IS ALLOWED TO CHANGE.
// SCALE AND ROTATION ARE EXPLICITLY RESTORED.
// ==========================================

function repositionPlacedFood() {


    if (

        menuARState.appState !==
            "MOVE_MODE" ||

        !menuARState.placedObject ||

        !reticle.visible

    ) {

        return;

    }



    // --------------------------------------
    // Save exact transform
    // --------------------------------------

    const savedQuaternion =

        menuARState.placedObject
            .quaternion
            .clone();



    const savedScale =

        menuARState.placedObject
            .scale
            .clone();



    const savedScaleFactor =
        menuARState.scaleFactor;



    const savedRotation =
        menuARState.currentRotation;



    // --------------------------------------
    // Calculate new position
    // --------------------------------------

    const newPosition =
        new THREE.Vector3();



    newPosition.setFromMatrixPosition(
        reticle.matrix
    );



    const config =
        MODEL_CONFIG[
            menuARState.selectedFood
        ];



    // --------------------------------------
    // Change position
    // --------------------------------------

    menuARState.placedObject.position.copy(
        newPosition
    );



    menuARState.placedObject.position.y +=
        config.surfaceOffset;



    // --------------------------------------
    // Restore rotation
    // --------------------------------------

    menuARState.placedObject.quaternion.copy(
        savedQuaternion
    );



    // --------------------------------------
    // Restore size
    // --------------------------------------

    menuARState.placedObject.scale.copy(
        savedScale
    );



    menuARState.scaleFactor =
        savedScaleFactor;



    menuARState.currentRotation =
        savedRotation;



    // --------------------------------------
    // Leave Move Mode
    // --------------------------------------

    menuARState.appState =
        "PLACED";



    menuARState.surfaceFound =
        false;



    reticle.visible =
        false;



    enableManipulationControls();



    setStatus(
        `${getFoodName(menuARState.selectedFood)} moved. Size and rotation preserved.`
    );

}



// ==========================================
// REMOVE
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



    setStatus(
        `${getFoodName(menuARState.selectedFood)} removed. Scan to place again.`
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



    burgerBtn.disabled =
        true;



    pizzaBtn.disabled =
        true;



    disableManipulationControls();



    confirmBtn.textContent =
        "✓ Preview Confirmed";



    setStatus(
        `Preview confirmed — ${getFoodName(menuARState.selectedFood)} is locked in place.`
    );

}



// ==========================================
// XR SELECT
// ==========================================

function onXRSelect() {


    const now =
        performance.now();



    // --------------------------------------
    // Ignore XR select caused by HTML UI tap
    // --------------------------------------

    if (
        now <
        ignoreXRSelectUntil
    ) {

        return;

    }



    // --------------------------------------
    // Initial placement
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
    // Move Mode
    // --------------------------------------

    if (

        menuARState.appState ===
            "MOVE_MODE" &&

        menuARState.placedObject &&

        reticle.visible

    ) {


        if (

            now -
            moveModeStartedAt <

            MOVE_ACTIVATION_DELAY_MS

        ) {

            return;

        }



        repositionPlacedFood();

    }

}



// ==========================================
// HIT TEST / RENDER LOOP
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



                if (

                    !menuARState.placedObject &&

                    menuARState.appState !==
                        "MOVE_MODE"

                ) {


                    menuARState.appState =
                        "SURFACE_FOUND";



                    setStatus(
                        `${getFoodName(menuARState.selectedFood)} selected. Tap the white circle to place it.`
                    );

                }



                if (
                    menuARState.appState ===
                    "MOVE_MODE"
                ) {


                    setMoveModeStatus();

                }

            }


        } else {


            reticle.visible =
                false;



            menuARState.surfaceFound =
                false;



            if (
                menuARState.appState ===
                "MOVE_MODE"
            ) {


                setMoveModeStatus();


            } else {


                menuARState.appState =
                    "SCANNING";



                setStatus(
                    `${getFoodName(menuARState.selectedFood)} selected. Move your device slowly across the table.`
                );

            }

        }

    }



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
// UI → XR TAP PROTECTION
// ==========================================

function markUITouch() {


    ignoreXRSelectUntil =

        performance.now() +

        UI_SELECT_GUARD_MS;

}



// Prevent HTML controls from accidentally
// moving or placing the 3D model.

arControls.addEventListener(

    "pointerdown",

    markUITouch,

    true

);



arControls.addEventListener(

    "touchstart",

    markUITouch,

    {

        capture:
            true,

        passive:
            true

    }

);



arControls.addEventListener(

    "beforexrselect",

    (event) => {


        event.preventDefault();


        markUITouch();

    }

);



// ==========================================
// FOOD EVENTS
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
// MOVE
// ==========================================

moveBtn.addEventListener(

    "click",

    enterMoveMode

);



// ==========================================
// REMOVE
// ==========================================

removeBtn.addEventListener(

    "click",

    removeFood

);



// ==========================================
// CONFIRM
// ==========================================

confirmBtn.addEventListener(

    "click",

    confirmPreview

);



// ==========================================
// START
// ==========================================

startARBtn.addEventListener(

    "click",

    async () => {


        await startARSession();

    }

);



// ==========================================
// EXIT AR
// ==========================================

exitARBtn.addEventListener(

    "click",

    async () => {


        await endARSession();

    }

);



// ==========================================
// RESIZE
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
// INITIALIZATION
// ==========================================

async function initializeApplication() {


    // Initial page:
    // no Burger/Pizza controls yet.

    showPreARInterface();



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



initializeApplication();