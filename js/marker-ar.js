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
//
// Updated after mobile testing.
// These are intentionally larger than
// the previous Marker AR values.
// ==========================================

const MARKER_MODEL_CONFIG = {


    burger: {

        model:
            "#burgerModel",

        scale:
            2.2,

        positionY:
            0.22,

        rotation:
            "0 0 0"

    },


    pizza: {

        model:
            "#pizzaModel",

        scale:
            1.5,

        positionY:
            0.08,

        rotation:
            "0 0 0"

    }


};



// ==========================================
// ANIMATION CONFIGURATION
// ==========================================

const REVEAL_START_SCALE_FACTOR =
    0.72;


const REVEAL_HEIGHT =
    0.07;


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
// RESET MODEL TRANSFORM
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
// FOOD REVEAL
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
// BUTTON STATE
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
// APPLY MODEL
// ==========================================

function applyMarkerFoodModel(food) {


    const config =
        MARKER_MODEL_CONFIG[
            food
        ];



    markerARState.currentModelLoaded =
        false;



    clearRevealAnimation();



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
// BUTTON EVENTS
// ==========================================

markerBurgerBtn.addEventListener(

    "click",

    () => {


        selectMarkerFood(
            "burger"
        );


    }

);



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
// MODEL ERROR
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