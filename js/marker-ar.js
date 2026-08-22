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
// Marker AR State
// ------------------------------------------

const markerARState = {
    selectedFood: "burger",
    markerVisible: false
};


// ------------------------------------------
// Food Model Configuration
// ------------------------------------------

const MARKER_MODEL_CONFIG = {

    burger: {
        model: "#burgerModel",
        scale: "0.7 0.7 0.7",
        position: "0 0.35 0"
    },

    pizza: {
        model: "#pizzaModel",
        scale: "0.7 0.7 0.7",
        position: "0 0.15 0"
    }

};


// ------------------------------------------
// Update Selected Food
// ------------------------------------------

function selectMarkerFood(food) {

    markerARState.selectedFood = food;

    const config =
        MARKER_MODEL_CONFIG[food];


    // Change active button
    if (food === "burger") {

        markerBurgerBtn.classList.add("active");
        markerPizzaBtn.classList.remove("active");

    } else {

        markerPizzaBtn.classList.add("active");
        markerBurgerBtn.classList.remove("active");

    }


    // Change 3D model
    markerFoodModel.setAttribute(
        "gltf-model",
        config.model
    );

    markerFoodModel.setAttribute(
        "scale",
        config.scale
    );

    markerFoodModel.setAttribute(
        "position",
        config.position
    );


    updateMarkerStatus();

    console.log(
        "Marker AR selected food:",
        markerARState.selectedFood
    );
}


// ------------------------------------------
// Status Feedback
// ------------------------------------------

function updateMarkerStatus() {

    const foodName =
        markerARState.selectedFood === "burger"
            ? "Burger"
            : "Pizza";


    if (markerARState.markerVisible) {

        markerStatus.textContent =
            `Marker detected — displaying ${foodName}.`;

        markerStatus.classList.add("detected");

    } else {

        markerStatus.textContent =
            `Looking for Hiro marker — ${foodName} selected.`;

        markerStatus.classList.remove("detected");

    }

}


// ------------------------------------------
// Food Selection Buttons
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
// Marker Tracking Events
// ------------------------------------------

hiroMarker.addEventListener(
    "markerFound",
    () => {

        markerARState.markerVisible = true;

        updateMarkerStatus();

        console.log("Hiro marker detected");

    }
);


hiroMarker.addEventListener(
    "markerLost",
    () => {

        markerARState.markerVisible = false;

        updateMarkerStatus();

        console.log("Hiro marker lost");

    }
);


// ------------------------------------------
// Initial UI
// ------------------------------------------

updateMarkerStatus();