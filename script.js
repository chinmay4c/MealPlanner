document.addEventListener('DOMContentLoaded', () => {
    const weekView = document.querySelector('.week-view');
    const addMealBtn = document.getElementById('add-meal-btn');
    const aiSuggestBtn = document.getElementById('ai-suggest-btn');
    const voiceCommandBtn = document.getElementById('voice-command-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const modal = document.getElementById('meal-modal');
    const closeBtn = document.querySelector('.close');
    const mealForm = document.getElementById('meal-form');
    const modalTitle = document.getElementById('modal-title');
    const gamificationSidebar = document.getElementById('gamification-sidebar');

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    let meals = JSON.parse(localStorage.getItem('meals')) || {};
    let nutritionChart;
    let quests;

    // Generate day columns
    days.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.classList.add('day');
        dayColumn.innerHTML = `
            <h2>${day.charAt(0).toUpperCase() + day.slice(1)}</h2>
            <ul class="meal-list" id="${day}-list"></ul>
        `;
        weekView.appendChild(dayColumn);
    });

    // Initialize drag and drop
    initDragAndDrop();

    // Event Listeners
    addMealBtn.addEventListener('click', () => openModal());
    aiSuggestBtn.addEventListener('click', suggestMeal);
    voiceCommandBtn.addEventListener('click', startVoiceCommand);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    closeBtn.addEventListener('click', closeModal);
    mealForm.addEventListener('submit', handleFormSubmit);

    // Load meals and initialize UI
    loadMeals();
    updateNutritionChart();
    initializeQuests();

    function openModal(meal = null) {
        modalTitle.textContent = meal ? 'Edit Meal' : 'Add Meal';
        if (meal) {
            document.getElementById('meal-id').value = meal.id;
            document.getElementById('meal-name').value = meal.name;
            document.getElementById('meal-calories').value = meal.calories;
            document.getElementById('meal-protein').value = meal.protein;
            document.getElementById('meal-carbs').value = meal.carbs;
            document.getElementById('meal-fat').value = meal.fat;
            document.getElementById('meal-day').value = meal.day;
            document.getElementById('meal-type').value = meal.type;
            document.getElementById('meal-category').value = meal.category || '';
            document.getElementById('meal-notes').value = meal.notes || '';
        } else {
            mealForm.reset();
            document.getElementById('meal-id').value = '';
        }
        modal.style.display = 'block';
        gsap.from('.modal-content', {duration: 0.5, y: -50, opacity: 0, ease: 'back'});
    }

    function closeModal() {
        gsap.to('.modal-content', {
            duration: 0.5,
            y: -50,
            opacity: 0,
            ease: 'power2.in',
            onComplete: () => {
                modal.style.display = 'none';
                gsap.set('.modal-content', {clearProps: 'all'});
            }
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const mealId = document.getElementById('meal-id').value;
        const meal = {
            id: mealId || Date.now().toString(),
            name: document.getElementById('meal-name').value,
            calories: parseInt(document.getElementById('meal-calories').value),
            protein: parseInt(document.getElementById('meal-protein').value),
            carbs: parseInt(document.getElementById('meal-carbs').value),
            fat: parseInt(document.getElementById('meal-fat').value),
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
        updateNutritionChart();
        checkQuestProgress();
    }

    function addMeal(meal) {
        const mealList = document.getElementById(`${meal.day}-list`);
        const mealItem = createMealElement(meal);
        mealList.appendChild(mealItem);
        meals[meal.day] = meals[meal.day] || [];
        meals[meal.day].push(meal);
        gsap.from(mealItem, {duration: 0.5, y: 20, opacity: 0, ease: 'back'});
    }

    function updateMeal(updatedMeal) {
        const mealItem = document.querySelector(`[data-id="${updatedMeal.id}"]`);
        const oldDay = mealItem.closest('.day').id.replace('-list', '');
        
        if (oldDay !== updatedMeal.day) {
            const newList = document.getElementById(`${updatedMeal.day}-list`);
            newList.appendChild(mealItem);
            meals[oldDay] = meals[oldDay].filter(meal => meal.id !== updatedMeal.id);
            meals[updatedMeal.day] = meals[updatedMeal.day] || [];
            meals[updatedMeal.day].push(updatedMeal);
        } else {
            const index = meals[oldDay].findIndex(meal => meal.id === updatedMeal.id);
            meals[oldDay][index] = updatedMeal;
        }

        updateMealElement(mealItem, updatedMeal);
    }

    function createMealElement(meal) {
        const mealItem = document.createElement('li');
        mealItem.classList.add('meal-item');
        mealItem.dataset.id = meal.id;
        updateMealElement(mealItem, meal);
        return mealItem;
    }

    function updateMealElement(mealItem, meal) {
        mealItem.innerHTML = `
            <h3>${meal.name}</h3>
            <p>${meal.calories} cal | P: ${meal.protein}g | C: ${meal.carbs}g | F: ${meal.fat}g</p>
            <p>${meal.type} ${meal.category ? `| ${meal.category}` : ''}</p>
            <div class="meal-actions">
                <button class="edit-meal"><i class="fas fa-edit"></i></button>
                <button class="delete-meal"><i class="fas fa-trash"></i></button>
            </div>
        `;

        mealItem.querySelector('.edit-meal').addEventListener('click', () => openModal(meal));
        mealItem.querySelector('.delete-meal').addEventListener('click', () => deleteMeal(meal.id, meal.day));
    }

    function deleteMeal(id, day) {
        const mealItem = document.querySelector(`[data-id="${id}"]`);
        gsap.to(mealItem, {
            duration: 0.5,
            x: 100,
            opacity: 0,
            ease: 'power2.in',
            onComplete: () => {
                mealItem.remove();
                meals[day] = meals[day].filter(meal => meal.id !== id);
                updateLocalStorage();
                updateNutritionChart();
                checkQuestProgress();
            }
        });
    }

    function updateLocalStorage() {
        localStorage.setItem('meals', JSON.stringify(meals));
    }

    function loadMeals() {
        for (const [day, dayMeals] of Object.entries(meals)) {
            const mealList = document.getElementById(`${day}-list`);
            dayMeals.forEach(meal => {
                const mealItem = createMealElement(meal);
                mealList.appendChild(mealItem);
            });
        }
    }

    function updateNutritionChart() {
        const nutritionData = calculateTotalNutrition();
        const ctx = document.getElementById('nutrition-chart').getContext('2d');

        if (nutritionChart) {
            nutritionChart.destroy();
        }

        nutritionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: [nutritionData.protein, nutritionData.carbs, nutritionData.fat],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        document.getElementById('total-calories').querySelector('p').textContent = `${nutritionData.calories} cal`;
        document.getElementById('protein-intake').querySelector('p').textContent = `${nutritionData.protein}g`;
        document.getElementById('carb-intake').querySelector('p').textContent = `${nutritionData.carbs}g`;
        document.getElementById('fat-intake').querySelector('p').textContent = `${nutritionData.fat}g`;
    }

    function calculateTotalNutrition() {
        const totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        Object.values(meals).flat().forEach(meal => {
            totalNutrition.calories += meal.calories;
            totalNutrition.protein += meal.protein;
            totalNutrition.carbs += meal.carbs;
            totalNutrition.fat += meal.fat;
        });
        return totalNutrition;
    }

    function initDragAndDrop() {
        const lists = document.querySelectorAll('.meal-list');
        lists.forEach(list => {
            new Sortable(list, {
                group: 'shared',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    const mealId = evt.item.dataset.id;
                    const oldDay = evt.from.id.replace('-list', '');
                    const newDay = evt.to.id.replace('-list', '');
                    if (oldDay !== newDay) {
                        const mealIndex = meals[oldDay].findIndex(meal => meal.id === mealId);
                        const [meal] = meals[oldDay].splice(mealIndex, 1);
                        meal.day = newDay;
                        meals[newDay] = meals[newDay] || [];
                        meals[newDay].push(meal);
                        updateLocalStorage();
                        updateNutritionChart();
                        checkQuestProgress();
                    }
                }
            });
        });
    }

    function suggestMeal() {
        // This is a mock AI suggestion. In a real application, you'd use a more sophisticated algorithm or API.
        const suggestions = [
            { name: 'Grilled Chicken Salad', calories: 350, protein: 30, carbs: 10, fat: 20 },
            { name: 'Vegetarian Stir Fry', calories: 300, protein: 15, carbs: 40, fat: 10 },
            { name: 'Salmon with Roasted Vegetables', calories: 400, protein: 35, carbs: 20, fat: 25 }
        ];

        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        openModal({
            ...suggestion,
            id: '',
            day: days[Math.floor(Math.random() * days.length)],
            type: ['breakfast', 'lunch', 'dinner'][Math.floor(Math.random() * 3)],
            category: ''
        });
    }

    function startVoiceCommand() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                voiceCommandBtn.classList.add('listening');
                voiceCommandBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            };

            recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                processVoiceCommand(command);
            };

            recognition.onend = () => {
                voiceCommandBtn.classList.remove('listening');
                voiceCommandBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    }

    function processVoiceCommand(command) {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        const addMealRegex = /add\s+(.+)\s+for\s+(breakfast|lunch|dinner|snack)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
        const match = command.match(addMealRegex);

        if (match) {
            const [, mealName, mealType, day] = match;
            openModal({
                id: '',
                name: mealName,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                day: day.toLowerCase(),
                type: mealType.toLowerCase(),
                category: ''
            });
        } else {
            alert('Sorry, I didn\'t understand that command. Try saying "Add chicken salad for lunch on Monday"');
        }
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        darkModeToggle.innerHTML = document.body.classList.contains('dark-mode') 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }

    function initializeQuests() {
        quests = [
            { id: 'quest1', name: 'Protein Champion', goal: 150, progress: 0, unit: 'g' },
            { id: 'quest2', name: 'Veggie Lover', goal: 7, progress: 0, unit: 'meals' },
            { id: 'quest3', name: 'Meal Planner Extraordinaire', goal: 21, progress: 0, unit: 'meals' }
        ];

        const questList = document.getElementById('quest-list');
        quests.forEach(quest => {
            const questItem = document.createElement('li');
            questItem.classList.add('quest-item');
            questItem.innerHTML = `
                <h3>${quest.name}</h3>
                <p>Progress: <span id="${quest.id}-progress">0</span>/${quest.goal} ${quest.unit}</p>
                <div class="progress-bar">
                    <div class="progress-bar-fill" id="${quest.id}-progress-fill" style="width: 0%"></div>
                </div>
            `;
            questList.appendChild(questItem);
        });

        checkQuestProgress();
    }

    function checkQuestProgress() {
        const totalNutrition = calculateTotalNutrition();
        const totalMeals = Object.values(meals).flat().length;
        const veggieMeals = Object.values(meals).flat().filter(meal => meal.category === 'vegetarian' || meal.category === 'vegan').length;

        quests[0].progress = totalNutrition.protein;
    quests[1].progress = veggieMeals;
    quests[2].progress = totalMeals;

    quests.forEach(quest => {
        const progressElement = document.getElementById(`${quest.id}-progress`);
        const progressFillElement = document.getElementById(`${quest.id}-progress-fill`);
        const progressPercentage = Math.min((quest.progress / quest.goal) * 100, 100);

        progressElement.textContent = quest.progress;
        progressFillElement.style.width = `${progressPercentage}%`;

        if (quest.progress >= quest.goal) {
            showQuestCompletionNotification(quest);
        }
    });
}

function showQuestCompletionNotification(quest) {
    const notification = document.createElement('div');
    notification.classList.add('quest-notification');
    notification.innerHTML = `
        <h3>Quest Completed!</h3>
        <p>${quest.name}</p>
    `;
    document.body.appendChild(notification);

    gsap.from(notification, {
        duration: 0.5,
        y: 50,
        opacity: 0,
        ease: 'back',
        onComplete: () => {
            setTimeout(() => {
                gsap.to(notification, {
                    duration: 0.5,
                    y: 50,
                    opacity: 0,
                    ease: 'power2.in',
                    onComplete: () => notification.remove()
                });
            }, 3000);
        }
    });
}

// Add event listener to open gamification sidebar
const openSidebarBtn = document.createElement('button');
openSidebarBtn.id = 'open-sidebar-btn';
openSidebarBtn.innerHTML = '<i class="fas fa-trophy"></i>';
openSidebarBtn.addEventListener('click', toggleGamificationSidebar);
document.body.appendChild(openSidebarBtn);

function toggleGamificationSidebar() {
    gamificationSidebar.classList.toggle('open');
}

// Initialize the application
loadMeals();
updateNutritionChart();
initializeQuests();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
});