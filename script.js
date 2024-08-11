document.addEventListener('DOMContentLoaded', () => {
    const weekView = document.querySelector('.week-view');
    const addMealBtn = document.getElementById('add-meal-btn');
    const printBtn = document.getElementById('print-btn');
    const modal = document.getElementById('meal-modal');
    const closeBtn = document.querySelector('.close');
    const mealForm = document.getElementById('meal-form');
    const modalTitle = document.getElementById('modal-title');

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Generate day columns
    days.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.classList.add('day');
        dayColumn.innerHTML = `
            <h2>${day.charAt(0).toUpperCase() + day.slice(1)}</h2>
            <ul class="meal-list" id="${day}-list"></ul>
            <div class="total-calories" id="${day}-calories">Total: 0 cal</div>
        `;
        weekView.appendChild(dayColumn);
    });

    // Initialize Sortable for each day's meal list
    document.querySelectorAll('.meal-list').forEach(list => {
        new Sortable(list, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: updateLocalStorage
        });
    });

    // Event Listeners
    addMealBtn.addEventListener('click', () => openModal());
    closeBtn.addEventListener('click', closeModal);
    mealForm.addEventListener('submit', handleFormSubmit);
    printBtn.addEventListener('click', printWeekPlan);

    // Load meals from local storage
    loadMeals();

    function openModal(meal = null) {
        modalTitle.textContent = meal ? 'Edit Meal' : 'Add Meal';
        if (meal) {
            document.getElementById('meal-id').value = meal.id;
            document.getElementById('meal-name').value = meal.name;
            document.getElementById('meal-calories').value = meal.calories;
            document.getElementById('meal-day').value = meal.day;
            document.getElementById('meal-type').value = meal.type;
            document.getElementById('meal-category').value = meal.category || '';
            document.getElementById('meal-notes').value = meal.notes || '';
        } else {
            mealForm.reset();
            document.getElementById('meal-id').value = '';
        }
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const mealId = document.getElementById('meal-id').value;
        const meal = {
            id: mealId || Date.now().toString(),
            name: document.getElementById('meal-name').value,
            calories: document.getElementById('meal-calories').value,
            day: document.getElementById('meal-day').value,
            type: document.getElementById('meal-type').value,
            category: document.getElementById('meal-category').value,
            notes: document.getElementById('meal-notes').value
        };

        if (mealId) {
            updateMeal(meal);
        } else {
            addMeal(meal);
        }

        closeModal();
        updateLocalStorage();
    }

    function addMeal(meal) {
        const mealList = document.getElementById(`${meal.day}-list`);
        const mealItem = createMealElement(meal);
        mealList.appendChild(mealItem);
        updateDayCalories(meal.day);
    }

    function updateMeal(updatedMeal) {
        const mealItem = document.querySelector(`[data-id="${updatedMeal.id}"]`);
        const oldDay = mealItem.closest('.day').id.replace('-list', '');
        
        if (oldDay !== updatedMeal.day) {
            const newList = document.getElementById(`${updatedMeal.day}-list`);
            newList.appendChild(mealItem);
            updateDayCalories(oldDay);
        }

        mealItem.innerHTML = `
            <h3>${updatedMeal.name}</h3>
            <p>${updatedMeal.calories} cal | ${updatedMeal.type}</p>
            ${updatedMeal.category ? `<p>Category: ${updatedMeal.category}</p>` : ''}
            <div class="meal-actions">
                <button class="edit-meal"><i class="fas fa-edit"></i></button>
                <button class="delete-meal"><i class="fas fa-trash"></i></button>
            </div>
        `;

        mealItem.dataset.meal = JSON.stringify(updatedMeal);
        updateDayCalories(updatedMeal.day);
    }

    function createMealElement(meal) {
        const mealItem = document.createElement('li');
        mealItem.classList.add('meal-item');
        mealItem.dataset.id = meal.id;
        mealItem.dataset.meal = JSON.stringify(meal);
        mealItem.innerHTML = `
            <h3>${meal.name}</h3>
            <p>${meal.calories} cal | ${meal.type}</p>
            ${meal.category ? `<p>Category: ${meal.category}</p>` : ''}
            <div class="meal-actions">
                <button class="edit-meal"><i class="fas fa-edit"></i></button>
                <button class="delete-meal"><i class="fas fa-trash"></i></button>
            </div>
        `;

        mealItem.querySelector('.edit-meal').addEventListener('click', () => openModal(meal));
        mealItem.querySelector('.delete-meal').addEventListener('click', () => deleteMeal(meal.id, meal.day));

        return mealItem;
    }

    function deleteMeal(id, day) {
        const mealItem = document.querySelector(`[data-id="${id}"]`);
        mealItem.remove();
        updateDayCalories(day);
        updateLocalStorage();
    }

    function updateDayCalories(day) {
        const mealList = document.getElementById(`${day}-list`);
        const totalCalories = Array.from(mealList.children).reduce((total, mealItem) => {
            const meal = JSON.parse(mealItem.dataset.meal);
            return total + parseInt(meal.calories);
        }, 0);
        document.getElementById(`${day}-calories`).textContent = `Total: ${totalCalories} cal`;
    }

    function updateLocalStorage() {
        const meals = {};
        days.forEach(day => {
            const mealList = document.getElementById(`${day}-list`);
            meals[day] = Array.from(mealList.children).map(mealItem => JSON.parse(mealItem.dataset.meal));
        });
        localStorage.setItem('meals', JSON.stringify(meals));
    }

    function loadMeals() {
        const meals = JSON.parse(localStorage.getItem('meals')) || {};
        for (const [day, dayMeals] of Object.entries(meals)) {
            const mealList = document.getElementById(`${day}-list`);
            dayMeals.forEach(meal => {
                const mealItem = createMealElement(meal);
                mealList.appendChild(mealItem);
            });
            updateDayCalories(day);
        }
    }

    function printWeekPlan() {
        window.print();
    }

    // Color coding for meal types
    function applyMealTypeColors() {
        const mealTypes = {
            breakfast: '#FFA07A',
            lunch: '#98FB98',
            dinner: '#87CEFA',
            snack: '#DDA0DD'
        };

        document.querySelectorAll('.meal-item').forEach(mealItem => {
            const meal = JSON.parse(mealItem.dataset.meal);
            mealItem.style.borderLeft = `5px solid ${mealTypes[meal.type]}`;
        });
    }

   
});