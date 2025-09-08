document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const taskModal = document.getElementById('task-modal');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const modalTaskList = document.getElementById('modal-task-list');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const editModal = document.getElementById('edit-modal');
    const editTaskInput = document.getElementById('edit-task-input');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    let currentDate = new Date();
    let tasks = JSON.parse(localStorage.getItem('calendarTasks')) || {};
    let editingTask = null;

    function saveTasks() {
        localStorage.setItem('calendarTasks', JSON.stringify(tasks));
    }

    function getFormattedDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Mostrar mes y año en el encabezado
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;

        // Limpiar días anteriores
        const oldCells = document.querySelectorAll('.date-cell');
        oldCells.forEach(cell => cell.remove());

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Días vacíos para el primer día de la semana
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('date-cell');
            emptyCell.style.visibility = 'hidden';
            calendarGrid.appendChild(emptyCell);
        }

        // Generar celdas para cada día
        for (let i = 1; i <= daysInMonth; i++) {
            const dateCell = document.createElement('div');
            dateCell.classList.add('date-cell');
            const day = document.createElement('div');
            day.textContent = i;
            dateCell.appendChild(day);

            const currentDayDate = new Date(year, month, i);
            const dateKey = getFormattedDate(currentDayDate);

            const dayTasks = tasks[dateKey] || [];
            if (dayTasks.length > 0) {
                const taskList = document.createElement('ul');
                taskList.classList.add('task-list');
                dayTasks.forEach(task => {
                    const taskItem = document.createElement('li');
                    taskItem.classList.add('task-item');
                    if (task.completed) {
                        taskItem.classList.add('task-completed');
                    }
                    taskItem.textContent = task.text;
                    taskList.appendChild(taskItem);
                });
                dateCell.appendChild(taskList);
            }

            // Manejar clics para abrir el modal
            dateCell.addEventListener('click', () => {
                openModal(currentDayDate, dateKey);
            });

            calendarGrid.appendChild(dateCell);
        }
    }

    function openModal(date, dateKey) {
        modalDateDisplay.textContent = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        taskModal.dataset.dateKey = dateKey;
        renderModalTasks(dateKey);
        taskModal.style.display = 'flex';
        taskInput.value = '';
        taskInput.focus();
    }

    function renderModalTasks(dateKey) {
        modalTaskList.innerHTML = '';
        const dayTasks = tasks[dateKey] || [];

        if (dayTasks.length === 0) {
            modalTaskList.textContent = "No hay tareas para este día.";
            return;
        }

        dayTasks.forEach((task, index) => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('modal-task-item');

            const label = document.createElement('label');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.classList.add('task-checkbox');
            checkbox.addEventListener('change', () => {
                tasks[dateKey][index].completed = checkbox.checked;
                saveTasks();
                renderCalendar(); // Actualizar el calendario principal
                renderModalTasks(dateKey); // Actualizar la lista del modal
            });

            const customCheckbox = document.createElement('span');
            customCheckbox.classList.add('custom-checkbox');

            const textSpan = document.createElement('span');
            textSpan.classList.add('modal-task-text');
            textSpan.textContent = task.text;
            if (task.completed) {
                textSpan.classList.add('task-completed');
            }

            const actions = document.createElement('div');
            actions.classList.add('modal-task-actions');

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Borrar';
            deleteBtn.addEventListener('click', () => {
                tasks[dateKey].splice(index, 1);
                if (tasks[dateKey].length === 0) {
                    delete tasks[dateKey];
                }
                saveTasks();
                renderCalendar();
                renderModalTasks(dateKey);
            });

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.addEventListener('click', () => {
                editingTask = { dateKey, index };
                editTaskInput.value = tasks[dateKey][index].text;
                editModal.style.display = 'flex';
                taskModal.style.display = 'none';
                editTaskInput.focus();
            });

            label.appendChild(checkbox);
            label.appendChild(customCheckbox);
            label.appendChild(textSpan);
            taskItem.appendChild(label);
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            taskItem.appendChild(actions);
            modalTaskList.appendChild(taskItem);
        });
    }

    // Lógica para el nuevo modal de edición
    saveEditBtn.addEventListener('click', () => {
        if (editingTask) {
            const newText = editTaskInput.value.trim();
            if (newText !== '') {
                tasks[editingTask.dateKey][editingTask.index].text = newText;
                saveTasks();
                renderCalendar();
                editModal.style.display = 'none';
                openModal(new Date(editingTask.dateKey), editingTask.dateKey);
            }
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
        if (editingTask) {
            openModal(new Date(editingTask.dateKey), editingTask.dateKey);
        }
    });

    addTaskBtn.addEventListener('click', () => {
        const dateKey = taskModal.dataset.dateKey;
        const taskText = taskInput.value.trim();

        if (taskText !== '') {
            if (!tasks[dateKey]) {
                tasks[dateKey] = [];
            }
            tasks[dateKey].push({ text: taskText, completed: false });
            saveTasks();
            taskInput.value = '';
            renderCalendar();
            renderModalTasks(dateKey);
        }
    });

    taskInput.addEventListener('keydown', (e) => {
        if (e.key === "Enter") {
            const dateKey = taskModal.dataset.dateKey;
            const taskText = taskInput.value.trim();

            if (taskText !== '') {
                if (!tasks[dateKey]) {
                    tasks[dateKey] = [];
                }
                tasks[dateKey].push({ text: taskText, completed: false });
                saveTasks();
                taskInput.value = '';
                renderCalendar();
                renderModalTasks(dateKey);
            }
        }
    })

    editTaskInput.addEventListener('keydown', e => {
        if (e.key === "Enter") {
            if (editingTask) {
                const newText = editTaskInput.value.trim();
                if (newText !== '') {
                    tasks[editingTask.dateKey][editingTask.index].text = newText;
                    saveTasks();
                    renderCalendar();
                    editModal.style.display = 'none';
                    openModal(new Date(editingTask.dateKey), editingTask.dateKey);
                }
            }
        }
    })

    closeModalBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    // Cerrar modal al hacer clic fuera del contenido
    taskModal.addEventListener('click', (e) => {
        if (e.target.id === 'task-modal') {
            taskModal.style.display = 'none';
        }
    });


        // Cerrar modal al hacer clic fuera del contenido
    editModal.addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            editModal.style.display = 'none';
        }
    });


    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
});