document.addEventListener('DOMContentLoaded', async function() {
    await loadSavedWiki();
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
        logoutBtn.addEventListener('click', logout);
    }

    const saveBtn = document.getElementById('save-button');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveOnline);
    }

    const editMenuBtn = document.getElementById('edit-menu-btn');
    if (editMenuBtn) {
        editMenuBtn.addEventListener('click', () => {
            const editorPanel = document.getElementById('editor-panel');
            if (editorPanel) {
                editorPanel.classList.toggle('hidden');
            }
            if (editMenuBtn.textContent === 'Editer le menu') {
                editMenuBtn.textContent = "Fermer l'éditeur";
            } else {
                editMenuBtn.textContent = 'Editer le menu';
            }
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
                addTableDeleteButtons();
                saveWiki();
            }
        });
    }

    function initializeNavigation() {
        const sideNav = document.getElementById('side-nav');
        if (sideNav.dataset.navListener) return; // Prevent adding multiple listeners

        sideNav.addEventListener('click', function(event) {
            const toggle = event.target.closest('.category-toggle');
            if (toggle) {
                toggle.classList.toggle('open');
                const submenu = toggle.nextElementSibling;
                if (submenu && submenu.classList.contains('submenu')) {
                    submenu.classList.toggle('open');
                }
            }
        });
        sideNav.dataset.navListener = 'true';
    }

    function enableEditing() {
        const loginArea = document.getElementById('login-area');
        if (loginArea) loginArea.classList.add('hidden');
        const toolbar = document.getElementById('edit-toolbar');
        if (toolbar) toolbar.classList.remove('hidden');
        const editMenuBtn = document.getElementById('edit-menu-btn');
        if (editMenuBtn) editMenuBtn.classList.remove('hidden');
        document.body.classList.add('editor-mode');
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.contentEditable = 'true';
            mainContent.addEventListener('input', saveWiki);
        }
        addTableDeleteButtons();
        initializeEditorPanel();
    }

    function disableEditing() {
        const loginArea = document.getElementById('login-area');
        if (loginArea) loginArea.classList.remove('hidden');
        const toolbar = document.getElementById('edit-toolbar');
        if (toolbar) toolbar.classList.add('hidden');
        const editorPanel = document.getElementById('editor-panel');
        if (editorPanel) editorPanel.classList.add('hidden');
        const editMenuBtn = document.getElementById('edit-menu-btn');
        if (editMenuBtn) {
            editMenuBtn.classList.add('hidden');
            editMenuBtn.textContent = 'Editer le menu';
        }
        document.body.classList.remove('editor-mode');
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.contentEditable = 'false';
            mainContent.removeEventListener('input', saveWiki);
        }
        document.querySelectorAll('.delete-table-btn').forEach(btn => btn.remove());
    }

    function initializeEditorPanel() {
        const mainView = document.getElementById('editor-main-view');
        const workflowView = document.getElementById('editor-workflow-view');
        const createEditBtn = document.getElementById('create-edit-btn');
        const renameBtn = document.getElementById('rename-btn');
        const deleteBtn = document.getElementById('delete-btn');
        const toggleHideBtn = document.getElementById('toggle-hide-btn');

        let currentEditingMode = null; // 'delete', 'rename', 'hide'
        let workflowHistory = [];

        function toggleEditingMode(mode) {
            if (currentEditingMode === mode) {
                currentEditingMode = null;
            } else {
                currentEditingMode = mode;
            }
            updateNavItemsUI();
            updateEditorPanelUI();
        }

        function updateNavItemsUI() {
            document.querySelectorAll('.edit-icon').forEach(icon => icon.remove());
            document.body.classList.remove('delete-mode-active', 'rename-mode-active', 'hide-mode-active');

            if (!currentEditingMode) return;

            document.body.classList.add(`${currentEditingMode}-mode-active`);
            const items = document.querySelectorAll('#side-nav li');
            items.forEach(li => {
                const icon = document.createElement('span');
                icon.className = `edit-icon ${currentEditingMode}-icon`;

                if (currentEditingMode === 'hide') {
                    icon.className += li.classList.contains('hidden-item') ? ' is-hidden' : ' is-visible';
                    icon.innerHTML = `<i class="fas fa-eye${li.classList.contains('hidden-item') ? '-slash' : ''}"></i>`;
                } else if (currentEditingMode === 'delete') {
                    icon.innerHTML = `<i class="fas fa-trash-can"></i>`;
                } else if (currentEditingMode === 'rename') {
                    icon.innerHTML = `<i class="fas fa-pencil"></i>`;
                }

                icon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleIconClick(li, currentEditingMode);
                });

                const target = li.querySelector(':scope > a, :scope > .category-toggle');
                if (target) target.prepend(icon);
            });
        }

        function handleIconClick(li, mode) {
            const id = li.dataset.id;
            if (!id) return;

            if (mode === 'delete') {
                if (confirm('Êtes-vous sûr de vouloir supprimer cet élément et tous ses enfants ?')) {
                    li.remove();
                    saveWiki();
                }
            } else if (mode === 'rename') {
                const target = li.querySelector(':scope > a, :scope > .category-toggle');
                const icon = target.querySelector('.edit-icon');

                if (icon) {
                    icon.remove();
                }

                const currentName = target.textContent.trim();
                const newName = prompt('Entrez le nouveau nom :', currentName);

                if (newName && newName.trim() !== '') {
                    target.textContent = newName.trim();
                    saveWiki();
                }

                updateNavItemsUI(); // Redraw all icons to ensure consistency
            } else if (mode === 'hide') {
                const isHidden = li.classList.toggle('hidden-item');
                updateHiddenItems(id, isHidden);
                saveWiki();
                const icon = li.querySelector('.hide-icon i');
                if (icon) {
                    icon.classList.toggle('fa-eye', !isHidden);
                    icon.classList.toggle('fa-eye-slash', isHidden);
                }
            }
        }

        function updateEditorPanelUI() {
            [renameBtn, deleteBtn, toggleHideBtn].forEach(btn => btn.classList.remove('active'));
            renameBtn.textContent = 'Renommer';
            deleteBtn.textContent = 'Supprimer';
            toggleHideBtn.textContent = 'Cacher/Afficher';
            createEditBtn.disabled = false;

            if (currentEditingMode) {
                createEditBtn.disabled = true;
                if (currentEditingMode === 'delete') {
                    deleteBtn.textContent = 'Annuler';
                    deleteBtn.classList.add('active');
                } else if (currentEditingMode === 'rename') {
                    renameBtn.textContent = 'Annuler';
                    renameBtn.classList.add('active');
                } else if (currentEditingMode === 'hide') {
                    toggleHideBtn.textContent = 'Terminer';
                    toggleHideBtn.classList.add('active');
                }
            }
        }

        function renderWorkflow(state) {
            workflowHistory.push(state);
            workflowView.innerHTML = '';
            mainView.classList.add('hidden');
            workflowView.classList.remove('hidden');

            const backBtn = document.createElement('button');
            backBtn.textContent = 'Retour';
            backBtn.addEventListener('click', () => {
                workflowHistory.pop(); // Remove current state
                const prevState = workflowHistory.pop(); // Get previous state
                if (prevState) {
                    renderWorkflow(prevState);
                } else {
                    workflowView.classList.add('hidden');
                    mainView.classList.remove('hidden');
                }
            });
            workflowView.appendChild(backBtn);

            const { level, parentId, parentName } = state;

            if (parentName) {
                const title = document.createElement('h4');
                title.textContent = `Dans: ${parentName}`;
                workflowView.appendChild(title);
            }

            const actions = {
                chapter: { create: 'chapitre', edit: 'chapitre' },
                subchapter: { create: 'sous-chapitre', edit: 'sous-chapitre' },
                item: { create: 'élément', edit: 'élément' }
            };

            const createBtn = document.createElement('button');
            createBtn.textContent = `Créer un nouveau ${actions[level].create}`;
            createBtn.addEventListener('click', () => handleCreate(level, parentId));
            workflowView.appendChild(createBtn);

            if (level !== 'item') { // Cannot edit 'elements' to add children
                const editBtn = document.createElement('button');
                editBtn.textContent = `Editer un ${actions[level].edit}`;
                editBtn.addEventListener('click', () => renderSelection(level, parentId));
                workflowView.appendChild(editBtn);
            }
        }

        function renderSelection(level, parentId) {
            workflowHistory.push({ level, parentId }); // Save current state for back button
            workflowView.innerHTML = '';

            const backBtn = document.createElement('button');
            backBtn.textContent = 'Retour';
            backBtn.addEventListener('click', () => {
                workflowHistory.pop();
                const prevState = workflowHistory.pop();
                renderWorkflow(prevState);
            });
            workflowView.appendChild(backBtn);

            const listContainer = document.createElement('div');
            const selector = parentId ? `li[data-id="${parentId}"] > ul > li` : '#side-nav > ul > li';
            document.querySelectorAll(selector).forEach(li => {
                const target = li.querySelector(':scope > .category-toggle');
                 if (!target) return;

                const itemBtn = document.createElement('button');
                itemBtn.textContent = target.textContent.trim();
                itemBtn.addEventListener('click', () => {
                    const nextLevel = level === 'chapter' ? 'subchapter' : 'item';
                    renderWorkflow({ level: nextLevel, parentId: li.dataset.id, parentName: target.textContent.trim() });
                });
                listContainer.appendChild(itemBtn);
            });
            workflowView.appendChild(listContainer);
        }

        function handleCreate(type, parentId) {
            const name = prompt(`Nom du nouvel ${type}:`);
            if (!name || name.trim() === '') return;

            let parentUl;
            if (!parentId) {
                parentUl = document.querySelector('#side-nav > ul');
            } else {
                const parentLi = document.querySelector(`li[data-id="${parentId}"]`);
                parentUl = parentLi.querySelector(':scope > ul');
                if (!parentUl) {
                    parentUl = document.createElement('ul');
                    parentUl.className = 'submenu open';
                    parentLi.appendChild(parentUl);
                    const toggle = parentLi.querySelector('.category-toggle');
                    if (toggle) toggle.classList.add('open');
                }
            }

            const navItemType = (type === 'item') ? 'item' : 'sub-chapter'; // Simplification
            parentUl.appendChild(createNavItem(name, navItemType));
            saveWiki();

            // Return to main editor view
            workflowView.classList.add('hidden');
            mainView.classList.remove('hidden');
            workflowHistory = [];
        }

        function createNavItem(name, type) {
            const li = document.createElement('li');
            li.dataset.id = Date.now().toString();
            if (type === 'item') {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = name;
                li.appendChild(a);
            } else {
                const span = document.createElement('span');
                span.className = 'category-toggle';
                span.textContent = name;
                li.appendChild(span);
                 const ul = document.createElement('ul');
                ul.className = 'submenu';
                li.appendChild(ul);
            }
            return li;
        }

        createEditBtn.addEventListener('click', () => {
            workflowHistory = [];
            renderWorkflow({ level: 'chapter' });
        });

        deleteBtn.addEventListener('click', () => toggleEditingMode('delete'));
        renameBtn.addEventListener('click', () => toggleEditingMode('rename'));
        toggleHideBtn.addEventListener('click', () => toggleEditingMode('hide'));
    }

    function addTableDeleteButtons() {
        const tables = document.querySelectorAll('#main-content table');
        tables.forEach(table => {
            if (table.previousElementSibling && table.previousElementSibling.classList.contains('delete-table-btn')) return;
            const btn = document.createElement('button');
            btn.textContent = 'Supprimer le tableau';
            btn.className = 'edit-btn delete-table-btn';
            btn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce tableau ?')) {
                    btn.remove();
                    table.remove();
                    saveWiki();
                }
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

    function renderSideNav(nodes, parentElement) {
        const ul = document.createElement('ul');
        nodes.forEach(node => {
            const li = document.createElement('li');
            li.dataset.id = node.id;

            if (node.type === 'item') {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = node.title;
                li.appendChild(a);
            } else {
                const span = document.createElement('span');
                span.className = 'category-toggle';
                span.textContent = node.title;
                li.appendChild(span);
            }

            if (node.children && node.children.length > 0) {
                const subMenu = renderSideNav(node.children, li);
                subMenu.classList.add('submenu');
                li.appendChild(subMenu);
            }
            ul.appendChild(li);
        });
        parentElement.appendChild(ul);
        return ul;
    }

    async function loadSavedWiki() {
        try {
            const response = await fetch('data/wiki.json', { cache: 'no-cache' });
            if (response.ok) {
                const data = await response.json();
                if (data.sideNav) {
                    const sideNavContainer = document.getElementById('side-nav');
                    sideNavContainer.innerHTML = '<h3>POUR LES JOUEURS…</h3>';
                    renderSideNav(data.sideNav, sideNavContainer);
                } else {
                    // Fallback to localStorage if sideNav is not in the json
                    const savedNav = localStorage.getItem('sideNav');
                    if (savedNav) {
                        const sideNavContainer = document.getElementById('side-nav');
                        sideNavContainer.innerHTML = '<h3>POUR LES JOUEURS…</h3>';
                        renderSideNav(JSON.parse(savedNav), sideNavContainer);
                    }
                }
                if (data.mainContent) {
                    document.getElementById('main-content').innerHTML = data.mainContent;
                } else {
                    const savedContent = localStorage.getItem('mainContent');
                    if (savedContent) document.getElementById('main-content').innerHTML = savedContent;
                }
                if (data.hiddenItems) {
                    localStorage.setItem('hiddenItems', JSON.stringify(data.hiddenItems));
                }
                return;
            }
        } catch (e) {
            console.warn('Chargement distant impossible, utilisation du stockage local');
        }
        const savedNav = localStorage.getItem('sideNav');
        const savedContent = localStorage.getItem('mainContent');
        if (savedNav) document.getElementById('side-nav').innerHTML = savedNav;
        if (savedContent) document.getElementById('main-content').innerHTML = savedContent;
    }

    function saveWiki() {
        saveSideNav();
        saveMainContent();
    }

    function buildSideNavJson(element) {
        const nodes = [];
        element.querySelectorAll(':scope > ul > li').forEach(li => {
            const id = li.dataset.id;
            const target = li.querySelector(':scope > .category-toggle, :scope > a');
            const title = target.textContent.trim();
            const type = target.matches('a') ? 'item' : (li.parentElement.parentElement.id === 'side-nav' ? 'chapter' : 'sub-chapter');
            const children = buildSideNavJson(li);
            nodes.push({ id, title, type, children });
        });
        return nodes;
    }

    function saveSideNav() {
        const sideNavData = buildSideNavJson(document.getElementById('side-nav'));
        localStorage.setItem('sideNav', JSON.stringify(sideNavData));
    }

    function saveMainContent() {
        const main = document.getElementById('main-content');
        const clone = main.cloneNode(true);
        clone.querySelectorAll('.delete-table-btn').forEach(btn => btn.remove());
        localStorage.setItem('mainContent', clone.innerHTML);
    }

    async function logout() {
        await saveOnline();
        disableEditing();
    }

    async function saveOnline() {
        showSaveOverlay();
        try {
            await saveWikiOnline();
        } catch (e) {
            alert('Erreur lors de la sauvegarde en ligne');
        }
        hideSaveOverlay();
    }

    function showSaveOverlay() {
        const overlay = document.getElementById('save-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    function hideSaveOverlay() {
        const overlay = document.getElementById('save-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    async function saveWikiOnline() {
        const main = document.getElementById('main-content').cloneNode(true);
        main.querySelectorAll('.delete-table-btn').forEach(btn => btn.remove());
        const data = {
            sideNav: buildSideNavJson(document.getElementById('side-nav')),
            mainContent: main.innerHTML,
            hiddenItems: JSON.parse(localStorage.getItem('hiddenItems') || '[]')
        };

        const resp = await fetch('/.netlify/functions/saveWiki', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!resp.ok) {
            throw new Error('Échec de la sauvegarde en ligne');
        }
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

