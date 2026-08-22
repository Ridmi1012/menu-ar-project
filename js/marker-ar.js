// ==========================================
// MenuAR - Marker Based AR
// ==========================================


// ------------------------------------------
// DOM References
// ------------------------------------------

const markerBurgerBtn =
    document.getElementById("markerBurgerBtn");

const markerPizzaBtn =
    document.getElementById("markerPizzaBtn");

const markerFoodModel =
    document.getElementById("markerFoodModel");

const hiroMarker =
    document.getElementById("hiroMarker");

const markerStatus =
    document.getElementById("markerStatus");


// ------------------------------------------
// Application State
// ------------------------------------------

const markerARState = {

    selectedFood: "burger",

    markerVisible: false,

    currentModelLoaded: false,

    modelError: false

};


// ------------------------------------------
// Marker Model Calibration
// ------------------------------------------
//
// IMPORTANT:
//
// These values are NOT the same as the
// model-test.html values.
//
// Marker AR uses the marker as its world
// reference, so the models need their own
// marker-specific scales.
//
// ------------------------------------------

const MARKER_MODEL_CONFIG = {

    burger: {

        model: "#burgerModel",

        scale: "1.8 1.8 1.8",

        position: "0 0.18 0",

        rotation: "0 0 0"

    },


    pizza: {

        model: "#pizzaModel",

        scale: "1.2 1.2 1.2",

        position: "0 0.06 0",

        rotation: "0 0 0"

    }

};


// ------------------------------------------
// Food Name
// ------------------------------------------

function getMarkerFoodName() {

    return markerARState.selectedFood === "burger"
        ? "Burger"
        : "Pizza";

}


// ------------------------------------------
// Status Message
// ------------------------------------------

function updateMarkerStatus() {

    const foodName =
        getMarkerFoodName();


    if (markerARState.modelError) {

        markerStatus.textContent =
            `${foodName} model could not be loaded.`;

        markerStatus.classList.remove(
            "detected"
        );

        return;

    }


    if (!markerARState.currentModelLoaded) {

        markerStatus.textContent =
            `Loading ${foodName} model...`;

        markerStatus.classList.remove(
            "detected"
        );

        return;

    }


    if (markerARState.markerVisible) {

        markerStatus.textContent =
            `Marker detected — displaying ${foodName}.`;

        markerStatus.classList.add(
            "detected"
        );

        return;

    }


    markerStatus.textContent =
        `Looking for Hiro marker — ${foodName} ready.`;

    markerStatus.classList.remove(
        "detected"
    );

}


// ------------------------------------------
// Apply Selected Model
// ------------------------------------------

function applyMarkerFoodModel(food) {

    const config =
        MARKER_MODEL_CONFIG[food];


    markerARState.currentModelLoaded = false;

    markerARState.modelError = false;


    markerFoodModel.setAttribute(
        "position",
        config.position
    );


    markerFoodModel.setAttribute(
        "rotation",
        config.rotation
    );


    markerFoodModel.setAttribute(
        "scale",
        config.scale
    );


    markerFoodModel.setAttribute(
        "gltf-model",
        config.model
    );


    updateMarkerStatus();

}


// ------------------------------------------
// Select Food
// ------------------------------------------

function selectMarkerFood(food) {

    markerARState.selectedFood = food;


    if (food === "burger") {

        markerBurgerBtn.classList.add(
            "active"
        );

        markerPizzaBtn.classList.remove(
            "active"
        );

    } else {

        markerPizzaBtn.classList.add(
            "active"
        );

        markerBurgerBtn.classList.remove(
            "active"
        );

    }


    applyMarkerFoodModel(food);


    console.log(
        "Marker AR selected food:",
        food
    );

}


// ------------------------------------------
// Burger Button
// ------------------------------------------

markerBurgerBtn.addEventListener(
    "click",
    () => {

        selectMarkerFood("burger");

    }
);


// ------------------------------------------
// Pizza Button
// ------------------------------------------

markerPizzaBtn.addEventListener(
    "click",
    () => {

        selectMarkerFood("pizza");

    }
);


// ------------------------------------------
// Model Loaded
// ------------------------------------------

markerFoodModel.addEventListener(
    "model-loaded",
    () => {

        markerARState.currentModelLoaded = true;

        markerARState.modelError = false;


        console.log(
            `${getMarkerFoodName()} model loaded`
        );


        updateMarkerStatus();

    }
);


// ------------------------------------------
// Model Error
// ------------------------------------------

markerFoodModel.addEventListener(
    "model-error",
    (event) => {

        markerARState.currentModelLoaded = false;

        markerARState.modelError = true;


        console.error(
            "Marker model loading error:",
            event
        );


        updateMarkerStatus();

    }
);


// ------------------------------------------
// Marker Found
// ------------------------------------------

hiroMarker.addEventListener(
    "markerFound",
    () => {

        markerARState.markerVisible = true;


        console.log(
            "Hiro marker detected"
        );


        updateMarkerStatus();

    }
);


// ------------------------------------------
// Marker Lost
// ------------------------------------------

hiroMarker.addEventListener(
    "markerLost",
    () => {

        markerARState.markerVisible = false;


        console.log(
            "Hiro marker lost"
        );


        updateMarkerStatus();

    }
);


// ------------------------------------------
// Initial State
// ------------------------------------------

updateMarkerStatus();