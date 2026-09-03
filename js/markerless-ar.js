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

const cancelOrderBtn =
    document.getElementById("cancelOrderBtn");

const doneBtn =
    document.getElementById("doneBtn");

const xrViewport =
    document.getElementById("xrViewport");

const xrIntro =
    document.getElementById("xrIntro");

const xrSupportMessage =
    document.getElementById("xrSupportMessage");

const arControls =
    document.getElementById("arControls");

const dishSelectionArea =
    document.getElementById("dishSelectionArea");

const interactionControls =
    document.getElementById("interactionControls");

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

const addToOrderBtn =
    document.getElementById("addToOrderBtn");

const orderBadge =
    document.getElementById("orderBadge");

const orderBadgeText =
    document.getElementById("orderBadgeText");

const orderReviewPanel =
    document.getElementById("orderReviewPanel");

const orderSummary =
    document.getElementById("orderSummary");

const addAnotherBtn =
    document.getElementById("addAnotherBtn");

const placeOrderBtn =
    document.getElementById("placeOrderBtn");

const orderCompletePanel =
    document.getElementById("orderCompletePanel");

const finalOrderSummary =
    document.getElementById("finalOrderSummary");



// ==========================================
// SIZE OPTIONS
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
// INITIALIZING
// READY_TO_SCAN
// SCANNING
// SURFACE_FOUND
// PLACING
// PLACED
// MOVE_MODE
// ORDER_REVIEW
// ORDER_CONFIRMED
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

    orderPlaced:
        false,

    nextItemId:
        1,

    surfaceFound:
        false,

    modelsReady:
        false,

    xrSupported:
        false

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
// ORDER CONFIRMATION ANIMATION
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
// THREE / WEBXR
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


let latestHitTestResult =
    null;



// ==========================================
// XR END / NAVIGATION STATE
// ==========================================

let isEndingXRSession =
    false;


let isCleaningUpXRSession =
    false;


// false = normal Cancel Order
// true  = Done after final confirmation

let navigateHomeAfterSessionEnd =
    false;



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
// SOFT SHADOW TEXTURE
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
// CREATE SHADOW
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
// UPDATE SHADOW
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
// POSITION SHADOW
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
// WEBXR ANCHORS
// ==========================================

async function createAnchorForHitResult(
    hitResult
) {


    if (

        !hitResult ||

        typeof hitResult.createAnchor !==
            "function"

    ) {

        return null;

    }



    try {


        return await hitResult.createAnchor();


    } catch (error) {


        console.warn(

            "Anchor creation failed. Static placement will be used.",

            error

        );


        return null;

    }

}



function deleteAnchorFromObject(
    object
) {


    if (

        object &&

        object.userData &&

        object.userData.anchor

    ) {


        try {


            object.userData.anchor.delete();


        } catch (error) {


            console.warn(
                "Anchor was already unavailable."
            );

        }



        object.userData.anchor =
            null;

    }

}



function applyAnchorTracking(

    object,

    shadow,

    frame,

    space

) {


    if (

        !object ||

        !object.userData.anchor ||

        !frame ||

        !space

    ) {

        return;

    }



    const anchorPose =
        frame.getPose(

            object.userData.anchor.anchorSpace,

            space

        );



    if (
        !anchorPose
    ) {

        return;

    }



    const matrix =
        new THREE.Matrix4().fromArray(

            anchorPose.transform.matrix

        );



    const position =
        new THREE.Vector3();


    const quaternion =
        new THREE.Quaternion();


    const ignoredScale =
        new THREE.Vector3();



    matrix.decompose(

        position,

        quaternion,

        ignoredScale

    );



    const up =
        new THREE.Vector3(
            0,
            1,
            0
        ).applyQuaternion(
            quaternion
        );



    const offsetY =
        object.userData.surfaceOffset ||
        0;



    object.position.copy(
        position
    );


    object.position.addScaledVector(

        up,

        offsetY

    );


    object.quaternion.copy(
        quaternion
    );



    if (
        shadow
    ) {


        shadow.position.copy(
            position
        );


        shadow.quaternion.copy(
            quaternion
        );


        shadow.position.addScaledVector(

            up,

            0.003

        );

    }

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



function playAddedSound() {


    playTone(
        430,
        520,
        0.11,
        0.025
    );

}



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
// STATUS
// ==========================================

function setStatus(
    message
) {


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

function showSupportMessage(
    message
) {


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

function getFoodName(
    food
) {


    return food === "burger"
        ? "Burger"
        : "Pizza";

}



// ==========================================
// SIZE
// ==========================================

function getCurrentSizePreset() {


    return SIZE_PRESETS[
        menuARState.selectedSize
    ];

}



function getCurrentModelScale(
    food
) {


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
// LOAD MODELS
// ==========================================

function loadModel(
    food
) {


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

function updateFoodButtons(
    food
) {


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
// SIZE BUTTONS
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
// ORDER GROUPING
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
// ORDER SUMMARY
// ==========================================

function renderOrderSummary(
    container
) {


    container.innerHTML =
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


            container.appendChild(
                row
            );

        }

    );

}



// ==========================================
// ORDER BADGE
// ==========================================

function updateOrderBadge() {


    const count =
        menuARState.confirmedItems.length;



    if (

        count === 0 ||

        menuARState.appState ===
            "ORDER_REVIEW" ||

        menuARState.appState ===
            "ORDER_CONFIRMED"

    ) {


        orderBadge.hidden =
            true;


        return;

    }



    orderBadge.hidden =
        false;



    orderBadgeText.textContent =

        `Your Order · ${count} ${count === 1 ? "item" : "items"}`;

}



// ==========================================
// SELECT SIZE
// ==========================================

function selectPreviewSize(
    sizeKey
) {


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



    menuARState.placedObject.scale.setScalar(

        getCurrentModelScale(
            menuARState.selectedFood
        )

    );



    updateShadowAppearance(

        menuARState.activeShadow,

        menuARState.selectedFood,

        menuARState.selectedSize

    );



    setStatus(

        `${getCurrentSizePreset().label} ${getFoodName(menuARState.selectedFood)} selected.`

    );

}



// ==========================================
// SELECT FOOD
// ==========================================

function selectFood(
    food
) {


    if (

        menuARState.appState ===
            "ORDER_REVIEW" ||

        menuARState.appState ===
            "ORDER_CONFIRMED" ||

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

                `${foodName} is already selected.`

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

                `Perfect — tap the white circle to place your ${foodName}.`

            );


        } else {


            setStatus(

                `${foodName} selected. Find a spot on the table.`

            );

        }

    }

}



// ==========================================
// REPLACE ACTIVE FOOD
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



    newModel.userData.surfaceOffset =
        newConfig.surfaceOffset;



    if (
        oldModel.userData.anchor
    ) {


        newModel.userData.anchor =
            oldModel.userData.anchor;


        oldModel.userData.anchor =
            null;

    }



    scene.add(
        newModel
    );



    menuARState.placedObject =
        newModel;



    updateShadowAppearance(

        menuARState.activeShadow,

        newFood,

        menuARState.selectedSize

    );



    const sizeName =
        getCurrentSizePreset().label;



    if (
        menuARState.appState ===
            "MOVE_MODE"
    ) {


        setStatus(

            `Changed to ${getFoodName(newFood)} — ${sizeName} size kept. Choose a new spot.`

        );


    } else {


        menuARState.appState =
            "PLACED";



        setStatus(

            `Changed to ${getFoodName(newFood)} — ${sizeName} size kept.`

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
// AR INTERFACE
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

}



// ==========================================
// START XR SESSION
// ==========================================

async function startARSession() {


    if (

        !menuARState.xrSupported ||

        !menuARState.modelsReady ||

        xrSession ||

        isEndingXRSession

    ) {

        return;

    }



    ensureAudioContext();



    hideSupportMessage();



    navigateHomeAfterSessionEnd =
        false;



    startARBtn.disabled =
        true;


    startARBtn.textContent =
        "Starting...";



    try {


        const newSession =

            await navigator.xr.requestSession(

                "immersive-ar",

                {


                    requiredFeatures: [

                        "hit-test"

                    ],


                    optionalFeatures: [

                        "dom-overlay",

                        "local-floor",

                        "anchors"

                    ],


                    domOverlay: {

                        root:
                            document.body

                    }

                }

            );



        xrSession =
            newSession;



        await renderer.xr.setSession(
            newSession
        );



        viewerSpace =

            await newSession.requestReferenceSpace(
                "viewer"
            );



        try {


            referenceSpace =

                await newSession.requestReferenceSpace(
                    "local-floor"
                );


        } catch (error) {


            referenceSpace =

                await newSession.requestReferenceSpace(
                    "local"
                );

        }



        hitTestSource =

            await newSession.requestHitTestSource({

                space:
                    viewerSpace

            });



        newSession.addEventListener(

            "end",

            onARSessionEnded,

            {
                once:
                    true
            }

        );



        isEndingXRSession =
            false;


        isCleaningUpXRSession =
            false;



        menuARState.appState =
            "SCANNING";


        menuARState.surfaceFound =
            false;


        menuARState.selectedFood =
            "burger";


        menuARState.selectedSize =
            "medium";


        menuARState.confirmedItems =
            [];


        menuARState.orderPlaced =
            false;


        menuARState.nextItemId =
            1;



        document.body.classList.add(
            "xr-session-active"
        );



        showARInterface();



        dishSelectionArea.hidden =
            false;


        orderReviewPanel.hidden =
            true;


        orderCompletePanel.hidden =
            true;



        cancelOrderBtn.hidden =
            false;


        cancelOrderBtn.disabled =
            false;


        cancelOrderBtn.textContent =
            "Cancel Order";



        hideInteractionControls();



        updateFoodButtons(
            menuARState.selectedFood
        );


        updateSizeButtons();


        updateOrderBadge();



        setStatus(

            "Choose a dish and move your device slowly over the table."

        );


    } catch (error) {


        console.error(
            "Unable to start AR:",
            error
        );



        xrSession =
            null;


        viewerSpace =
            null;


        referenceSpace =
            null;


        hitTestSource =
            null;


        latestHitTestResult =
            null;


        isEndingXRSession =
            false;


        isCleaningUpXRSession =
            false;



        document.body.classList.remove(
            "xr-session-active"
        );



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
// END XR SESSION
// ==========================================

async function endARSession() {


    if (
        !xrSession
    ) {


        if (
            navigateHomeAfterSessionEnd
        ) {


            window.location.href =
                "index.html";


        } else {


            showPreARInterface();


            updateStartButton();

        }


        return;

    }



    if (
        isEndingXRSession
    ) {

        return;

    }



    isEndingXRSession =
        true;



    const sessionToEnd =
        xrSession;



    try {


        await sessionToEnd.end();


    } catch (error) {


        console.warn(

            "XR session could not end normally. Running cleanup.",

            error

        );



        onARSessionEnded();

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


        deleteAnchorFromObject(
            menuARState.placedObject
        );



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
// CLEAR CONFIRMED ITEMS
// ==========================================

function clearConfirmedItemsFromScene() {


    menuARState.confirmedItems.forEach(

        (item) => {


            if (
                item.object
            ) {


                deleteAnchorFromObject(
                    item.object
                );


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
// CANCEL ORDER
// ==========================================
//
// Removes:
// - current active preview
// - every dish already added to order
// - shadows
// - anchors
//
// Then ends AR and returns to the
// markerless Start screen.
//
// ==========================================

async function cancelOrder() {


    if (
        menuARState.appState ===
            "ORDER_CONFIRMED"
    ) {

        return;

    }



    if (
        isEndingXRSession
    ) {

        return;

    }



    navigateHomeAfterSessionEnd =
        false;



    cancelOrderBtn.disabled =
        true;


    cancelOrderBtn.textContent =
        "Cancelling...";



    reticle.visible =
        false;


    latestHitTestResult =
        null;



    removeActivePreviewFromScene();


    clearConfirmedItemsFromScene();



    menuARState.orderPlaced =
        false;


    menuARState.surfaceFound =
        false;



    await endARSession();

}



// ==========================================
// DONE
// ==========================================
//
// Done only exists after Place Order.
//
// It closes the WebXR session and then
// sends the customer back to index.html.
//
// ==========================================

async function finishOrder() {


    if (
        menuARState.appState !==
            "ORDER_CONFIRMED"
    ) {

        return;

    }



    if (
        isEndingXRSession
    ) {

        return;

    }



    navigateHomeAfterSessionEnd =
        true;



    doneBtn.disabled =
        true;


    doneBtn.textContent =
        "Done...";



    await endARSession();

}



// ==========================================
// INTERACTION CONTROLS
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


    addToOrderBtn.disabled =
        false;


    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;



    moveBtn.textContent =
        "↔ Move Dish";


    moveBtn.classList.remove(
        "active"
    );

}



// ==========================================
// DISABLE CONTROLS
// ==========================================

function disableManipulationControls() {


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


    addToOrderBtn.disabled =
        true;

}



// ==========================================
// MOVE MODE CONTROLS
// ==========================================

function setMoveModeControls() {


    sizeSmallBtn.disabled =
        true;


    sizeMediumBtn.disabled =
        true;


    sizeLargeBtn.disabled =
        true;


    removeBtn.disabled =
        true;


    addToOrderBtn.disabled =
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
// RESET UI
// ==========================================

function resetControls() {


    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;



    menuARState.selectedFood =
        "burger";


    menuARState.selectedSize =
        "medium";



    updateFoodButtons(
        menuARState.selectedFood
    );


    updateSizeButtons();



    disableManipulationControls();


    hideInteractionControls();



    dishSelectionArea.hidden =
        false;


    orderReviewPanel.hidden =
        true;


    orderCompletePanel.hidden =
        true;


    orderBadge.hidden =
        true;



    cancelOrderBtn.hidden =
        false;


    cancelOrderBtn.disabled =
        false;


    cancelOrderBtn.textContent =
        "Cancel Order";



    doneBtn.disabled =
        false;


    doneBtn.textContent =
        "Done";



    if (
        orderSummary
    ) {


        orderSummary.innerHTML =
            "";

    }



    if (
        finalOrderSummary
    ) {


        finalOrderSummary.innerHTML =
            "";

    }



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
        isCleaningUpXRSession
    ) {

        return;

    }



    isCleaningUpXRSession =
        true;



    const shouldNavigateHome =
        navigateHomeAfterSessionEnd;



    try {


        // ==================================
        // STOP HIT TEST
        // ==================================

        if (
            hitTestSource
        ) {


            try {


                hitTestSource.cancel();


            } catch (error) {


                console.warn(
                    "Hit-test source already closed."
                );

            }

        }



        hitTestSource =
            null;


        viewerSpace =
            null;


        referenceSpace =
            null;


        latestHitTestResult =
            null;



        // ==================================
        // RETICLE
        // ==================================

        if (
            reticle
        ) {


            reticle.visible =
                false;

        }



        // ==================================
        // REMOVE ALL AR FOOD
        // ==================================

        removeActivePreviewFromScene();


        clearConfirmedItemsFromScene();



        // ==================================
        // RESET STATE
        // ==================================

        menuARState.surfaceFound =
            false;


        menuARState.selectedFood =
            "burger";


        menuARState.selectedSize =
            "medium";


        menuARState.orderPlaced =
            false;


        menuARState.nextItemId =
            1;


        menuARState.appState =
            "READY_TO_SCAN";


        placementAnimation =
            null;


        orderPulseAnimation =
            null;


        ignoreXRSelectUntil =
            0;


        moveModeStartedAt =
            0;



        xrSession =
            null;



        document.body.classList.remove(
            "xr-session-active"
        );



        // ==================================
        // DONE → HOME
        // ==================================

        if (
            shouldNavigateHome
        ) {


            window.location.href =
                "index.html";


            return;

        }



        // ==================================
        // CANCEL → START SCREEN
        // ==================================

        resetControls();



        showPreARInterface();



        hideSupportMessage();



        updateStartButton();



        try {


            window.scrollTo({

                top:
                    0,

                left:
                    0,

                behavior:
                    "auto"

            });


        } catch (error) {


            window.scrollTo(
                0,
                0
            );

        }


    } catch (error) {


        console.error(

            "Error while cleaning up AR session:",

            error

        );



        xrSession =
            null;



        document.body.classList.remove(
            "xr-session-active"
        );



        if (
            shouldNavigateHome
        ) {


            window.location.href =
                "index.html";


        } else {


            resetControls();


            showPreARInterface();


            updateStartButton();

        }


    } finally {


        isEndingXRSession =
            false;


        isCleaningUpXRSession =
            false;


        navigateHomeAfterSessionEnd =
            false;

    }

}



// ==========================================
// EASING
// ==========================================

function easeOutCubic(
    t
) {


    return (

        1 -

        Math.pow(
            1 - t,
            3
        )

    );

}



function easeOutBack(
    t
) {


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
// PLACEMENT ANIMATION
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

        `Serving your ${getFoodName(food)} preview...`

    );

}



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


        menuARState.activeShadow.material.opacity =

            SHADOW_OPACITY *

            positionEase;

    }



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


        updateOrderBadge();



        setStatus(

            `Your ${getCurrentSizePreset().label} ${getFoodName(completedFood)} is ready. Adjust it, then add it to your order.`

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



    placedModel.userData.surfaceOffset =
        config.surfaceOffset;



    scene.add(
        placedModel
    );



    menuARState.placedObject =
        placedModel;



    const shadow =
        createShadowMesh(

            food,

            menuARState.selectedSize

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


    reticle.visible =
        false;



    hideInteractionControls();


    disableManipulationControls();



    createAnchorForHitResult(

        latestHitTestResult

    ).then(

        (anchor) => {


            if (
                !anchor
            ) {

                return;

            }



            const stillActive =

                menuARState.placedObject ===
                placedModel;



            const stillInOrder =

                menuARState.confirmedItems.some(

                    (item) =>
                        item.object === placedModel

                );



            if (

                stillActive ||

                stillInOrder

            ) {


                placedModel.userData.anchor =
                    anchor;


            } else {


                try {


                    anchor.delete();


                } catch (error) {

                    // Ignore.

                }

            }

        }

    );



    startPlacementAnimation(

        placedModel,

        food,

        finalScale,

        finalY

    );

}



// ==========================================
// MANIPULATION
// ==========================================

function canManipulate() {


    return (

        menuARState.placedObject !==
            null &&

        menuARState.appState ===
            "PLACED"

    );

}



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

        "Choose a new spot on the table, then tap the white circle."

    );

}



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



function repositionPlacedFood() {


    if (

        menuARState.appState !==
            "MOVE_MODE" ||

        !menuARState.placedObject ||

        !reticle.visible

    ) {

        return;

    }



    const objectBeingMoved =
        menuARState.placedObject;



    const savedQuaternion =

        objectBeingMoved
            .quaternion
            .clone();



    const savedScale =

        objectBeingMoved
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



    objectBeingMoved.position.copy(
        newPosition
    );



    objectBeingMoved.position.y +=
        config.surfaceOffset;



    objectBeingMoved.quaternion.copy(
        savedQuaternion
    );



    objectBeingMoved.scale.copy(
        savedScale
    );



    deleteAnchorFromObject(
        objectBeingMoved
    );



    createAnchorForHitResult(

        latestHitTestResult

    ).then(

        (anchor) => {


            if (

                anchor &&

                menuARState.placedObject ===
                    objectBeingMoved

            ) {


                objectBeingMoved.userData.anchor =
                    anchor;


            } else if (
                anchor
            ) {


                try {


                    anchor.delete();


                } catch (error) {

                    // Ignore.

                }

            }

        }

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


    reticle.visible =
        false;



    enableManipulationControls();



    setStatus(

        `${getFoodName(menuARState.selectedFood)} moved to the new spot.`

    );

}



// ==========================================
// REMOVE CURRENT DISH
// ==========================================

function removeFood() {


    if (
        !menuARState.placedObject
    ) {

        return;

    }



    const removedFood =
        getFoodName(
            menuARState.selectedFood
        );



    removeActivePreviewFromScene();



    menuARState.surfaceFound =
        false;


    menuARState.appState =
        "SCANNING";


    reticle.visible =
        false;



    hideInteractionControls();


    disableManipulationControls();



    updateOrderBadge();



    if (
        menuARState.confirmedItems.length >
        0
    ) {


        setStatus(

            `${removedFood} removed. Choose another dish to continue your order.`

        );


    } else {


        setStatus(

            `${removedFood} removed. Choose another spot when you're ready.`

        );

    }

}



// ==========================================
// ADD CURRENT ITEM TO ORDER
// ==========================================

function addCurrentItemToOrder() {


    if (
        !canManipulate()
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
            menuARState.activeShadow

    };



    item.object.userData.orderLocked =
        true;



    menuARState.confirmedItems.push(
        item
    );



    menuARState.placedObject =
        null;


    menuARState.activeShadow =
        null;



    playAddedSound();



    showOrderReview(

        `${SIZE_PRESETS[item.sizeKey].label} ${getFoodName(item.food)} added to your order.`

    );

}



// ==========================================
// AUTOMATIC ORDER REVIEW
// ==========================================

function showOrderReview(
    message = "Review your order."
) {


    if (
        menuARState.confirmedItems.length ===
        0
    ) {

        return;

    }



    menuARState.appState =
        "ORDER_REVIEW";


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;



    dishSelectionArea.hidden =
        true;


    hideInteractionControls();



    orderBadge.hidden =
        true;


    orderCompletePanel.hidden =
        true;


    orderReviewPanel.hidden =
        false;


    cancelOrderBtn.hidden =
        false;



    renderOrderSummary(
        orderSummary
    );



    setStatus(
        message
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


    menuARState.selectedSize =
        "medium";


    reticle.visible =
        false;



    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;



    dishSelectionArea.hidden =
        false;


    orderReviewPanel.hidden =
        true;


    orderCompletePanel.hidden =
        true;


    cancelOrderBtn.hidden =
        false;



    hideInteractionControls();



    updateSizeButtons();


    updateFoodButtons(
        menuARState.selectedFood
    );


    updateOrderBadge();



    setStatus(

        "Choose your next dish, then find another spot on the table."

    );

}



// ==========================================
// FINAL ORDER ANIMATION
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

                    orderPulseAnimation.durationPerItem,

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
            0 ||

        menuARState.placedObject

    ) {

        return;

    }



    menuARState.appState =
        "ORDER_CONFIRMED";


    menuARState.orderPlaced =
        true;


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;



    dishSelectionArea.hidden =
        true;


    hideInteractionControls();



    orderBadge.hidden =
        true;


    orderReviewPanel.hidden =
        true;


    orderCompletePanel.hidden =
        false;



    // Cancel is removed after confirmation.
    // Only Done remains.

    cancelOrderBtn.hidden =
        true;



    renderOrderSummary(
        finalOrderSummary
    );



    orderCompletePanel.classList.remove(
        "order-complete-pop"
    );



    void orderCompletePanel.offsetWidth;



    orderCompletePanel.classList.add(
        "order-complete-pop"
    );



    const itemCount =
        menuARState.confirmedItems.length;



    setStatus(

        `Order confirmed — ${itemCount} ${itemCount === 1 ? "dish" : "dishes"} selected.`

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
// RENDER / WEBXR HIT TEST
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



    // ======================================
    // ANCHOR TRACKING
    // ======================================

    if (

        frame &&

        referenceSpace

    ) {


        if (

            menuARState.placedObject &&

            menuARState.appState ===
                "PLACED"

        ) {


            applyAnchorTracking(

                menuARState.placedObject,

                menuARState.activeShadow,

                frame,

                referenceSpace

            );

        }



        menuARState.confirmedItems.forEach(

            (item) => {


                applyAnchorTracking(

                    item.object,

                    item.shadow,

                    frame,

                    referenceSpace

                );

            }

        );

    }



    // ======================================
    // WEBXR SPATIAL TRACKING / HIT TESTING
    // ======================================

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
            hitTestResults.length >
            0
        ) {


            const hit =
                hitTestResults[0];



            latestHitTestResult =
                hit;



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

                        `Perfect — tap the white circle to place your ${getFoodName(menuARState.selectedFood)}.`

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


            latestHitTestResult =
                null;


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

                    `Move your device slowly over the table to find a spot for your ${getFoodName(menuARState.selectedFood)}.`

                );

            }

        }

    } else {


        latestHitTestResult =
            null;

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
// FOOD BUTTONS
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
// SIZE BUTTONS
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
// MOVE
// ==========================================

moveBtn.addEventListener(

    "click",

    enterMoveMode

);



// ==========================================
// REMOVE CURRENT DISH
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
// ADD ANOTHER DISH
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

    async () => {


        markUITouch();


        await cancelOrder();

    }

);



// ==========================================
// DONE
// ==========================================

doneBtn.addEventListener(

    "click",

    async () => {


        markUITouch();


        await finishOrder();

    }

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
// INITIALIZE
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