import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";



// ==========================================
// DOM REFERENCES
// ==========================================

const burgerBtn =
    document.getElementById(
        "burgerBtn"
    );


const pizzaBtn =
    document.getElementById(
        "pizzaBtn"
    );


const sizeSmallBtn =
    document.getElementById(
        "sizeSmallBtn"
    );


const sizeMediumBtn =
    document.getElementById(
        "sizeMediumBtn"
    );


const sizeLargeBtn =
    document.getElementById(
        "sizeLargeBtn"
    );


const statusMessage =
    document.getElementById(
        "statusMessage"
    );


const startARBtn =
    document.getElementById(
        "startARBtn"
    );


const exitARBtn =
    document.getElementById(
        "exitARBtn"
    );


const xrViewport =
    document.getElementById(
        "xrViewport"
    );


const xrIntro =
    document.getElementById(
        "xrIntro"
    );


const xrSupportMessage =
    document.getElementById(
        "xrSupportMessage"
    );


const arControls =
    document.getElementById(
        "arControls"
    );


const selectionArea =
    document.getElementById(
        "selectionArea"
    );


const interactionControls =
    document.getElementById(
        "interactionControls"
    );


const moveBtn =
    document.getElementById(
        "moveBtn"
    );


const removeBtn =
    document.getElementById(
        "removeBtn"
    );


const addToOrderBtn =
    document.getElementById(
        "addToOrderBtn"
    );


const orderBadge =
    document.getElementById(
        "orderBadge"
    );


const orderActionsPanel =
    document.getElementById(
        "orderActionsPanel"
    );


const orderActionMessage =
    document.getElementById(
        "orderActionMessage"
    );


const addAnotherBtn =
    document.getElementById(
        "addAnotherBtn"
    );


const placeOrderBtn =
    document.getElementById(
        "placeOrderBtn"
    );


const cancelOrderBtn =
    document.getElementById(
        "cancelOrderBtn"
    );


const orderCompletePanel =
    document.getElementById(
        "orderCompletePanel"
    );


const finalOrderSummary =
    document.getElementById(
        "finalOrderSummary"
    );



// ==========================================
// SIZE PRESETS
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
//
// MULTI-STEP STATE MANAGEMENT:
//
// INITIALIZING
//
// READY_TO_SCAN
//
// SCANNING
//
// SURFACE_FOUND
//
// SURFACE_BLOCKED
//
// PLACING
//
// PLACED
//
// MOVE_MODE
//
// ORDER_ACTIONS
//
// ORDER_CONFIRMED
//
// UNSUPPORTED
//
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


    activeShadow:
        null,


    confirmedItems:
        [],


    surfaceFound:
        false,


    placementAllowed:
        false,


    modelsReady:
        false,


    xrSupported:
        false,


    nextItemId:
        1


};



// ==========================================
// MODEL CONFIGURATION
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
            0.23,

        collisionRadius:
            0.09

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
            0.35,

        collisionRadius:
            0.14

    }


};



// ==========================================
// COLLISION SETTINGS
// ==========================================
//
// Small extra gap so dishes do not look
// visually merged even when they are only
// just touching.
//
// metres
// ==========================================

const COLLISION_MARGIN =
    0.035;



// ==========================================
// INTERACTION SETTINGS
// ==========================================

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

const PLACEMENT_DURATION =
    560;


const PLACEMENT_START_SCALE_FACTOR =
    0.45;


const PLACEMENT_LIFT =
    0.10;



let placementAnimation =
    null;



// ==========================================
// FINAL ORDER ANIMATION
// ==========================================

let orderPulseAnimation =
    null;



// ==========================================
// SHADOW
// ==========================================

const SHADOW_OPACITY =
    0.44;


let shadowTexture =
    null;


let shadowGeometry =
    null;



// ==========================================
// THREE / WEBXR VARIABLES
// ==========================================

let scene;

let camera;

let renderer;

let reticle;

let reticleMaterial;

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
// INITIALIZE THREE.JS
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
    // SHADOW ASSETS
    // ======================================

    shadowTexture =
        createSoftShadowTexture();



    shadowGeometry =
        new THREE.PlaneGeometry(

            1,

            1

        );



    shadowGeometry.rotateX(
        -Math.PI / 2
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



    reticleMaterial =
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
// RETICLE COLOUR
// ==========================================

function showValidReticle() {


    reticleMaterial.color.setHex(
        0xffffff
    );

}



function showBlockedReticle() {


    reticleMaterial.color.setHex(
        0xff3b30
    );

}



// ==========================================
// SHADOW CREATION
// ==========================================

function createShadowMesh(

    food,

    sizeKey

) {


    const material =
        new THREE.MeshBasicMaterial({

            map:
                shadowTexture,

            transparent:
                true,

            opacity:
                SHADOW_OPACITY,

            depthWrite:
                false,

            side:
                THREE.DoubleSide

        });



    const shadow =
        new THREE.Mesh(

            shadowGeometry,

            material

        );



    shadow.renderOrder =
        1;



    updateShadowAppearance(

        shadow,

        food,

        sizeKey

    );



    return shadow;

}



// ==========================================
// SHADOW SIZE
// ==========================================

function updateShadowAppearance(

    shadow,

    food,

    sizeKey

) {


    if (
        !shadow
    ) {

        return;

    }



    const config =
        MODEL_CONFIG[food];



    const size =
        SIZE_PRESETS[sizeKey];



    shadow.scale.set(

        config.shadowWidth *
        size.factor,

        config.shadowDepth *
        size.factor,

        1

    );



    shadow.material.opacity =
        SHADOW_OPACITY;

}



// ==========================================
// POSITION SHADOW AT RETICLE
// ==========================================

function positionShadowFromReticle(
    shadow
) {


    if (
        !shadow
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



    shadow.position.copy(
        position
    );



    shadow.quaternion.copy(
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



    shadow.position.addScaledVector(

        surfaceNormal,

        0.003

    );

}



// ==========================================
// COLLISION RADIUS
// ==========================================

function getCollisionRadius(

    food,

    sizeKey

) {


    return (

        MODEL_CONFIG[food]
            .collisionRadius *

        SIZE_PRESETS[sizeKey]
            .factor

    );

}



// ==========================================
// IS POSITION AVAILABLE?
// ==========================================
//
// Only X/Z distance matters because the
// dishes are being placed on the table.
//
// Existing confirmed dishes are checked.
//
// ==========================================

function isPositionAvailable(

    position,

    food,

    sizeKey

) {


    const newRadius =
        getCollisionRadius(

            food,

            sizeKey

        );



    for (
        const item of
        menuARState.confirmedItems
    ) {


        if (
            !item.object
        ) {

            continue;

        }



        const existingPosition =
            item.object.position;



        const deltaX =

            position.x -

            existingPosition.x;



        const deltaZ =

            position.z -

            existingPosition.z;



        const distance =

            Math.sqrt(

                deltaX *
                deltaX +

                deltaZ *
                deltaZ

            );



        const minimumDistance =

            newRadius +

            item.collisionRadius +

            COLLISION_MARGIN;



        if (
            distance <
            minimumDistance
        ) {


            return false;

        }

    }



    return true;

}



// ==========================================
// AUDIO CONTEXT
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
// PLAY GENERATED TONE
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
// ADDED TO ORDER SOUND
// ==========================================

function playAddedSound() {


    playTone(

        430,

        520,

        0.11,

        0.025

    );

}



// ==========================================
// FINAL ORDER SOUND
// ==========================================

function playOrderConfirmationSound() {


    playTone(

        523,

        523,

        0.13,

        0.035,

        0

    );



    playTone(

        659,

        659,

        0.15,

        0.038,

        0.10

    );



    playTone(

        784,

        784,

        0.22,

        0.040,

        0.21

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


    return food ===
        "burger"
        ? "Burger"
        : "Pizza";

}



// ==========================================
// MODEL SCALE
// ==========================================

function getModelScale(

    food,

    sizeKey

) {


    return (

        MODEL_CONFIG[food]
            .baseScale *

        SIZE_PRESETS[sizeKey]
            .factor

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



            loader.load(


                MODEL_CONFIG[food].src,


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
// LOAD ALL MODELS
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
// FOOD BUTTONS
// ==========================================

function updateFoodButtons(food) {


    const burgerActive =
        food ===
        "burger";



    burgerBtn.classList.toggle(

        "active",

        burgerActive

    );



    pizzaBtn.classList.toggle(

        "active",

        !burgerActive

    );

}



// ==========================================
// SIZE BUTTONS
// ==========================================

function updateSizeButtons() {


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


            button.classList.toggle(

                "active",

                key ===
                    menuARState.selectedSize

            );

        }

    );

}



// ==========================================
// ENABLE / DISABLE SELECTION
// ==========================================

function setSelectionEnabled(enabled) {


    burgerBtn.disabled =
        !enabled;


    pizzaBtn.disabled =
        !enabled;


    sizeSmallBtn.disabled =
        !enabled;


    sizeMediumBtn.disabled =
        !enabled;


    sizeLargeBtn.disabled =
        !enabled;

}



// ==========================================
// SELECT FOOD
// ==========================================

function selectFood(food) {


    const validStates = [

        "SCANNING",

        "SURFACE_FOUND",

        "SURFACE_BLOCKED"

    ];



    if (
        !validStates.includes(
            menuARState.appState
        )
    ) {

        return;

    }



    menuARState.selectedFood =
        food;



    updateFoodButtons(
        food
    );



    setStatus(

        `${getFoodName(food)} selected. Choose a size and find a spot on the table.`

    );

}



// ==========================================
// SELECT SIZE
// ==========================================

function selectSize(sizeKey) {


    const validStates = [

        "SCANNING",

        "SURFACE_FOUND",

        "SURFACE_BLOCKED"

    ];



    if (
        !validStates.includes(
            menuARState.appState
        )
    ) {

        return;

    }



    menuARState.selectedSize =
        sizeKey;



    updateSizeButtons();



    setStatus(

        `${SIZE_PRESETS[sizeKey].label} ${getFoodName(menuARState.selectedFood)} selected. Find a spot on the table.`

    );

}



// ==========================================
// XR SUPPORT
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
// SHOW AR UI
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
// SHOW START UI
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



        // Reset ordering state.

        menuARState.appState =
            "SCANNING";


        menuARState.surfaceFound =
            false;


        menuARState.placementAllowed =
            false;


        menuARState.selectedFood =
            "burger";


        menuARState.selectedSize =
            "medium";


        menuARState.confirmedItems =
            [];


        menuARState.nextItemId =
            1;



        document.body.classList.add(
            "xr-session-active"
        );



        showARInterface();



        selectionArea.hidden =
            false;


        orderActionsPanel.hidden =
            true;


        orderCompletePanel.hidden =
            true;



        hideInteractionControls();



        setSelectionEnabled(
            true
        );



        updateFoodButtons(
            "burger"
        );


        updateSizeButtons();


        updateOrderBadge();



        setStatus(

            "Choose a dish and size, then move your device slowly over the table."

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
// REMOVE ACTIVE PREVIEW
// ==========================================

function removeActivePreviewFromScene() {


    placementAnimation =
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
        menuARState.activeShadow
    ) {


        scene.remove(
            menuARState.activeShadow
        );


        menuARState.activeShadow =
            null;

    }

}



// ==========================================
// CLEAR CONFIRMED ORDER
// ==========================================

function clearConfirmedItemsFromScene() {


    menuARState.confirmedItems.forEach(

        (item) => {


            if (
                item.object
            ) {


                scene.remove(
                    item.object
                );

            }



            if (
                item.shadow
            ) {


                scene.remove(
                    item.shadow
                );

            }

        }

    );



    menuARState.confirmedItems =
        [];

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
// PLACED DISH CONTROLS
// ==========================================

function enablePlacedControls() {


    moveBtn.disabled =
        false;


    removeBtn.disabled =
        false;


    addToOrderBtn.disabled =
        false;



    moveBtn.textContent =
        "↔ Move Dish";


    moveBtn.classList.remove(
        "active"
    );

}



function disablePlacedControls() {


    moveBtn.disabled =
        true;


    removeBtn.disabled =
        true;


    addToOrderBtn.disabled =
        true;

}



// ==========================================
// MOVE MODE CONTROLS
// ==========================================

function setMoveModeControls() {


    moveBtn.disabled =
        true;


    removeBtn.disabled =
        true;


    addToOrderBtn.disabled =
        true;



    moveBtn.textContent =
        "Choose New Spot";


    moveBtn.classList.add(
        "active"
    );

}



// ==========================================
// ORDER BADGE
// ==========================================

function updateOrderBadge() {


    const count =
        menuARState.confirmedItems.length;



    if (
        count ===
        0
    ) {


        orderBadge.hidden =
            true;


        return;

    }



    orderBadge.hidden =
        false;



    orderBadge.textContent =

        `Your Order · ${count} ${count === 1 ? "item" : "items"}`;

}



// ==========================================
// RESET UI
// ==========================================

function resetControls() {


    menuARState.selectedFood =
        "burger";


    menuARState.selectedSize =
        "medium";



    updateFoodButtons(
        "burger"
    );


    updateSizeButtons();



    setSelectionEnabled(
        true
    );



    disablePlacedControls();


    hideInteractionControls();



    selectionArea.hidden =
        false;


    orderActionsPanel.hidden =
        true;


    orderCompletePanel.hidden =
        true;


    orderBadge.hidden =
        true;



    moveBtn.textContent =
        "↔ Move Dish";


    moveBtn.classList.remove(
        "active"
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



    removeActivePreviewFromScene();



    clearConfirmedItemsFromScene();



    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    menuARState.nextItemId =
        1;


    menuARState.appState =
        "READY_TO_SCAN";



    orderPulseAnimation =
        null;



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



    menuARState.appState =
        "PLACING";



    if (
        menuARState.activeShadow
    ) {


        menuARState.activeShadow.material.opacity =
            0;

    }



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

        `Placing your ${getFoodName(food)}...`

    );

}



// ==========================================
// UPDATE PLACEMENT ANIMATION
// ==========================================

function updatePlacementAnimation(
    timestamp
) {


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



    placementAnimation.model.position.y =

        THREE.MathUtils.lerp(

            placementAnimation.startY,

            placementAnimation.finalY,

            positionEase

        );



    placementAnimation.model.scale.setScalar(

        THREE.MathUtils.lerp(

            placementAnimation.startScale,

            placementAnimation.finalScale,

            scaleEase

        )

    );



    if (
        menuARState.activeShadow
    ) {


        menuARState.activeShadow
            .material
            .opacity =

            SHADOW_OPACITY *

            positionEase;

    }



    if (
        progress >=
        1
    ) {


        placementAnimation.model.position.y =
            placementAnimation.finalY;



        placementAnimation.model.scale.setScalar(
            placementAnimation.finalScale
        );



        placementAnimation =
            null;



        menuARState.appState =
            "PLACED";



        setSelectionEnabled(
            false
        );



        showInteractionControls();



        enablePlacedControls();



        updateOrderBadge();



        setStatus(

            `${SIZE_PRESETS[menuARState.selectedSize].label} ${getFoodName(menuARState.selectedFood)} placed. Move it if needed, then add it to your order.`

        );



        playPlacementSound();

    }

}



// ==========================================
// PLACE SELECTED FOOD
// ==========================================

function placeSelectedFood() {


    if (

        !reticle.visible ||

        !menuARState.placementAllowed ||

        menuARState.placedObject

    ) {

        return;

    }



    const food =
        menuARState.selectedFood;



    const sizeKey =
        menuARState.selectedSize;



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
        getModelScale(

            food,

            sizeKey

        );



    scene.add(
        placedModel
    );



    menuARState.placedObject =
        placedModel;



    const shadow =
        createShadowMesh(

            food,

            sizeKey

        );



    positionShadowFromReticle(
        shadow
    );



    shadow.material.opacity =
        0;



    scene.add(
        shadow
    );



    menuARState.activeShadow =
        shadow;



    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;



    reticle.visible =
        false;



    hideInteractionControls();



    disablePlacedControls();



    startPlacementAnimation(

        placedModel,

        food,

        finalScale,

        finalY

    );

}



// ==========================================
// ENTER MOVE MODE
// ==========================================

function enterMoveMode() {


    if (

        menuARState.appState !==
            "PLACED" ||

        !menuARState.placedObject

    ) {

        return;

    }



    menuARState.appState =
        "MOVE_MODE";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    reticle.visible =
        false;



    if (
        menuARState.activeShadow
    ) {


        menuARState.activeShadow.visible =
            false;

    }



    moveModeStartedAt =
        performance.now();



    ignoreXRSelectUntil =

        performance.now() +

        UI_SELECT_GUARD_MS;



    setMoveModeControls();



    setStatus(

        "Choose a new open spot on the table."

    );

}



// ==========================================
// REPOSITION ACTIVE FOOD
// ==========================================

function repositionPlacedFood() {


    if (

        menuARState.appState !==
            "MOVE_MODE" ||

        !menuARState.placedObject ||

        !reticle.visible ||

        !menuARState.placementAllowed

    ) {

        return;

    }



    // Preserve exact size and orientation.

    const savedQuaternion =

        menuARState.placedObject
            .quaternion
            .clone();



    const savedScale =

        menuARState.placedObject
            .scale
            .clone();



    const newPosition =
        new THREE.Vector3();



    newPosition.setFromMatrixPosition(
        reticle.matrix
    );



    const config =
        MODEL_CONFIG[
            menuARState.selectedFood
        ];



    menuARState.placedObject
        .position
        .copy(
            newPosition
        );



    menuARState.placedObject
        .position
        .y +=
        config.surfaceOffset;



    menuARState.placedObject
        .quaternion
        .copy(
            savedQuaternion
        );



    menuARState.placedObject
        .scale
        .copy(
            savedScale
        );



    if (
        menuARState.activeShadow
    ) {


        positionShadowFromReticle(
            menuARState.activeShadow
        );



        updateShadowAppearance(

            menuARState.activeShadow,

            menuARState.selectedFood,

            menuARState.selectedSize

        );



        menuARState.activeShadow.visible =
            true;

    }



    menuARState.appState =
        "PLACED";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    reticle.visible =
        false;



    enablePlacedControls();



    setStatus(

        `${getFoodName(menuARState.selectedFood)} moved to the new spot.`

    );

}



// ==========================================
// REMOVE ACTIVE DISH
// ==========================================

function removeFood() {


    if (
        !menuARState.placedObject
    ) {

        return;

    }



    const removedName =
        getFoodName(
            menuARState.selectedFood
        );



    removeActivePreviewFromScene();



    menuARState.appState =
        "SCANNING";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    reticle.visible =
        false;



    hideInteractionControls();



    disablePlacedControls();



    setSelectionEnabled(
        true
    );



    updateOrderBadge();



    setStatus(

        `${removedName} removed. Choose a dish and size when you're ready.`

    );

}



// ==========================================
// ADD CURRENT DISH TO ORDER
// ==========================================

function addCurrentItemToOrder() {


    if (

        menuARState.appState !==
            "PLACED" ||

        !menuARState.placedObject

    ) {

        return;

    }



    const item = {


        id:
            menuARState.nextItemId++,


        food:
            menuARState.selectedFood,


        sizeKey:
            menuARState.selectedSize,


        object:
            menuARState.placedObject,


        shadow:
            menuARState.activeShadow,


        collisionRadius:
            getCollisionRadius(

                menuARState.selectedFood,

                menuARState.selectedSize

            )


    };



    menuARState.confirmedItems.push(
        item
    );



    // Keep the model and shadow in scene,
    // but it is no longer editable.

    menuARState.placedObject =
        null;


    menuARState.activeShadow =
        null;



    menuARState.appState =
        "ORDER_ACTIONS";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    reticle.visible =
        false;



    playAddedSound();



    selectionArea.hidden =
        true;



    hideInteractionControls();



    disablePlacedControls();



    orderActionsPanel.hidden =
        false;



    orderActionMessage.textContent =

        `${SIZE_PRESETS[item.sizeKey].label} ${getFoodName(item.food)} added.`;



    updateOrderBadge();



    setStatus(

        "Dish added to your order. Add another dish or place your order."

    );

}



// ==========================================
// ADD ANOTHER DISH
// ==========================================

function addAnotherDish() {


    if (
        menuARState.confirmedItems.length ===
        0
    ) {

        return;

    }



    menuARState.appState =
        "SCANNING";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    menuARState.selectedSize =
        "medium";


    reticle.visible =
        false;



    selectionArea.hidden =
        false;


    orderActionsPanel.hidden =
        true;


    orderCompletePanel.hidden =
        true;



    setSelectionEnabled(
        true
    );



    hideInteractionControls();



    updateSizeButtons();


    updateFoodButtons(
        menuARState.selectedFood
    );


    updateOrderBadge();



    setStatus(

        "Choose your next dish and size, then find an open spot on the table."

    );

}



// ==========================================
// CANCEL ORDER
// ==========================================

function cancelOrder() {


    removeActivePreviewFromScene();



    clearConfirmedItemsFromScene();



    orderPulseAnimation =
        null;



    menuARState.appState =
        "SCANNING";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    menuARState.selectedFood =
        "burger";


    menuARState.selectedSize =
        "medium";


    menuARState.nextItemId =
        1;



    reticle.visible =
        false;



    selectionArea.hidden =
        false;


    orderActionsPanel.hidden =
        true;


    orderCompletePanel.hidden =
        true;



    hideInteractionControls();



    disablePlacedControls();



    setSelectionEnabled(
        true
    );



    updateFoodButtons(
        "burger"
    );


    updateSizeButtons();


    updateOrderBadge();



    setStatus(

        "Order cancelled. Choose a dish to start again."

    );

}



// ==========================================
// GROUP FINAL ORDER
// ==========================================

function getGroupedOrderItems() {


    const grouped =
        new Map();



    menuARState.confirmedItems.forEach(

        (item) => {


            const key =

                `${item.sizeKey}-${item.food}`;



            if (
                !grouped.has(key)
            ) {


                grouped.set(

                    key,

                    {


                        food:
                            item.food,


                        sizeKey:
                            item.sizeKey,


                        count:
                            0


                    }

                );

            }



            grouped.get(key).count +=
                1;

        }

    );



    return Array.from(
        grouped.values()
    );

}



// ==========================================
// FINAL SUMMARY
// ==========================================

function renderFinalOrderSummary() {


    finalOrderSummary.innerHTML =
        "";



    const groups =
        getGroupedOrderItems();



    groups.forEach(

        (group) => {


            const row =
                document.createElement(
                    "div"
                );



            row.className =
                "order-summary-row";



            const name =
                document.createElement(
                    "span"
                );



            name.className =
                "order-summary-name";



            name.textContent =

                `${SIZE_PRESETS[group.sizeKey].label} ${getFoodName(group.food)}`;



            const count =
                document.createElement(
                    "span"
                );



            count.className =
                "order-summary-count";



            count.textContent =
                `${group.count} ×`;



            row.appendChild(
                name
            );



            row.appendChild(
                count
            );



            finalOrderSummary.appendChild(
                row
            );

        }

    );

}



// ==========================================
// FINAL ORDER PULSE
// ==========================================

function startOrderPulseAnimation() {


    if (
        menuARState.confirmedItems.length ===
        0
    ) {

        return;

    }



    orderPulseAnimation = {


        startTime:
            null,


        durationPerItem:
            420,


        stagger:
            130,


        baseScales:

            menuARState.confirmedItems.map(

                (item) =>
                    item.object.scale.clone()

            )


    };

}



// ==========================================
// UPDATE FINAL PULSE
// ==========================================

function updateOrderPulseAnimation(
    timestamp
) {


    if (
        !orderPulseAnimation
    ) {

        return;

    }



    if (
        orderPulseAnimation.startTime ===
        null
    ) {


        orderPulseAnimation.startTime =
            timestamp;

    }



    const elapsed =

        timestamp -

        orderPulseAnimation.startTime;



    const itemCount =
        menuARState.confirmedItems.length;



    menuARState.confirmedItems.forEach(

        (
            item,
            index
        ) => {


            const localElapsed =

                elapsed -

                (
                    index *
                    orderPulseAnimation.stagger
                );



            const baseScale =

                orderPulseAnimation
                    .baseScales[index];



            if (
                localElapsed <
                0
            ) {


                item.object.scale.copy(
                    baseScale
                );


                return;

            }



            const progress =

                THREE.MathUtils.clamp(

                    localElapsed /

                    orderPulseAnimation
                        .durationPerItem,

                    0,

                    1

                );



            const pulse =

                1 +

                (
                    0.065 *

                    Math.sin(

                        Math.PI *

                        progress

                    )
                );



            item.object.scale.copy(
                baseScale
            );



            item.object.scale.multiplyScalar(
                pulse
            );

        }

    );



    const totalDuration =

        orderPulseAnimation.durationPerItem +

        (
            Math.max(

                itemCount - 1,

                0

            ) *

            orderPulseAnimation.stagger

        );



    if (
        elapsed >=
        totalDuration
    ) {


        menuARState.confirmedItems.forEach(

            (
                item,
                index
            ) => {


                item.object.scale.copy(

                    orderPulseAnimation
                        .baseScales[index]

                );

            }

        );



        orderPulseAnimation =
            null;

    }

}



// ==========================================
// PLACE ORDER
// ==========================================

function placeOrder() {


    if (
        menuARState.confirmedItems.length ===
        0
    ) {

        return;

    }



    menuARState.appState =
        "ORDER_CONFIRMED";


    menuARState.surfaceFound =
        false;


    menuARState.placementAllowed =
        false;


    reticle.visible =
        false;



    selectionArea.hidden =
        true;


    orderActionsPanel.hidden =
        true;


    orderBadge.hidden =
        true;



    hideInteractionControls();



    orderCompletePanel.hidden =
        false;



    renderFinalOrderSummary();



    orderCompletePanel.classList.remove(
        "order-complete-pop"
    );



    void orderCompletePanel.offsetWidth;



    orderCompletePanel.classList.add(
        "order-complete-pop"
    );



    const count =
        menuARState.confirmedItems.length;



    setStatus(

        `Order confirmed — ${count} ${count === 1 ? "dish" : "dishes"} selected.`

    );



    startOrderPulseAnimation();



    playOrderConfirmationSound();

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



    // Initial placement.

    if (

        menuARState.appState ===
            "SURFACE_FOUND" &&

        !menuARState.placedObject &&

        reticle.visible &&

        menuARState.placementAllowed

    ) {


        placeSelectedFood();


        return;

    }



    // Reposition.

    if (

        menuARState.appState ===
            "MOVE_MODE" &&

        menuARState.placedObject &&

        reticle.visible &&

        menuARState.placementAllowed

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



    updateOrderPulseAnimation(
        timestamp
    );



    const shouldRunHitTest =

        menuARState.appState ===
            "SCANNING" ||

        menuARState.appState ===
            "SURFACE_FOUND" ||

        menuARState.appState ===
            "SURFACE_BLOCKED" ||

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
            hitTestResults.length >
            0
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



                const candidatePosition =
                    new THREE.Vector3();



                candidatePosition.setFromMatrixPosition(
                    reticle.matrix
                );



                const positionAvailable =

                    isPositionAvailable(

                        candidatePosition,

                        menuARState.selectedFood,

                        menuARState.selectedSize

                    );



                menuARState.surfaceFound =
                    true;



                menuARState.placementAllowed =
                    positionAvailable;



                // ==================================
                // VALID OPEN POSITION
                // ==================================

                if (
                    positionAvailable
                ) {


                    showValidReticle();



                    if (
                        menuARState.appState ===
                        "MOVE_MODE"
                    ) {


                        setStatus(

                            "Open spot found — tap the white circle to move your dish."

                        );


                    } else {


                        menuARState.appState =
                            "SURFACE_FOUND";



                        setStatus(

                            `Tap the white circle to place your ${SIZE_PRESETS[menuARState.selectedSize].label} ${getFoodName(menuARState.selectedFood)}.`

                        );

                    }


                }


                // ==================================
                // COLLISION / OCCUPIED POSITION
                // ==================================

                else {


                    showBlockedReticle();



                    if (
                        menuARState.appState ===
                        "MOVE_MODE"
                    ) {


                        setStatus(

                            "That spot is too close to another dish. Choose an open spot."

                        );


                    } else {


                        menuARState.appState =
                            "SURFACE_BLOCKED";



                        setStatus(

                            "That spot is already occupied. Move the red circle to an open space."

                        );

                    }

                }

            }


        } else {


            reticle.visible =
                false;



            menuARState.surfaceFound =
                false;


            menuARState.placementAllowed =
                false;



            if (
                menuARState.appState ===
                "MOVE_MODE"
            ) {


                setStatus(

                    "Move your device slowly to find a new spot."

                );


            } else {


                menuARState.appState =
                    "SCANNING";



                setStatus(

                    `Move your device slowly over the table to find a spot for your ${getFoodName(menuARState.selectedFood)}.`

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
// PROTECT XR FROM HTML BUTTON TAPS
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


        selectSize(
            "small"
        );

    }

);



sizeMediumBtn.addEventListener(

    "click",

    () => {


        selectSize(
            "medium"
        );

    }

);



sizeLargeBtn.addEventListener(

    "click",

    () => {


        selectSize(
            "large"
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
// ADD TO ORDER
// ==========================================

addToOrderBtn.addEventListener(

    "click",

    addCurrentItemToOrder

);



// ==========================================
// ADD ANOTHER
// ==========================================

addAnotherBtn.addEventListener(

    "click",

    addAnotherDish

);



// ==========================================
// PLACE ORDER
// ==========================================

placeOrderBtn.addEventListener(

    "click",

    placeOrder

);



// ==========================================
// CANCEL ORDER
// ==========================================

cancelOrderBtn.addEventListener(

    "click",

    cancelOrder

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



    await Promise.all([

        loadModels(),

        checkXRSupport()

    ]);



    updateStartButton();

}



initializeApplication();