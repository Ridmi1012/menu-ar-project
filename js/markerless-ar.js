// ==========================================
// MenuAR - Markerless AR
// Initial Application State
// ==========================================

const burgerBtn = document.getElementById("burgerBtn");
const pizzaBtn = document.getElementById("pizzaBtn");
const statusMessage = document.querySelector(".status-message");

// Main state object
const menuARState = {
    selectedFood: "burger",
    appState: "READY_TO_SCAN",
    placedObject: null,
    currentScale: 1,
    currentRotation: 0
};


// ==========================================
// Food Selection
// ==========================================

function selectFood(food) {
    menuARState.selectedFood = food;

    if (food === "burger") {
        burgerBtn.classList.add("active");
        pizzaBtn.classList.remove("active");
    } else {
        pizzaBtn.classList.add("active");
        burgerBtn.classList.remove("active");
    }

    menuARState.appState = "READY_TO_SCAN";

    const foodName =
        food.charAt(0).toUpperCase() + food.slice(1);

    statusMessage.textContent =
        `${foodName} selected. Ready to scan a surface.`;

    console.log("MenuAR State:", menuARState);
}


// ==========================================
// Button Events
// ==========================================

burgerBtn.addEventListener("click", () => {
    selectFood("burger");
});

pizzaBtn.addEventListener("click", () => {
    selectFood("pizza");
});


// ==========================================
// Initial State
// ==========================================

selectFood("burger");