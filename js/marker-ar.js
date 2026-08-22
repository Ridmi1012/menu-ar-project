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



// ------------------------------------------
// Marker AR State
// ------------------------------------------

const markerARState = {

    selectedFood: "burger",

    markerVisible: false,

    currentModelLoaded: false

};



// ------------------------------------------
// Model Configuration
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
// Apply Model
// ------------------------------------------

function applyMarkerFoodModel(food) {


    const config =
        MARKER_MODEL_CONFIG[food];


    markerARState.currentModelLoaded = false;


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


}



// ------------------------------------------
// Select Food
// ------------------------------------------

function selectMarkerFood(food) {


    markerARState.selectedFood = food;



    // Update Burger/Pizza button state

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



    // Replace displayed model

    applyMarkerFoodModel(food);



    console.log(
        "Marker AR selected food:",
        food
    );


}



// ------------------------------------------
// Burger Selection
// ------------------------------------------

markerBurgerBtn.addEventListener(
    "click",
    () => {

        selectMarkerFood("burger");

    }
);



// ------------------------------------------
// Pizza Selection
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


        console.log(
            `${markerARState.selectedFood} model loaded`
        );


    }
);



// ------------------------------------------
// Model Loading Error
// ------------------------------------------

markerFoodModel.addEventListener(
    "model-error",
    (event) => {


        markerARState.currentModelLoaded = false;


        console.error(
            "Marker model loading error:",
            event
        );


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


    }
);