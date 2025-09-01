document.addEventListener('DOMContentLoaded', function() {
    loadSavedWiki();
    assignNavIds();
    loadHiddenItems();
    initializeNavigation();

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

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', disableEditing);
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
                addTableDeleteButtons();
                saveWiki();
            }
        });
    }

    function initializeNavigation() {
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
    }

    function enableEditing() {
        const loginArea = document.getElementById('login-area');
        if (loginArea) loginArea.classList.add('hidden');
        const toolbar = document.getElementById('edit-toolbar');
        if (toolbar) toolbar.classList.remove('hidden');
        document.body.classList.add('editor-mode');
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.contentEditable = 'true';
            mainContent.addEventListener('input', saveWiki);
        }
        addNavEditButtons();
        addTableDeleteButtons();
    }

    function disableEditing() {
        const loginArea = document.getElementById('login-area');
        if (loginArea) loginArea.classList.remove('hidden');
        const toolbar = document.getElementById('edit-toolbar');
        if (toolbar) toolbar.classList.add('hidden');
        document.body.classList.remove('editor-mode');
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.contentEditable = 'false';
            mainContent.removeEventListener('input', saveWiki);
        }
        document.querySelectorAll('#side-nav .edit-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.delete-table-btn').forEach(btn => btn.remove());
        saveWiki();
    }

    function addNavEditButtons() {
        const items = document.querySelectorAll('#side-nav li');
        items.forEach(li => {
            const target = li.querySelector('.category-toggle, a');
            if (!target) return;
            const id = li.dataset.id;

            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Renommer';
            renameBtn.className = 'edit-btn';
            renameBtn.addEventListener('click', () => {
                const newName = prompt('Nouveau nom:', target.textContent.trim());
                if (newName) {
                    target.textContent = newName;
                    saveWiki();
                }
            });

            const hideBtn = document.createElement('button');
            hideBtn.textContent = li.classList.contains('hidden-item') ? 'Afficher' : 'Cacher';
            hideBtn.className = 'edit-btn';
            hideBtn.addEventListener('click', () => {
                const isHidden = li.classList.toggle('hidden-item');
                hideBtn.textContent = isHidden ? 'Afficher' : 'Cacher';
                updateHiddenItems(id, isHidden);
                saveWiki();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.className = 'edit-btn';
            deleteBtn.addEventListener('click', () => {
                li.remove();
                updateHiddenItems(id, false);
                saveWiki();
            });

            li.appendChild(renameBtn);
            li.appendChild(hideBtn);
            li.appendChild(deleteBtn);
        });
    }

    function addTableDeleteButtons() {
        const tables = document.querySelectorAll('#main-content table');
        tables.forEach(table => {
            if (table.previousElementSibling && table.previousElementSibling.classList.contains('delete-table-btn')) return;
            const btn = document.createElement('button');
            btn.textContent = 'Supprimer le tableau';
            btn.className = 'edit-btn delete-table-btn';
            btn.addEventListener('click', () => {
                btn.remove();
                table.remove();
                saveWiki();
            });
            table.parentNode.insertBefore(btn, table);
        });
    }

    function assignNavIds() {
        const items = document.querySelectorAll('#side-nav li');
        items.forEach((li, index) => {
            if (!li.dataset.id) {
                li.dataset.id = index.toString();
            }
        });
    }

    function loadSavedWiki() {
        const savedNav = localStorage.getItem('sideNav');
        const savedContent = localStorage.getItem('mainContent');
        if (savedNav) {
            document.getElementById('side-nav').innerHTML = savedNav;
        }
        if (savedContent) {
            document.getElementById('main-content').innerHTML = savedContent;
        }
    }

    function saveWiki() {
        saveSideNav();
        saveMainContent();
    }

    function saveSideNav() {
        const sideNav = document.getElementById('side-nav');
        const clone = sideNav.cloneNode(true);
        clone.querySelectorAll('.edit-btn').forEach(btn => btn.remove());
        localStorage.setItem('sideNav', clone.innerHTML);
    }

    function saveMainContent() {
        const main = document.getElementById('main-content');
        const clone = main.cloneNode(true);
        clone.querySelectorAll('.delete-table-btn').forEach(btn => btn.remove());
        localStorage.setItem('mainContent', clone.innerHTML);
    }

    function loadHiddenItems() {
        const hidden = JSON.parse(localStorage.getItem('hiddenItems') || '[]');
        hidden.forEach(id => {
            const li = document.querySelector(`#side-nav li[data-id="${id}"]`);
            if (li) li.classList.add('hidden-item');
        });
    }

    function updateHiddenItems(id, hide) {
        let hidden = JSON.parse(localStorage.getItem('hiddenItems') || '[]');
        if (hide) {
            if (!hidden.includes(id)) hidden.push(id);
        } else {
            hidden = hidden.filter(item => item !== id);
        }
        localStorage.setItem('hiddenItems', JSON.stringify(hidden));
    }
});

