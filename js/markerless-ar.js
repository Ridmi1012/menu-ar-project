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

const sizeSmallBtn =
    document.getElementById("sizeSmallBtn");

const sizeMediumBtn =
    document.getElementById("sizeMediumBtn");

const sizeLargeBtn =
    document.getElementById("sizeLargeBtn");

const moveBtn =
    document.getElementById("moveBtn");

const removeBtn =
    document.getElementById("removeBtn");

const confirmBtn =
    document.getElementById("confirmBtn");



// ==========================================
// SIZE PRESETS
// ==========================================
//
// These are visual preview categories.
//
// Do not describe them as exact restaurant
// dimensions unless the restaurant provides
// actual serving measurements.
// ==========================================

const SIZE_PRESETS = {

    small: {

        label:
            "Small",

        factor:
            0.78

    },


    medium: {

        label:
            "Medium",

        factor:
            1.0

    },


    large: {

        label:
            "Large",

        factor:
            1.30

    }

};



// ==========================================
// APPLICATION STATE
// ==========================================

const menuARState = {

    selectedFood:
        "burger",

    selectedSize:
        "medium",

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

    currentRotation:
        0

};



// ==========================================
// MODEL CONFIGURATION
// ==========================================
//
// Increased from the previous calibration.
//
// Medium is now the default.
//
// Small and Large are calculated using
// SIZE_PRESETS.
// ==========================================

const MODEL_CONFIG = {


    burger: {

        src:
            "assets/models/burger.glb",

        baseScale:
            0.72,

        surfaceOffset:
            0.018,

        shadowWidth:
            0.28,

        shadowDepth:
            0.23

    },


    pizza: {

        src:
            "assets/models/pizza.glb",

        baseScale:
            0.64,

        surfaceOffset:
            0.014,

        shadowWidth:
            0.38,

        shadowDepth:
            0.35

    }


};



// ==========================================
// INTERACTION CONFIGURATION
// ==========================================

const ROTATION_STEP =
    THREE.MathUtils.degToRad(15);


const UI_SELECT_GUARD_MS =
    650;


const MOVE_ACTIVATION_DELAY_MS =
    700;



let ignoreXRSelectUntil =
    0;


let moveModeStartedAt =
    0;



// ==========================================
// PLACEMENT ANIMATION
// ==========================================
//
// More noticeable than the previous version.
// ==========================================

const PLACEMENT_DURATION =
    560;


const PLACEMENT_START_SCALE_FACTOR =
    0.45;


const PLACEMENT_LIFT =
    0.10;



let placementAnimation =
    null;


let confirmationAnimation =
    null;



// ==========================================
// SHADOW SETTINGS
// ==========================================

const SHADOW_OPACITY =
    0.44;



// ==========================================
// THREE / WEBXR
// ==========================================

let scene;

let camera;

let renderer;

let reticle;

let controller;

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
// AUDIO
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
// CREATE SOFT SHADOW TEXTURE
// ==========================================
//
// A radial-gradient texture gives a much
// clearer contact shadow than the previous
// real-time ShadowMaterial approach.
//
// No image file is required.
// ==========================================

function createSoftShadowTexture() {


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        256;


    canvas.height =
        256;



    const context =
        canvas.getContext(
            "2d"
        );



    const gradient =
        context.createRadialGradient(

            128,
            128,
            10,

            128,
            128,
            118

        );



    gradient.addColorStop(
        0,
        "rgba(0, 0, 0, 0.58)"
    );


    gradient.addColorStop(
        0.35,
        "rgba(0, 0, 0, 0.34)"
    );


    gradient.addColorStop(
        0.72,
        "rgba(0, 0, 0, 0.12)"
    );


    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );



    context.fillStyle =
        gradient;



    context.fillRect(
        0,
        0,
        256,
        256
    );



    const texture =
        new THREE.CanvasTexture(
            canvas
        );



    texture.colorSpace =
        THREE.SRGBColorSpace;



    return texture;

}



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
    // PBR DISPLAY QUALITY
    // ======================================

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        1.08;



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

            0x777777,

            1.8

        );


    scene.add(
        hemisphereLight
    );



    const directionalLight =
        new THREE.DirectionalLight(

            0xffffff,

            2.0

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
    // SOFT CONTACT SHADOW
    // ======================================

    const shadowGeometry =
        new THREE.PlaneGeometry(

            1,

            1

        );



    shadowGeometry.rotateX(
        -Math.PI / 2
    );



    const shadowMaterial =
        new THREE.MeshBasicMaterial({

            map:
                createSoftShadowTexture(),

            transparent:
                true,

            opacity:
                SHADOW_OPACITY,

            depthWrite:
                false,

            side:
                THREE.DoubleSide

        });



    shadowReceiver =
        new THREE.Mesh(

            shadowGeometry,

            shadowMaterial

        );



    shadowReceiver.visible =
        false;



    shadowReceiver.renderOrder =
        1;



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
// AUDIO
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

        220,

        125,

        0.18,

        0.045

    );


    playTone(

        420,

        320,

        0.10,

        0.018,

        0.03

    );

}



// ==========================================
// CONFIRMATION SOUND
// ==========================================

function playConfirmationSound() {


    playTone(

        523,

        523,

        0.12,

        0.035

    );


    playTone(

        659,

        659,

        0.17,

        0.038,

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
// CURRENT SIZE
// ==========================================

function getCurrentSizePreset() {


    return SIZE_PRESETS[
        menuARState.selectedSize
    ];

}



// ==========================================
// CURRENT MODEL SCALE
// ==========================================

function getCurrentModelScale(food) {


    const config =
        MODEL_CONFIG[food];


    const size =
        getCurrentSizePreset();



    return (

        config.baseScale *

        size.factor

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
            "The food previews could not be loaded. Refresh the page and try again."
        );



        console.error(
            "Model loading failed:",
            error
        );

    }

}



// ==========================================
// FOOD BUTTON STATE
// ==========================================

function updateFoodButtons(food) {


    const burgerActive =
        food === "burger";



    burgerBtn.classList.toggle(
        "active",
        burgerActive
    );


    pizzaBtn.classList.toggle(
        "active",
        !burgerActive
    );



    burgerBtn.setAttribute(
        "aria-pressed",
        burgerActive
    );


    pizzaBtn.setAttribute(
        "aria-pressed",
        !burgerActive
    );

}



// ==========================================
// SIZE BUTTON STATE
// ==========================================

function updateSizeButtons() {


    const selected =
        menuARState.selectedSize;



    const buttons = {

        small:
            sizeSmallBtn,

        medium:
            sizeMediumBtn,

        large:
            sizeLargeBtn

    };



    Object.entries(
        buttons
    ).forEach(

        (
            [
                key,
                button
            ]
        ) => {


            const active =
                key === selected;



            button.classList.toggle(
                "active",
                active
            );


            button.setAttribute(
                "aria-pressed",
                active
            );

        }

    );

}



// ==========================================
// UPDATE SHADOW SIZE
// ==========================================

function updateShadowAppearance() {


    if (
        !shadowReceiver
    ) {

        return;

    }



    const config =
        MODEL_CONFIG[
            menuARState.selectedFood
        ];



    const size =
        getCurrentSizePreset();



    shadowReceiver.scale.set(

        config.shadowWidth *
        size.factor,

        config.shadowDepth *
        size.factor,

        1

    );



    shadowReceiver.material.opacity =
        SHADOW_OPACITY;

}



// ==========================================
// POSITION SHADOW AT HIT TEST
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

        0.003

    );



    updateShadowAppearance();



    shadowReceiver.visible =
        true;

}



// ==========================================
// SELECT SIZE
// ==========================================

function selectPreviewSize(sizeKey) {


    if (

        menuARState.appState !==
            "PLACED" ||

        !menuARState.placedObject

    ) {

        return;

    }



    menuARState.selectedSize =
        sizeKey;



    updateSizeButtons();



    const scale =
        getCurrentModelScale(
            menuARState.selectedFood
        );



    menuARState.placedObject.scale.setScalar(
        scale
    );



    updateShadowAppearance();



    const sizeName =
        getCurrentSizePreset().label;



    setStatus(

        `${getFoodName(menuARState.selectedFood)} size changed to ${sizeName}.`

    );

}



// ==========================================
// SELECT / CHANGE FOOD
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


            setStatus(
                `${foodName} is already on your table.`
            );


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

                `Great — tap the white circle to place your ${foodName}.`

            );


        } else {


            setStatus(

                `${foodName} selected. Move your device slowly over the table.`

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



    const savedPosition =
        oldModel.position.clone();



    const savedQuaternion =
        oldModel.quaternion.clone();



    scene.remove(
        oldModel
    );



    const newModel =
        template.clone(true);



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

        getCurrentModelScale(
            newFood
        )

    );



    scene.add(
        newModel
    );



    menuARState.placedObject =
        newModel;



    updateShadowAppearance();



    const sizeName =
        getCurrentSizePreset().label;



    menuARState.appState =
        "PLACED";



    setStatus(

        `Changed to ${getFoodName(newFood)} — ${sizeName} size kept.`

    );

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
            "Table preview is not supported on this device or browser."
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
                "Table preview is not supported on this device or browser."
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
            "Unable to check table-preview support on this device."
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
// SHOW PRE-AR
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
// START AR
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


        menuARState.currentRotation =
            0;


        menuARState.selectedSize =
            "medium";



        updateSizeButtons();



        document.body.classList.add(
            "xr-session-active"
        );



        showARInterface();



        hideInteractionControls();



        updateFoodButtons(
            menuARState.selectedFood
        );



        setStatus(

            `Move your device slowly over the table to find a clear spot for your ${getFoodName(menuARState.selectedFood)}.`

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
                "Camera permission was not granted. Allow access and try again."
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
                "This device does not support the table-preview features required by MenuAR."
            );


            startARBtn.disabled =
                true;


            startARBtn.textContent =
                "Not Supported";


            return;

        }



        showSupportMessage(
            "The table preview could not start. Check permissions and try again."
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


    sizeSmallBtn.disabled =
        false;


    sizeMediumBtn.disabled =
        false;


    sizeLargeBtn.disabled =
        false;


    moveBtn.disabled =
        false;


    removeBtn.disabled =
        false;


    confirmBtn.disabled =
        false;



    moveBtn.textContent =
        "↔ Move Dish";


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


    sizeSmallBtn.disabled =
        true;


    sizeMediumBtn.disabled =
        true;


    sizeLargeBtn.disabled =
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


    sizeSmallBtn.disabled =
        true;


    sizeMediumBtn.disabled =
        true;


    sizeLargeBtn.disabled =
        true;


    removeBtn.disabled =
        true;


    confirmBtn.disabled =
        true;


    moveBtn.disabled =
        true;



    moveBtn.textContent =
        "Choose New Spot";


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



    menuARState.selectedSize =
        "medium";



    updateSizeButtons();



    disableManipulationControls();



    hideInteractionControls();



    moveBtn.textContent =
        "↔ Move Dish";


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
            PLACEMENT_DURATION,

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

        `Serving your ${getFoodName(food)} preview...`

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

        SHADOW_OPACITY *

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
            SHADOW_OPACITY;



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



        updateSizeButtons();



        setStatus(

            `${getFoodName(completedFood)} is on your table — choose Small, Medium or Large.`

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



    const finalScale =
        getCurrentModelScale(
            food
        );



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



    shadowReceiver.material.opacity =
        0;



    reticle.visible =
        false;



    hideInteractionControls();


    disableManipulationControls();



    startPlacementAnimation(

        placedModel,

        food,

        finalScale,

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

        `${getFoodName(menuARState.selectedFood)} turned left.`

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

        `${getFoodName(menuARState.selectedFood)} turned right.`

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

        "Choose a new spot on the table, then tap the white circle."

    );

}



// ==========================================
// MOVE MODE STATUS
// ==========================================

function setMoveModeStatus() {


    if (
        menuARState.surfaceFound
    ) {


        setStatus(
            "New spot found — tap the white circle to move your dish."
        );


    } else {


        setStatus(
            "Move your device slowly to find a new spot."
        );

    }

}



// ==========================================
// REPOSITION FOOD
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



    // Save rotation + scale.

    const savedQuaternion =

        menuARState.placedObject
            .quaternion
            .clone();



    const savedScale =

        menuARState.placedObject
            .scale
            .clone();



    const savedRotation =
        menuARState.currentRotation;



    // New position.

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



    // Restore rotation.

    menuARState.placedObject.quaternion.copy(
        savedQuaternion
    );



    // Restore selected size.

    menuARState.placedObject.scale.copy(
        savedScale
    );



    menuARState.currentRotation =
        savedRotation;



    positionShadowFromReticle();



    updateShadowAppearance();



    menuARState.appState =
        "PLACED";


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;



    enableManipulationControls();



    setStatus(

        `${getFoodName(menuARState.selectedFood)} moved to the new spot.`

    );

}



// ==========================================
// REMOVE FOOD
// ==========================================

function removeFood() {


    if (

        !menuARState.placedObject ||

        menuARState.appState ===
            "CONFIRMED"

    ) {

        return;

    }



    const removedFood =
        getFoodName(
            menuARState.selectedFood
        );



    removePlacedObjectFromScene();



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

        `${removedFood} removed. Move your device to choose another spot.`

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
// UPDATE CONFIRM ANIMATION
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
            0.06 *

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
// CONFIRM UI FEEDBACK
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



    const foodName =
        getFoodName(
            menuARState.selectedFood
        );



    const sizeName =
        getCurrentSizePreset().label;



    setStatus(

        `Looks good! Your ${sizeName} ${foodName} preview is confirmed.`

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
// HIT TEST / RENDER LOOP
// ==========================================

function render(

    timestamp,

    frame

) {


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

                        `Great — tap the white circle to place your ${getFoodName(menuARState.selectedFood)}.`

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

                    `Move your device slowly over the table to find a clear spot for your ${getFoodName(menuARState.selectedFood)}.`

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
// SIZE EVENTS
// ==========================================

sizeSmallBtn.addEventListener(

    "click",

    () => {


        selectPreviewSize(
            "small"
        );

    }

);



sizeMediumBtn.addEventListener(

    "click",

    () => {


        selectPreviewSize(
            "medium"
        );

    }

);



sizeLargeBtn.addEventListener(

    "click",

    () => {


        selectPreviewSize(
            "large"
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


    updateSizeButtons();



    await Promise.all([

        loadModels(),

        checkXRSupport()

    ]);



    updateStartButton();

}



initializeApplication();