document.addEventListener('DOMContentLoaded', () => {
    const addMealButton = document.getElementById('add-meal');
    const mealNameInput = document.getElementById('meal-name');
    const mealCaloriesInput = document.getElementById('meal-calories');
    const mealDaySelect = document.getElementById('meal-day');
    const mealTypeSelect = document.getElementById('meal-type');

    addMealButton.addEventListener('click', addMeal);

    // Initialize Sortable for each day's meal list
    document.querySelectorAll('.meal-list').forEach(list => {
        new Sortable(list, {
            animation: 150,
            ghostClass: 'blue-background-class',
            onEnd: updateLocalStorage
        });
    });

    // Load meals from local storage
    loadMeals();

    function addMeal() {
        const mealName = mealNameInput.value.trim();
        const mealCalories = mealCaloriesInput.value;
        const mealDay = mealDaySelect.value;
        const mealType = mealTypeSelect.value;

        if (mealName === '' || mealCalories === '') return;

        const meal = {
            id: Date.now(),
            name: mealName,
            calories: mealCalories,
            type: mealType
        };

        const mealList = document.querySelector(`#${mealDay} .meal-list`);
        const mealItem = createMealElement(meal);
        mealList.appendChild(mealItem);

        updateLocalStorage();
        resetInputFields();
    }

    function createMealElement(meal) {
        const mealItem = document.createElement('li');
        mealItem.classList.add('meal-item');
        mealItem.dataset.id = meal.id;
        mealItem.innerHTML = `
            <div class="meal-info">
                <span>${meal.name} (${meal.type})</span>
                <span>${meal.calories} calories</span>
            </div>
            <div class="meal-actions">
                <button class="edit-meal">Edit</button>
                <button class="delete-meal">Delete</button>
            </div>
        `;

        mealItem.querySelector('.delete-meal').addEventListener('click', deleteMeal);
        mealItem.querySelector('.edit-meal').addEventListener('click', editMeal);

        return mealItem;
    }

    function deleteMeal(e) {
        const mealItem = e.target.closest('.meal-item');
        mealItem.remove();
        updateLocalStorage();
    }

    function editMeal(e) {
        const mealItem = e.target.closest('.meal-item');
        const mealId = mealItem.dataset.id;
        const mealInfo = mealItem.querySelector('.meal-info');
        const [name, type] = mealInfo.firstElementChild.textContent.split(' (');
        const calories = mealInfo.lastElementChild.textContent.split(' ')[0];

        mealNameInput.value = name;
        mealCaloriesInput.value = calories;
        mealTypeSelect.value = type.slice(0, -1).toLowerCase();

        mealItem.remove();
        updateLocalStorage();
    }

    function updateLocalStorage() {
        const meals = {};
        document.querySelectorAll('.day').forEach(day => {
            const dayId = day.id;
            meals[dayId] = [];
            day.querySelectorAll('.meal-item').forEach(mealItem => {
                const mealInfo = mealItem.querySelector('.meal-info');
                const [name, type] = mealInfo.firstElementChild.textContent.split(' (');
                const calories = mealInfo.lastElementChild.textContent.split(' ')[0];
                meals[dayId].push({
                    id: mealItem.dataset.id,
                    name: name,
                    calories: calories,
                    type: type.slice(0, -1).toLowerCase()
                });
            });
        });
        localStorage.setItem('meals', JSON.stringify(meals));
    }

    function loadMeals() {
        const meals = JSON.parse(localStorage.getItem('meals')) || {};
        for (const [day, dayMeals] of Object.entries(meals)) {
            const mealList = document.querySelector(`#${day} .meal-list`);
            dayMeals.forEach(meal => {
                const mealItem = createMealElement(meal);
                mealList.appendChild(mealItem);
            });
        }
    }

    function resetInputFields() {
        mealNameInput.value = '';
        mealCaloriesInput.value = '';
        mealDaySelect.selectedIndex = 0;
        mealTypeSelect.selectedIndex = 0;
    }
});