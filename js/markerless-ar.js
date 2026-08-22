import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


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

const xrIntro =
    document.getElementById("xrIntro");

const xrViewport =
    document.getElementById("xrViewport");


// ==========================================
// Application State
// ==========================================

const menuARState = {

    selectedFood: "burger",

    appState: "CHECKING_SUPPORT",

    placedObject: null,

    currentScale: 1,

    currentRotation: 0,

    surfaceFound: false

};


// ==========================================
// Three.js Variables
// ==========================================

let scene;
let camera;
let renderer;
let reticle;

let xrSession = null;

let hitTestSource = null;

let viewerSpace = null;

let referenceSpace = null;


// ==========================================
// Initialize Three.js
// ==========================================

function initThreeJS() {

    scene = new THREE.Scene();


    camera =
        new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.01,
            20
        );


    renderer =
        new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.xr.enabled = true;


    renderer.domElement.classList.add(
        "xr-canvas"
    );


    xrViewport.appendChild(
        renderer.domElement
    );


    // --------------------------------------
    // Lighting
    // --------------------------------------

    const ambientLight =
        new THREE.HemisphereLight(
            0xffffff,
            0x444444,
            2
        );

    scene.add(ambientLight);


    // --------------------------------------
    // Placement Reticle
    // --------------------------------------

    const reticleGeometry =
        new THREE.RingGeometry(
            0.07,
            0.09,
            32
        );


    reticleGeometry.rotateX(
        -Math.PI / 2
    );


    const reticleMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });


    reticle =
        new THREE.Mesh(
            reticleGeometry,
            reticleMaterial
        );


    reticle.matrixAutoUpdate = false;

    reticle.visible = false;


    scene.add(reticle);


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
        statusMessage.textContent !== message
    ) {

        statusMessage.textContent =
            message;

    }

}


// ==========================================
// Food Selection
// ==========================================

function selectFood(food) {

    menuARState.selectedFood =
        food;


    if (food === "burger") {

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
        food === "burger"
            ? "Burger"
            : "Pizza";


    if (!xrSession) {

        setStatus(
            `${foodName} selected. Start AR to scan a surface.`
        );

    } else if (
        menuARState.surfaceFound
    ) {

        setStatus(
            `${foodName} selected. Surface detected.`
        );

    } else {

        setStatus(
            `${foodName} selected. Move your tablet slowly to scan the table.`
        );

    }


    console.log(
        "MenuAR state:",
        menuARState
    );

}


// ==========================================
// WebXR Support Check
// ==========================================

async function checkXRSupport() {

    if (!navigator.xr) {

        menuARState.appState =
            "UNSUPPORTED";


        startARBtn.disabled =
            true;


        setStatus(
            "WebXR is not available in this browser."
        );


        return;

    }


    try {

        const supported =
            await navigator.xr.isSessionSupported(
                "immersive-ar"
            );


        if (supported) {

            menuARState.appState =
                "READY_TO_SCAN";


            startARBtn.disabled =
                false;


            setStatus(
                "Burger selected. Ready to start AR."
            );

        } else {

            menuARState.appState =
                "UNSUPPORTED";


            startARBtn.disabled =
                true;


            setStatus(
                "Immersive AR is not supported on this device."
            );

        }

    } catch (error) {

        console.error(
            "WebXR support check failed:",
            error
        );


        startARBtn.disabled =
            true;


        setStatus(
            "Unable to check WebXR support."
        );

    }

}


// ==========================================
// Start AR Session
// ==========================================

async function startARSession() {

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
                        root: document.body
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


        referenceSpace =
            await xrSession.requestReferenceSpace(
                "local"
            );


        hitTestSource =
            await xrSession.requestHitTestSource({
                space: viewerSpace
            });


        xrSession.addEventListener(
            "end",
            onARSessionEnded
        );


        menuARState.appState =
            "SCANNING";


        menuARState.surfaceFound =
            false;


        startARBtn.textContent =
            "Exit AR";


        xrIntro.classList.add(
            "xr-active"
        );


        setStatus(
            "Move your tablet slowly across the table."
        );


        console.log(
            "WebXR AR session started."
        );

    } catch (error) {

        console.error(
            "Could not start AR session:",
            error
        );


        xrSession = null;


        setStatus(
            "AR could not start. Check camera permission and WebXR support."
        );

    }

}


// ==========================================
// End AR Session
// ==========================================

async function endARSession() {

    if (xrSession) {

        await xrSession.end();

    }

}


// ==========================================
// AR Session End Cleanup
// ==========================================

function onARSessionEnded() {

    if (hitTestSource) {

        hitTestSource.cancel();

    }


    hitTestSource = null;

    viewerSpace = null;

    referenceSpace = null;

    xrSession = null;


    reticle.visible =
        false;


    menuARState.surfaceFound =
        false;


    menuARState.appState =
        "READY_TO_SCAN";


    startARBtn.textContent =
        "Start AR";


    xrIntro.classList.remove(
        "xr-active"
    );


    const foodName =
        menuARState.selectedFood === "burger"
            ? "Burger"
            : "Pizza";


    setStatus(
        `${foodName} selected. Ready to start AR.`
    );


    console.log(
        "WebXR AR session ended."
    );

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
        referenceSpace
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


                    setStatus(
                        "Surface detected. Placement indicator ready."
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


                setStatus(
                    "Surface lost. Move your tablet slowly across the table."
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
// Button Events
// ==========================================

burgerBtn.addEventListener(
    "click",
    () => {

        selectFood("burger");

    }
);


pizzaBtn.addEventListener(
    "click",
    () => {

        selectFood("pizza");

    }
);


startARBtn.addEventListener(
    "click",
    async () => {

        if (xrSession) {

            await endARSession();

        } else {

            await startARSession();

        }

    }
);


// ==========================================
// Resize Handling
// ==========================================

window.addEventListener(
    "resize",
    () => {

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
// Start Application
// ==========================================

initThreeJS();

selectFood("burger");

checkXRSupport();