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
//
// Increased after real mobile testing.
// These are starting real-world calibration
// values for the new realistic models.
// ==========================================

const MODEL_CONFIG = {


    burger: {

        src:
            "assets/models/burger.glb",

        baseScale:
            0.60,

        surfaceOffset:
            0.018

    },


    pizza: {

        src:
            "assets/models/pizza.glb",

        baseScale:
            0.53,

        surfaceOffset:
            0.014

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


const UI_SELECT_GUARD_MS =
    650;


const MOVE_ACTIVATION_DELAY_MS =
    700;



// ==========================================
// PLACEMENT ANIMATION
// ==========================================

const PLACEMENT_ANIMATION_DURATION =
    420;


const PLACEMENT_START_SCALE_FACTOR =
    0.78;


const PLACEMENT_LIFT =
    0.055;


const SHADOW_FINAL_OPACITY =
    0.26;



let placementAnimation =
    null;


let confirmationAnimation =
    null;



// ==========================================
// UI GUARD STATE
// ==========================================

let ignoreXRSelectUntil =
    0;


let moveModeStartedAt =
    0;



// ==========================================
// THREE / WEBXR
// ==========================================

let scene;

let camera;

let renderer;

let reticle;

let controller;

let directionalLight;

let shadowReceiver;


let xrSession =
    null;


let hitTestSource =
    null;


let viewerSpace =
    null;


let referenceSpace =
    null;



// ==========================================
// WEB AUDIO
// ==========================================

let audioContext =
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



    // ======================================
    // SHADOW SUPPORT
    // ======================================

    renderer.shadowMap.enabled =
        true;


    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;



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

            2.2

        );


    scene.add(
        hemisphereLight
    );



    directionalLight =
        new THREE.DirectionalLight(

            0xffffff,

            1.7

        );



    directionalLight.castShadow =
        true;



    directionalLight.position.set(

        1,

        3,

        2

    );



    directionalLight.shadow.mapSize.width =
        1024;


    directionalLight.shadow.mapSize.height =
        1024;



    directionalLight.shadow.camera.near =
        0.1;


    directionalLight.shadow.camera.far =
        6;



    directionalLight.shadow.camera.left =
        -1.2;


    directionalLight.shadow.camera.right =
        1.2;


    directionalLight.shadow.camera.top =
        1.2;


    directionalLight.shadow.camera.bottom =
        -1.2;



    directionalLight.shadow.bias =
        -0.0004;


    directionalLight.shadow.normalBias =
        0.015;



    scene.add(
        directionalLight
    );



    scene.add(
        directionalLight.target
    );



    // ======================================
    // CONTACT SHADOW RECEIVER
    // ======================================
    //
    // This is a transparent virtual plane.
    // Only the model's soft shadow is visible
    // over the real camera image.
    // ======================================

    const shadowGeometry =
        new THREE.PlaneGeometry(

            0.75,

            0.75

        );



    shadowGeometry.rotateX(
        -Math.PI / 2
    );



    const shadowMaterial =
        new THREE.ShadowMaterial({

            color:
                0x000000,

            opacity:
                SHADOW_FINAL_OPACITY,

            transparent:
                true

        });



    shadowReceiver =
        new THREE.Mesh(

            shadowGeometry,

            shadowMaterial

        );



    shadowReceiver.receiveShadow =
        true;


    shadowReceiver.visible =
        false;



    scene.add(
        shadowReceiver
    );



    // ======================================
    // RETICLE
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
// AUDIO INITIALIZATION
// ==========================================

function ensureAudioContext() {


    const AudioContextClass =

        window.AudioContext ||

        window.webkitAudioContext;



    if (
        !AudioContextClass
    ) {

        return false;

    }



    if (
        !audioContext
    ) {


        audioContext =
            new AudioContextClass();

    }



    if (
        audioContext.state ===
        "suspended"
    ) {


        audioContext.resume();

    }



    return true;

}



// ==========================================
// SYNTHESIZED TONE
// ==========================================

function playTone(

    startFrequency,

    endFrequency,

    duration,

    volume,

    delay = 0

) {


    if (
        !ensureAudioContext()
    ) {

        return;

    }



    const now =

        audioContext.currentTime +

        delay;



    const oscillator =
        audioContext.createOscillator();



    const gain =
        audioContext.createGain();



    oscillator.type =
        "sine";



    oscillator.frequency.setValueAtTime(

        startFrequency,

        now

    );



    oscillator.frequency.exponentialRampToValueAtTime(

        Math.max(
            endFrequency,
            1
        ),

        now +
        duration

    );



    gain.gain.setValueAtTime(

        0.0001,

        now

    );



    gain.gain.exponentialRampToValueAtTime(

        volume,

        now +
        0.015

    );



    gain.gain.exponentialRampToValueAtTime(

        0.0001,

        now +
        duration

    );



    oscillator.connect(
        gain
    );



    gain.connect(
        audioContext.destination
    );



    oscillator.start(
        now
    );



    oscillator.stop(

        now +
        duration +
        0.03

    );

}



// ==========================================
// PLACEMENT SOUND
// ==========================================

function playPlacementSound() {


    playTone(

        190,

        115,

        0.14,

        0.028

    );

}



// ==========================================
// CONFIRMATION SOUND
// ==========================================

function playConfirmationSound() {


    playTone(

        523,

        523,

        0.11,

        0.022,

        0

    );


    playTone(

        659,

        659,

        0.16,

        0.024,

        0.09

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
// SUPPORT MESSAGE
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
// MODEL SHADOW PREPARATION
// ==========================================

function prepareModelForAR(model) {


    model.traverse(

        (child) => {


            if (
                child.isMesh
            ) {


                child.castShadow =
                    true;


                child.receiveShadow =
                    false;

            }

        }

    );

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



                    prepareModelForAR(
                        modelTemplates[food]
                    );



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
// LOAD MODELS
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
// SELECT FOOD
// ==========================================

function selectFood(food) {


    if (

        menuARState.appState ===
            "CONFIRMED" ||

        menuARState.appState ===
            "PLACING"

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
// UPDATE SHADOW LIGHT
// ==========================================

function updateLightForObject(object) {


    if (

        !object ||

        !directionalLight

    ) {

        return;

    }



    directionalLight.target.position.copy(
        object.position
    );



    directionalLight.position.copy(
        object.position
    );



    directionalLight.position.add(

        new THREE.Vector3(
            0.9,
            1.8,
            0.8
        )

    );



    directionalLight.target.updateMatrixWorld();

}



// ==========================================
// POSITION SHADOW FROM RETICLE
// ==========================================

function positionShadowFromReticle() {


    if (
        !shadowReceiver
    ) {

        return;

    }



    const position =
        new THREE.Vector3();



    const quaternion =
        new THREE.Quaternion();



    const ignoredScale =
        new THREE.Vector3();



    reticle.matrix.decompose(

        position,

        quaternion,

        ignoredScale

    );



    shadowReceiver.position.copy(
        position
    );



    shadowReceiver.quaternion.copy(
        quaternion
    );



    // Slight offset above surface
    // helps avoid visual z-fighting.

    const surfaceNormal =
        new THREE.Vector3(
            0,
            1,
            0
        );



    surfaceNormal.applyQuaternion(
        quaternion
    );



    shadowReceiver.position.addScaledVector(

        surfaceNormal,

        0.002

    );



    shadowReceiver.visible =
        true;

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



    prepareModelForAR(
        newModel
    );



    newModel.position.copy(
        savedPosition
    );



    newModel.position.y +=

        newConfig.surfaceOffset -

        previousConfig.surfaceOffset;



    newModel.quaternion.copy(
        savedQuaternion
    );



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



    updateLightForObject(
        newModel
    );



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



    startARBtn.textContent =
        "Loading...";

}



// ==========================================
// SHOW AR INTERFACE
// ==========================================

function showARInterface() {


    xrIntro.hidden =
        true;


    arControls.hidden =
        false;



    arControls.classList.remove(
        "xr-panel-enter"
    );



    void arControls.offsetWidth;



    arControls.classList.add(
        "xr-panel-enter"
    );

}



// ==========================================
// PRE-AR INTERFACE
// ==========================================

function showPreARInterface() {


    arControls.hidden =
        true;


    xrIntro.hidden =
        false;



    arControls.classList.remove(
        "xr-panel-enter"
    );

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



    ensureAudioContext();



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
// REMOVE PLACED OBJECT
// ==========================================

function removePlacedObjectFromScene() {


    placementAnimation =
        null;


    confirmationAnimation =
        null;



    if (
        menuARState.placedObject
    ) {


        scene.remove(
            menuARState.placedObject
        );



        menuARState.placedObject =
            null;

    }



    if (
        shadowReceiver
    ) {


        shadowReceiver.visible =
            false;

    }

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
// ENABLE CONTROLS
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
// DISABLE CONTROLS
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



    confirmBtn.classList.remove(
        "confirmed-feedback"
    );



    statusMessage.classList.remove(
        "confirmed-feedback"
    );

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
// START PLACEMENT ANIMATION
// ==========================================

function startPlacementAnimation(

    model,

    food,

    finalScale,

    finalY

) {


    const startScale =

        finalScale *

        PLACEMENT_START_SCALE_FACTOR;



    model.scale.setScalar(
        startScale
    );



    model.position.y =

        finalY +

        PLACEMENT_LIFT;



    burgerBtn.disabled =
        true;


    pizzaBtn.disabled =
        true;



    menuARState.appState =
        "PLACING";



    shadowReceiver.material.opacity =
        0;



    placementAnimation = {

        model:
            model,

        food:
            food,

        startTime:
            null,

        duration:
            PLACEMENT_ANIMATION_DURATION,

        startScale:
            startScale,

        finalScale:
            finalScale,

        startY:
            finalY +
            PLACEMENT_LIFT,

        finalY:
            finalY

    };



    setStatus(
        `Placing ${getFoodName(food)}...`
    );

}



// ==========================================
// EASING
// ==========================================

function easeOutCubic(t) {


    return (
        1 -
        Math.pow(
            1 - t,
            3
        )
    );

}



function easeOutBack(t) {


    const c1 =
        1.70158;


    const c3 =
        c1 +
        1;



    return (

        1 +

        c3 *
        Math.pow(
            t - 1,
            3
        ) +

        c1 *
        Math.pow(
            t - 1,
            2
        )

    );

}



// ==========================================
// UPDATE PLACEMENT ANIMATION
// ==========================================

function updatePlacementAnimation(timestamp) {


    if (
        !placementAnimation
    ) {

        return;

    }



    if (
        placementAnimation.startTime ===
        null
    ) {


        placementAnimation.startTime =
            timestamp;

    }



    const elapsed =

        timestamp -

        placementAnimation.startTime;



    const progress =

        THREE.MathUtils.clamp(

            elapsed /

            placementAnimation.duration,

            0,

            1

        );



    const positionEase =
        easeOutCubic(
            progress
        );



    const scaleEase =
        easeOutBack(
            progress
        );



    const currentY =

        THREE.MathUtils.lerp(

            placementAnimation.startY,

            placementAnimation.finalY,

            positionEase

        );



    const currentScale =

        THREE.MathUtils.lerp(

            placementAnimation.startScale,

            placementAnimation.finalScale,

            scaleEase

        );



    placementAnimation.model.position.y =
        currentY;



    placementAnimation.model.scale.setScalar(
        currentScale
    );



    shadowReceiver.material.opacity =

        SHADOW_FINAL_OPACITY *

        positionEase;



    if (
        progress >=
        1
    ) {


        const completedFood =
            placementAnimation.food;



        placementAnimation.model.position.y =
            placementAnimation.finalY;



        placementAnimation.model.scale.setScalar(
            placementAnimation.finalScale
        );



        shadowReceiver.material.opacity =
            SHADOW_FINAL_OPACITY;



        placementAnimation =
            null;



        menuARState.appState =
            "PLACED";



        burgerBtn.disabled =
            false;


        pizzaBtn.disabled =
            false;



        showInteractionControls();



        enableManipulationControls();



        setStatus(
            `${getFoodName(completedFood)} placed. Rotate, resize, move, change dish, remove or confirm.`
        );



        playPlacementSound();

    }

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



    prepareModelForAR(
        placedModel
    );



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



    const finalY =
        placedModel.position.y;



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



    scene.add(
        placedModel
    );



    menuARState.placedObject =
        placedModel;



    menuARState.currentRotation =
        0;


    menuARState.surfaceFound =
        false;



    positionShadowFromReticle();



    updateLightForObject(
        placedModel
    );



    reticle.visible =
        false;



    hideInteractionControls();



    disableManipulationControls();



    startPlacementAnimation(

        placedModel,

        food,

        config.baseScale,

        finalY

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
// CAN MANIPULATE
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
// MOVE STATUS
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

function repositionPlacedFood() {


    if (

        menuARState.appState !==
            "MOVE_MODE" ||

        !menuARState.placedObject ||

        !reticle.visible

    ) {

        return;

    }



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



    menuARState.placedObject.quaternion.copy(
        savedQuaternion
    );



    menuARState.placedObject.scale.copy(
        savedScale
    );



    menuARState.scaleFactor =
        savedScaleFactor;



    menuARState.currentRotation =
        savedRotation;



    positionShadowFromReticle();



    shadowReceiver.material.opacity =
        SHADOW_FINAL_OPACITY;



    updateLightForObject(
        menuARState.placedObject
    );



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
// CONFIRM MODEL ANIMATION
// ==========================================

function startConfirmationAnimation() {


    if (
        !menuARState.placedObject
    ) {

        return;

    }



    confirmationAnimation = {

        model:
            menuARState.placedObject,

        originalScale:
            menuARState.placedObject
                .scale
                .clone(),

        startTime:
            null,

        duration:
            520

    };

}



// ==========================================
// UPDATE CONFIRMATION ANIMATION
// ==========================================

function updateConfirmationAnimation(timestamp) {


    if (
        !confirmationAnimation
    ) {

        return;

    }



    if (
        confirmationAnimation.startTime ===
        null
    ) {


        confirmationAnimation.startTime =
            timestamp;

    }



    const elapsed =

        timestamp -

        confirmationAnimation.startTime;



    const progress =

        THREE.MathUtils.clamp(

            elapsed /

            confirmationAnimation.duration,

            0,

            1

        );



    const pulse =

        1 +

        (
            0.055 *

            Math.sin(
                Math.PI *
                progress
            )
        );



    confirmationAnimation.model.scale.copy(

        confirmationAnimation.originalScale

    );



    confirmationAnimation.model.scale.multiplyScalar(
        pulse
    );



    if (
        progress >=
        1
    ) {


        confirmationAnimation.model.scale.copy(

            confirmationAnimation.originalScale

        );



        confirmationAnimation =
            null;

    }

}



// ==========================================
// CONFIRM UI ANIMATION
// ==========================================

function triggerConfirmationUIAnimation() {


    confirmBtn.classList.remove(
        "confirmed-feedback"
    );


    statusMessage.classList.remove(
        "confirmed-feedback"
    );



    void confirmBtn.offsetWidth;



    confirmBtn.classList.add(
        "confirmed-feedback"
    );


    statusMessage.classList.add(
        "confirmed-feedback"
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



    startConfirmationAnimation();



    triggerConfirmationUIAnimation();



    playConfirmationSound();

}



// ==========================================
// XR SELECT
// ==========================================

function onXRSelect() {


    const now =
        performance.now();



    if (
        now <
        ignoreXRSelectUntil
    ) {

        return;

    }



    if (

        menuARState.appState ===
            "SURFACE_FOUND" &&

        !menuARState.placedObject &&

        reticle.visible

    ) {


        placeSelectedFood();


        return;

    }



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
// HIT TEST / RENDER
// ==========================================

function render(

    timestamp,

    frame

) {


    // --------------------------------------
    // 3D Animations
    // --------------------------------------

    updatePlacementAnimation(
        timestamp
    );



    updateConfirmationAnimation(
        timestamp
    );



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
// ROTATION
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
// SIZE
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


        ensureAudioContext();



        await startARSession();

    }

);



// ==========================================
// EXIT
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