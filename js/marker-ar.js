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

const burgerModelAsset =
    document.getElementById("burgerModel");

const pizzaModelAsset =
    document.getElementById("pizzaModel");


// ------------------------------------------
// Marker AR State
// ------------------------------------------

const markerARState = {

    selectedFood: "burger",

    markerVisible: false,

    currentModelLoaded: false,

    modelError: false

};


// ------------------------------------------
// Model Configuration
// ------------------------------------------
//
// These values are intentionally different
// from the old Kenney-model values.
//
// They are starting calibration values for
// the new realistic GLB assets.
//
// ------------------------------------------

const MARKER_MODEL_CONFIG = {

    burger: {

        model: "#burgerModel",

        scale: "5 5 5",

        position: "0 0.55 0",

        rotation: "0 0 0"

    },


    pizza: {

        model: "#pizzaModel",

        scale: "4 4 4",

        position: "0 0.42 0",

        rotation: "0 0 0"

    }

};


// ------------------------------------------
// Get Display Food Name
// ------------------------------------------

function getFoodName() {

    return markerARState.selectedFood === "burger"
        ? "Burger"
        : "Pizza";

}


// ------------------------------------------
// Status Feedback
// ------------------------------------------

function updateMarkerStatus() {

    const foodName = getFoodName();


    // Model loading failed
    if (markerARState.modelError) {

        markerStatus.textContent =
            `${foodName} model could not be loaded.`;

        markerStatus.classList.remove("detected");

        return;

    }


    // Model is still loading
    if (!markerARState.currentModelLoaded) {

        markerStatus.textContent =
            `Loading ${foodName} model...`;

        markerStatus.classList.remove("detected");

        return;

    }


    // Marker currently detected
    if (markerARState.markerVisible) {

        markerStatus.textContent =
            `Marker detected — displaying ${foodName}.`;

        markerStatus.classList.add("detected");

        return;

    }


    // Model ready but marker not detected
    markerStatus.textContent =
        `Looking for Hiro marker — ${foodName} ready.`;

    markerStatus.classList.remove("detected");

}


// ------------------------------------------
// Apply Selected Food Model
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

    // Avoid unnecessary reload if already selected
    if (
        markerARState.selectedFood === food &&
        markerARState.currentModelLoaded
    ) {

        return;

    }


    markerARState.selectedFood = food;


    // Update UI buttons
    if (food === "burger") {

        markerBurgerBtn.classList.add("active");

        markerPizzaBtn.classList.remove("active");

    } else {

        markerPizzaBtn.classList.add("active");

        markerBurgerBtn.classList.remove("active");

    }


    applyMarkerFoodModel(food);


    console.log(
        "Marker AR selected food:",
        markerARState.selectedFood
    );

}


// ------------------------------------------
// Food Selection Button Events
// ------------------------------------------

markerBurgerBtn.addEventListener(
    "click",
    () => {

        selectMarkerFood("burger");

    }
);


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
            `${getFoodName()} model loaded successfully`
        );


        updateMarkerStatus();

    }
);


// ------------------------------------------
// Model Loading Error
// ------------------------------------------

markerFoodModel.addEventListener(
    "model-error",
    (event) => {

        markerARState.currentModelLoaded = false;

        markerARState.modelError = true;


        console.error(
            "Marker AR model loading error:",
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
// Asset Diagnostics
// ------------------------------------------

burgerModelAsset.addEventListener(
    "loaded",
    () => {

        console.log(
            "Burger GLB asset downloaded"
        );

    }
);


pizzaModelAsset.addEventListener(
    "loaded",
    () => {

        console.log(
            "Pizza GLB asset downloaded"
        );

    }
);


// ------------------------------------------
// Initial State
// ------------------------------------------

updateMarkerStatus();