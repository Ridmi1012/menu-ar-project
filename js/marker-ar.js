// ==========================================
// MenuAR - Marker Based AR
// ==========================================


// ==========================================
// DOM REFERENCES
// ==========================================

const markerBurgerBtn =
    document.getElementById(
        "markerBurgerBtn"
    );


const markerPizzaBtn =
    document.getElementById(
        "markerPizzaBtn"
    );


const markerFoodModel =
    document.getElementById(
        "markerFoodModel"
    );


const hiroMarker =
    document.getElementById(
        "hiroMarker"
    );



// ==========================================
// APPLICATION STATE
// ==========================================

const markerARState = {

    selectedFood:
        "burger",

    markerVisible:
        false,

    currentModelLoaded:
        false

};



// ==========================================
// MODEL CONFIGURATION
// ==========================================

const MARKER_MODEL_CONFIG = {


    burger: {

        model:
            "#burgerModel",

        scale:
            1.8,

        positionY:
            0.18,

        rotation:
            "0 0 0"

    },


    pizza: {

        model:
            "#pizzaModel",

        scale:
            1.2,

        positionY:
            0.06,

        rotation:
            "0 0 0"

    }


};



// ==========================================
// ANIMATION CONFIGURATION
// ==========================================

// Starting size compared with final size.

const REVEAL_START_SCALE_FACTOR =
    0.72;


// Small vertical drop creates a
// "dish being placed down" effect.

const REVEAL_HEIGHT =
    0.07;


// Animation duration in milliseconds.

const REVEAL_DURATION =
    360;



// ==========================================
// SCALE STRING
// ==========================================

function createScaleString(value) {


    return (
        `${value} ${value} ${value}`
    );

}



// ==========================================
// POSITION STRING
// ==========================================

function createPositionString(y) {


    return (
        `0 ${y} 0`
    );

}



// ==========================================
// CLEAR PREVIOUS ANIMATION
// ==========================================

function clearRevealAnimation() {


    markerFoodModel.removeAttribute(
        "animation__revealScale"
    );


    markerFoodModel.removeAttribute(
        "animation__revealPosition"
    );

}



// ==========================================
// RESET MODEL TO FINAL TRANSFORM
// ==========================================

function resetModelTransform() {


    const config =
        MARKER_MODEL_CONFIG[
            markerARState.selectedFood
        ];



    clearRevealAnimation();



    markerFoodModel.setAttribute(
        "scale",
        createScaleString(
            config.scale
        )
    );



    markerFoodModel.setAttribute(
        "position",
        createPositionString(
            config.positionY
        )
    );



    markerFoodModel.setAttribute(
        "rotation",
        config.rotation
    );

}



// ==========================================
// FOOD REVEAL ANIMATION
// ==========================================
//
// Effect:
//
// slightly smaller
//        +
// slightly higher
//
//        ↓
//
// settles into its final location.
//
// ==========================================

function playFoodRevealAnimation() {


    if (
        !markerARState.markerVisible
    ) {

        return;

    }



    const config =
        MARKER_MODEL_CONFIG[
            markerARState.selectedFood
        ];



    const startScale =

        config.scale *

        REVEAL_START_SCALE_FACTOR;



    const startPositionY =

        config.positionY +

        REVEAL_HEIGHT;



    clearRevealAnimation();



    // --------------------------------------
    // Start values
    // --------------------------------------

    markerFoodModel.setAttribute(

        "scale",

        createScaleString(
            startScale
        )

    );



    markerFoodModel.setAttribute(

        "position",

        createPositionString(
            startPositionY
        )

    );



    // --------------------------------------
    // Wait one frame before adding
    // animation attributes.
    //
    // This lets A-Frame register the
    // starting transform first.
    // --------------------------------------

    requestAnimationFrame(

        () => {


            markerFoodModel.setAttribute(

                "animation__revealScale",

                [
                    "property: scale",
                    `from: ${createScaleString(startScale)}`,
                    `to: ${createScaleString(config.scale)}`,
                    `dur: ${REVEAL_DURATION}`,
                    "easing: easeOutQuad"
                ].join("; ")

            );



            markerFoodModel.setAttribute(

                "animation__revealPosition",

                [
                    "property: position",
                    `from: ${createPositionString(startPositionY)}`,
                    `to: ${createPositionString(config.positionY)}`,
                    `dur: ${REVEAL_DURATION}`,
                    "easing: easeOutQuad"
                ].join("; ")

            );


        }

    );

}



// ==========================================
// UPDATE FOOD BUTTONS
// ==========================================

function updateFoodButtons(food) {


    if (
        food === "burger"
    ) {


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

}



// ==========================================
// APPLY FOOD MODEL
// ==========================================

function applyMarkerFoodModel(food) {


    const config =
        MARKER_MODEL_CONFIG[
            food
        ];



    markerARState.currentModelLoaded =
        false;



    clearRevealAnimation();



    // Set final transform first.

    markerFoodModel.setAttribute(

        "position",

        createPositionString(
            config.positionY
        )

    );



    markerFoodModel.setAttribute(

        "rotation",

        config.rotation

    );



    markerFoodModel.setAttribute(

        "scale",

        createScaleString(
            config.scale
        )

    );



    // Change model.

    markerFoodModel.setAttribute(

        "gltf-model",

        config.model

    );

}



// ==========================================
// SELECT FOOD
// ==========================================

function selectMarkerFood(food) {


    if (
        markerARState.selectedFood ===
        food
    ) {


        // If user taps the currently selected
        // dish while the marker is visible,
        // replay the reveal animation.

        if (
            markerARState.markerVisible &&
            markerARState.currentModelLoaded
        ) {


            playFoodRevealAnimation();

        }


        return;

    }



    markerARState.selectedFood =
        food;



    updateFoodButtons(
        food
    );



    applyMarkerFoodModel(
        food
    );



    console.log(

        "Marker AR selected food:",

        food

    );

}



// ==========================================
// BURGER BUTTON
// ==========================================

markerBurgerBtn.addEventListener(

    "click",

    () => {


        selectMarkerFood(
            "burger"
        );


    }

);



// ==========================================
// PIZZA BUTTON
// ==========================================

markerPizzaBtn.addEventListener(

    "click",

    () => {


        selectMarkerFood(
            "pizza"
        );


    }

);



// ==========================================
// MODEL LOADED
// ==========================================
//
// This event also fires when Burger/Pizza
// is switched.
//
// We wait until the GLB is ready before
// running the reveal animation.
// ==========================================

markerFoodModel.addEventListener(

    "model-loaded",

    () => {


        markerARState.currentModelLoaded =
            true;



        console.log(

            `${markerARState.selectedFood} model loaded`

        );



        if (
            markerARState.markerVisible
        ) {


            playFoodRevealAnimation();

        }


    }

);



// ==========================================
// MODEL LOADING ERROR
// ==========================================

markerFoodModel.addEventListener(

    "model-error",

    (event) => {


        markerARState.currentModelLoaded =
            false;



        console.error(

            "Marker model loading error:",

            event

        );


    }

);



// ==========================================
// MARKER FOUND
// ==========================================

hiroMarker.addEventListener(

    "markerFound",

    () => {


        markerARState.markerVisible =
            true;



        console.log(
            "Menu marker detected"
        );



        if (
            markerARState.currentModelLoaded
        ) {


            playFoodRevealAnimation();

        }


    }

);



// ==========================================
// MARKER LOST
// ==========================================

hiroMarker.addEventListener(

    "markerLost",

    () => {


        markerARState.markerVisible =
            false;



        clearRevealAnimation();



        // Return to final transform so the
        // next detection starts cleanly.

        resetModelTransform();



        console.log(
            "Menu marker lost"
        );


    }

);



// ==========================================
// INITIAL BUTTON STATE
// ==========================================

updateFoodButtons(
    "burger"
);