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
        label: "Small",
        factor: 0.78
    },

    medium: {
        label: "Medium",
        factor: 1.0
    },

    large: {
        label: "Large",
        factor: 1.30
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
// SETTINGS
// ==========================================

const UI_SELECT_GUARD_MS =
    650;

const MOVE_ACTIVATION_DELAY_MS =
    700;

const PLACEMENT_DURATION =
    560;

const PLACEMENT_START_SCALE_FACTOR =
    0.45;

const PLACEMENT_LIFT =
    0.10;

const SHADOW_OPACITY =
    0.44;



let ignoreXRSelectUntil =
    0;

let moveModeStartedAt =
    0;

let placementAnimation =
    null;

let orderPulseAnimation =
    null;



// ==========================================
// THREE / WEBXR
// ==========================================

let scene;

let camera;

let renderer;

let reticle;

let controller;

let shadowTexture =
    null;

let shadowGeometry =
    null;

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

let isEndingXRSession =
    false;

let isCleaningUpXRSession =
    false;

let reloadPageAfterSessionEnd =
    false;



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
// SOFT SHADOW
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
// THREE INITIALIZATION
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



    // LIGHTING

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



    // SHADOW

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



    // RETICLE

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
            color: 0xffffff,
            side: THREE.DoubleSide
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



    // CONTROLLER

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
// SHADOW FUNCTIONS
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
            "Anchor creation failed.",
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
                "Anchor already unavailable."
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
        now + duration
    );


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        volume,
        now + 0.015
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + duration
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
        0.035
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
// HELPERS
// ==========================================

function setStatus(
    message
) {

    statusMessage.textContent =
        message;
}



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



function getFoodName(
    food
) {

    return food ===
        "burger"
        ? "Burger"
        : "Pizza";
}



function getCurrentSizePreset() {

    return SIZE_PRESETS[
        menuARState.selectedSize
    ];
}



function getCurrentModelScale(
    food
) {

    return (

        MODEL_CONFIG[food].baseScale *

        getCurrentSizePreset().factor

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
    }
}



// ==========================================
// BUTTON UI
// ==========================================

function updateFoodButtons(
    food
) {

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



function updateSizeButtons() {

    sizeSmallBtn.classList.toggle(
        "active",
        menuARState.selectedSize ===
            "small"
    );


    sizeMediumBtn.classList.toggle(
        "active",
        menuARState.selectedSize ===
            "medium"
    );


    sizeLargeBtn.classList.toggle(
        "active",
        menuARState.selectedSize ===
            "large"
    );
}



// ==========================================
// ORDER SUMMARY
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



function renderOrderSummary(
    container
) {

    container.innerHTML =
        "";


    getGroupedOrderItems().forEach(
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
// SIZE
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
// FOOD
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


    if (
        menuARState.placedObject
    ) {

        if (
            previousFood !==
            food
        ) {

            replacePlacedFood(
                food,
                previousFood
            );
        }


        return;
    }


    if (
        xrSession
    ) {

        setStatus(
            `${getFoodName(food)} selected. Find a spot on the table.`
        );
    }
}



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


    const oldPosition =
        oldModel.position.clone();


    const oldQuaternion =
        oldModel.quaternion.clone();


    const oldAnchor =
        oldModel.userData.anchor ||
        null;


    scene.remove(
        oldModel
    );


    const newModel =
        template.clone(true);


    newModel.position.copy(
        oldPosition
    );


    newModel.position.y +=
        MODEL_CONFIG[newFood].surfaceOffset -
        MODEL_CONFIG[previousFood].surfaceOffset;


    newModel.quaternion.copy(
        oldQuaternion
    );


    newModel.scale.setScalar(
        getCurrentModelScale(
            newFood
        )
    );


    newModel.userData.surfaceOffset =
        MODEL_CONFIG[newFood].surfaceOffset;


    if (
        oldAnchor
    ) {

        newModel.userData.anchor =
            oldAnchor;


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


    setStatus(
        `Changed to ${getFoodName(newFood)}.`
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

        menuARState.xrSupported =
            await navigator.xr.isSessionSupported(
                "immersive-ar"
            );


        if (
            menuARState.xrSupported
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
            "XR support check failed:",
            error
        );


        menuARState.xrSupported =
            false;


        menuARState.appState =
            "UNSUPPORTED";


        showSupportMessage(
            "Unable to check AR support on this device."
        );


        updateStartButton();
    }
}



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
// INTERFACE
// ==========================================

function showARInterface() {

    xrIntro.hidden =
        true;


    arControls.hidden =
        false;
}



function showPreARInterface() {

    arControls.hidden =
        true;


    xrIntro.hidden =
        false;
}



// ==========================================
// START AR
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


        doneBtn.disabled =
            false;


        doneBtn.textContent =
            "Done";


        hideInteractionControls();


        updateFoodButtons(
            "burger"
        );


        updateSizeButtons();


        updateOrderBadge();


        resetMoveButton();


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


        showPreARInterface();


        updateStartButton();
    }
}



// ==========================================
// END AR
// ==========================================

async function endARSession() {

    if (
        !xrSession
    ) {

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
            "XR end failed:",
            error
        );


        onARSessionEnded();
    }
}



// ==========================================
// REMOVE OBJECTS
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


    cancelOrderBtn.disabled =
        true;


    cancelOrderBtn.textContent =
        "Cancelling...";


    if (
        reticle
    ) {

        reticle.visible =
            false;
    }


    removeActivePreviewFromScene();


    clearConfirmedItemsFromScene();


    menuARState.surfaceFound =
        false;


    menuARState.orderPlaced =
        false;


    await endARSession();
}



// ==========================================
// DONE
// ==========================================
//
// IMPORTANT:
// We do NOT navigate to index.html.
//
// The user is already on markerless.html.
// We safely end WebXR and return to the
// normal markerless Start screen.
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


    reloadPageAfterSessionEnd =
        true;


    doneBtn.disabled =
        true;


    doneBtn.textContent =
        "Closing...";


    await endARSession();
}



// ==========================================
// MOVE BUTTON HELPERS
// ==========================================
//
// Fixes the original issue where the button
// stayed as "Choose New Spot" after moving.
//
// ==========================================

function resetMoveButton() {

    moveBtn.textContent =
        "↔ Move Dish";


    moveBtn.classList.remove(
        "active"
    );
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


    // IMPORTANT FIX
    // Every time manipulation becomes available
    // again the button returns to "Move Dish".

    resetMoveButton();
}



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


    // During move mode this button is only
    // showing the current action.
    // The user moves the dish by tapping
    // the new white reticle position.

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

    menuARState.selectedFood =
        "burger";


    menuARState.selectedSize =
        "medium";


    burgerBtn.disabled =
        false;


    pizzaBtn.disabled =
        false;


    updateFoodButtons(
        "burger"
    );


    updateSizeButtons();


    disableManipulationControls();


    resetMoveButton();


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


    orderSummary.innerHTML =
        "";


    finalOrderSummary.innerHTML =
        "";
}



// ==========================================
// SESSION ENDED
// ==========================================

function onARSessionEnded() {

    if (
        isCleaningUpXRSession
    ) {
        return;
    }


    isCleaningUpXRSession =
        true;


    const shouldReload =
        reloadPageAfterSessionEnd;


    try {

        if (
            hitTestSource
        ) {

            try {

                hitTestSource.cancel();

            } catch (error) {

                console.warn(
                    "Hit test already closed."
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


        if (
            reticle
        ) {

            reticle.visible =
                false;
        }


        xrSession =
            null;


        document.body.classList.remove(
            "xr-session-active"
        );


        // ==================================
        // DONE
        // Reload markerless.html completely.
        // This gives us a clean fresh state.
        // ==================================

        if (
            shouldReload
        ) {

            window.setTimeout(
                () => {

                    window.location.reload();

                },
                300
            );


            return;
        }


        // ==================================
        // NORMAL CANCEL ORDER
        // ==================================

        removeActivePreviewFromScene();


        clearConfirmedItemsFromScene();


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


        resetControls();


        showPreARInterface();


        hideSupportMessage();


        updateStartButton();


    } catch (error) {

        console.error(
            "XR cleanup error:",
            error
        );


        xrSession =
            null;


        document.body.classList.remove(
            "xr-session-active"
        );


        if (
            shouldReload
        ) {

            window.setTimeout(
                () => {

                    window.location.reload();

                },
                300
            );


            return;
        }


        resetControls();


        showPreARInterface();


        updateStartButton();


    } finally {

        isEndingXRSession =
            false;


        isCleaningUpXRSession =
            false;


        reloadPageAfterSessionEnd =
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
        c1 + 1;


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


    menuARState.appState =
        "PLACING";


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


        showInteractionControls();


        enableManipulationControls();


        updateSizeButtons();


        updateOrderBadge();


        setStatus(
            `Your ${getCurrentSizePreset().label} ${getFoodName(completedFood)} is ready.`
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


    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        reticle.matrix
    );


    placedModel.position.copy(
        position
    );


    placedModel.position.y +=
        config.surfaceOffset;


    const finalY =
        placedModel.position.y;


    const quaternion =
        new THREE.Quaternion();


    const ignoredScale =
        new THREE.Vector3();


    reticle.matrix.decompose(
        new THREE.Vector3(),
        quaternion,
        ignoredScale
    );


    placedModel.quaternion.copy(
        quaternion
    );


    const finalScale =
        getCurrentModelScale(
            food
        );


    placedModel.scale.setScalar(
        finalScale
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


    createAnchorForHitResult(
        latestHitTestResult
    ).then(
        (anchor) => {

            if (
                anchor &&
                menuARState.placedObject ===
                    placedModel
            ) {

                placedModel.userData.anchor =
                    anchor;
            }
        }
    );


    reticle.visible =
        false;


    startPlacementAnimation(
        placedModel,
        food,
        finalScale,
        finalY
    );
}



// ==========================================
// MOVE MODE
// ==========================================

function canManipulate() {

    return (
        menuARState.placedObject &&
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
        "Move your device to find a new spot on the table."
    );
}



function setMoveModeStatus() {

    if (
        menuARState.surfaceFound
    ) {

        setStatus(
            "New spot found. Tap the white circle to move your dish."
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


    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        reticle.matrix
    );


    objectBeingMoved.position.copy(
        position
    );


    objectBeingMoved.position.y +=
        MODEL_CONFIG[
            menuARState.selectedFood
        ].surfaceOffset;


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


    // IMPORTANT FIX
    // Enables Move again and resets the text
    // from "Choose New Spot" to "Move Dish".

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
        !menuARState.placedObject
    ) {

        return;
    }


    removeActivePreviewFromScene();


    menuARState.appState =
        "SCANNING";


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;


    hideInteractionControls();


    disableManipulationControls();


    resetMoveButton();


    setStatus(
        "Dish removed. Find another spot."
    );
}



// ==========================================
// ADD TO ORDER
// ==========================================

function addCurrentItemToOrder() {

    if (
        !canManipulate()
    ) {

        return;
    }


    menuARState.confirmedItems.push({

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

    });


    menuARState.placedObject =
        null;


    menuARState.activeShadow =
        null;


    resetMoveButton();


    playAddedSound();


    showOrderReview(
        "Dish added to your order."
    );
}



// ==========================================
// ORDER REVIEW
// ==========================================

function showOrderReview(
    message
) {

    menuARState.appState =
        "ORDER_REVIEW";


    reticle.visible =
        false;


    dishSelectionArea.hidden =
        true;


    hideInteractionControls();


    orderBadge.hidden =
        true;


    orderReviewPanel.hidden =
        false;


    orderCompletePanel.hidden =
        true;


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
// ADD ANOTHER
// ==========================================

function addAnotherDish() {

    menuARState.appState =
        "SCANNING";


    menuARState.surfaceFound =
        false;


    menuARState.selectedSize =
        "medium";


    reticle.visible =
        false;


    dishSelectionArea.hidden =
        false;


    orderReviewPanel.hidden =
        true;


    orderCompletePanel.hidden =
        true;


    hideInteractionControls();


    disableManipulationControls();


    resetMoveButton();


    updateSizeButtons();


    updateFoodButtons(
        menuARState.selectedFood
    );


    updateOrderBadge();


    setStatus(
        "Choose your next dish and find another spot."
    );
}



// ==========================================
// ORDER PULSE
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

        duration:
            500

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


    const progress =
        THREE.MathUtils.clamp(

            (
                timestamp -
                orderPulseAnimation.startTime
            ) /

            orderPulseAnimation.duration,

            0,
            1

        );


    const pulse =
        1 +
        0.05 *
        Math.sin(
            Math.PI *
            progress
        );


    menuARState.confirmedItems.forEach(
        (item) => {

            const scale =
                MODEL_CONFIG[
                    item.food
                ].baseScale *
                SIZE_PRESETS[
                    item.sizeKey
                ].factor;


            item.object.scale.setScalar(
                scale *
                pulse
            );
        }
    );


    if (
        progress >=
        1
    ) {

        menuARState.confirmedItems.forEach(
            (item) => {

                const scale =
                    MODEL_CONFIG[
                        item.food
                    ].baseScale *
                    SIZE_PRESETS[
                        item.sizeKey
                    ].factor;


                item.object.scale.setScalar(
                    scale
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


    menuARState.orderPlaced =
        true;


    menuARState.surfaceFound =
        false;


    reticle.visible =
        false;


    dishSelectionArea.hidden =
        true;


    orderReviewPanel.hidden =
        true;


    hideInteractionControls();


    cancelOrderBtn.hidden =
        true;


    orderCompletePanel.hidden =
        false;


    doneBtn.disabled =
        false;


    doneBtn.textContent =
        "Done";


    renderOrderSummary(
        finalOrderSummary
    );


    setStatus(
        "Order confirmed."
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
// RENDER
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



    // ANCHOR TRACKING

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



    // HIT TESTING

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

        const results =
            frame.getHitTestResults(
                hitTestSource
            );


        if (
            results.length >
            0
        ) {

            latestHitTestResult =
                results[0];


            const pose =
                latestHitTestResult.getPose(
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
                    menuARState.appState ===
                        "MOVE_MODE"
                ) {

                    setMoveModeStatus();

                } else {

                    menuARState.appState =
                        "SURFACE_FOUND";


                    setStatus(
                        `Tap the white circle to place your ${getFoodName(menuARState.selectedFood)}.`
                    );
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
                    "Move your device slowly over the table."
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
// UI TAP PROTECTION
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
        capture: true,
        passive: true
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
// EVENTS
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


moveBtn.addEventListener(
    "click",
    enterMoveMode
);


removeBtn.addEventListener(
    "click",
    removeFood
);


addToOrderBtn.addEventListener(
    "click",
    addCurrentItemToOrder
);


addAnotherBtn.addEventListener(
    "click",
    addAnotherDish
);


placeOrderBtn.addEventListener(
    "click",
    placeOrder
);


cancelOrderBtn.addEventListener(
    "click",
    async () => {

        markUITouch();

        await cancelOrder();
    }
);


doneBtn.addEventListener(
    "click",
    async () => {

        markUITouch();

        await finishOrder();
    }
);


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


    await Promise.all([

        loadModels(),

        checkXRSupport()

    ]);


    updateStartButton();
}



initializeApplication();