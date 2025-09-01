document.addEventListener('DOMContentLoaded', function() {
    const toggles = document.querySelectorAll('.category-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('open');
            const submenu = toggle.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('open');
            }
        });
    });

    const loginBtn = document.getElementById('login-button');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const user = document.getElementById('login-username').value;
            const pass = document.getElementById('login-password').value;
            if (user === 'admin' && pass === 'jdr') {
                enableEditing();
            } else {
                alert('Identifiants invalides');
            }
        });
    }

    function enableEditing() {
        const loginArea = document.getElementById('login-area');
        if (loginArea) loginArea.classList.add('hidden');
        const toolbar = document.getElementById('edit-toolbar');
        if (toolbar) toolbar.classList.remove('hidden');
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.contentEditable = 'true';
        }
        addNavEditButtons();
    }

    function addNavEditButtons() {
        const items = document.querySelectorAll('#side-nav li');
        items.forEach(li => {
            const target = li.querySelector('.category-toggle, a');
            if (!target) return;

            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Renommer';
            renameBtn.className = 'edit-btn';
            renameBtn.addEventListener('click', () => {
                const newName = prompt('Nouveau nom:', target.textContent.trim());
                if (newName) target.textContent = newName;
            });

            const hideBtn = document.createElement('button');
            hideBtn.textContent = 'Cacher';
            hideBtn.className = 'edit-btn';
            hideBtn.addEventListener('click', () => {
                if (li.style.display === 'none') {
                    li.style.display = '';
                    hideBtn.textContent = 'Cacher';
                } else {
                    li.style.display = 'none';
                    hideBtn.textContent = 'Afficher';
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.className = 'edit-btn';
            deleteBtn.addEventListener('click', () => {
                li.remove();
            });

            li.appendChild(renameBtn);
            li.appendChild(hideBtn);
            li.appendChild(deleteBtn);
        });
    }

    const insertTableBtn = document.getElementById('insert-table');
    if (insertTableBtn) {
        insertTableBtn.addEventListener('click', () => {
            const rows = parseInt(prompt('Nombre de lignes ?'), 10);
            const cols = parseInt(prompt('Nombre de colonnes ?'), 10);
            if (rows > 0 && cols > 0) {
                const table = document.createElement('table');
                for (let r = 0; r < rows; r++) {
                    const tr = document.createElement('tr');
                    for (let c = 0; c < cols; c++) {
                        const td = document.createElement('td');
                        td.contentEditable = 'true';
                        tr.appendChild(td);
                    }
                    table.appendChild(tr);
                }
                const main = document.getElementById('main-content');
                main.appendChild(table);
            }
        });
    }
});
