// ================================
// MenuAR - Marker AR
// Food Selection State
// ================================

const markerBurgerBtn = document.getElementById("markerBurgerBtn");
const markerPizzaBtn = document.getElementById("markerPizzaBtn");

// Marker mode starts with Burger selected
let selectedMarkerFood = "burger";

function selectMarkerFood(food) {
    selectedMarkerFood = food;

    if (food === "burger") {
        markerBurgerBtn.classList.add("active");
        markerPizzaBtn.classList.remove("active");
    } else {
        markerPizzaBtn.classList.add("active");
        markerBurgerBtn.classList.remove("active");
    }

    console.log("Marker AR selected food:", selectedMarkerFood);
}

markerBurgerBtn.addEventListener("click", () => {
    selectMarkerFood("burger");
});

markerPizzaBtn.addEventListener("click", () => {
    selectMarkerFood("pizza");
});