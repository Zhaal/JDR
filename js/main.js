document.addEventListener('DOMContentLoaded', async function() {
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    let wikiPages = {};
    let currentPageId = null;
    let setupNavSelectionHandler = null;

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

    const insertImageBtn = document.getElementById('insert-image');
    if (insertImageBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const main = document.getElementById('main-content');
                    const container = document.createElement('div');
                    container.className = 'image-container';
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    container.appendChild(img);
                    main.appendChild(container);
                    addImageControls(container);
                    saveWiki();
                };
                reader.readAsDataURL(file);
            }
        });
        insertImageBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    function initializeNavigation() {
        const sideNav = document.getElementById('side-nav');
        if (sideNav.dataset.navListener) return;

        sideNav.addEventListener('click', function(event) {
            const link = event.target.closest('a');
            const toggle = event.target.closest('.category-toggle');

            if (link) {
                event.preventDefault();
                const li = link.closest('li');
                if (li && li.dataset.id) {
                    loadPage(li.dataset.id);
                }
            } else if (toggle) {
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
        addImageControls();
        if (!setupNavSelectionHandler) {
            setupNavSelectionHandler = initializeEditorPanel();
        }
        setupNavSelectionHandler(true);
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
        document.querySelectorAll('.delete-image-btn').forEach(btn => btn.remove());
        if (setupNavSelectionHandler) {
            setupNavSelectionHandler(false);
        }
    }

    function initializeEditorPanel() {
        const renameBtn = document.getElementById('rename-btn');
        const deleteBtn = document.getElementById('delete-btn');
        const toggleHideBtn = document.getElementById('toggle-hide-btn');
        const addChapterBtn = document.getElementById('add-chapter-btn');
        const addItemBtn = document.getElementById('add-item-btn');
        const sideNav = document.getElementById('side-nav');

        let currentEditingMode = null;
        let selectedItemId = null;

        // This listener is added in enableEditing and removed in disableEditing
        let navSelectionHandler = null;

        function updateNavSelectionUI() {
            document.querySelectorAll('#side-nav li').forEach(item => {
                item.classList.remove('selected-item');
            });

            const selectedLi = document.querySelector(`#side-nav li[data-id="${selectedItemId}"]`);

            if (selectedLi) {
                selectedLi.classList.add('selected-item');
            }

            if (addItemBtn) {
                if (selectedItemId && selectedLi) {
                    const target = selectedLi.querySelector(':scope > a, :scope > .category-toggle');
                    const text = target ? target.textContent.trim() : 'l\'élément';
                    addItemBtn.textContent = `Éditer "${text}"`;
                    const isPage = selectedLi.querySelector(':scope > a');
                    // This button is for adding items, so it should be disabled for pages.
                    // The user request is to change the text to "Edit X", but the button adds a sub-item.
                    // Let's stick to the requested text change but keep the original logic for disabling.
                    addItemBtn.disabled = isPage;
                } else {
                    addItemBtn.textContent = "Sélectionner un titre de menu pour l'éditer";
                    addItemBtn.disabled = true;
                }
            }
        }

        function setupNavSelection(enable) {
            if (enable) {
                navSelectionHandler = (event) => {
                    // Do not trigger selection when in an item-wise editing mode
                    if (currentEditingMode) return;
                    // Or if an action icon was clicked
                    if (event.target.closest('.edit-icon')) return;

                    const li = event.target.closest('li');
                    if (li && li.dataset.id) {
                        event.stopPropagation(); // Prevent event from bubbling to parent LIs
                        if (selectedItemId === li.dataset.id) {
                            selectedItemId = null; // Toggle off
                        } else {
                            selectedItemId = li.dataset.id;
                        }
                        updateNavSelectionUI();
                    }
                };
                sideNav.addEventListener('click', navSelectionHandler);
            } else {
                if (navSelectionHandler) {
                    sideNav.removeEventListener('click', navSelectionHandler);
                    navSelectionHandler = null;
                }
                selectedItemId = null;
                updateNavSelectionUI();
            }
        }

        function toggleEditingMode(mode) {
            if (currentEditingMode === mode) {
                currentEditingMode = null;
            } else {
                currentEditingMode = mode;
                selectedItemId = null; // Unselect item when entering a mode
            }
            updateNavSelectionUI();
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
                    if (id === selectedItemId) {
                        selectedItemId = null;
                        updateNavSelectionUI();
                    }
                    saveWiki();
                }
            } else if (mode === 'rename') {
                showRenameItemWorkflow(li);
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
            const editorMainView = document.getElementById('editor-main-view');
            const isWorkflowActive = editorMainView.classList.contains('hidden');

            const allButtons = [renameBtn, deleteBtn, toggleHideBtn, addChapterBtn, addItemBtn];
            allButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.remove('active');
            });

            renameBtn.textContent = 'Renommer';
            deleteBtn.textContent = 'Supprimer';
            toggleHideBtn.textContent = 'Cacher/Afficher';

            if (isWorkflowActive) {
                return;
            }

            if (currentEditingMode) {
                if (currentEditingMode === 'rename') {
                    renameBtn.disabled = false;
                    renameBtn.textContent = 'Annuler';
                    renameBtn.classList.add('active');
                } else if (currentEditingMode === 'delete') {
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Annuler';
                    deleteBtn.classList.add('active');
                } else if (currentEditingMode === 'hide') {
                    toggleHideBtn.disabled = false;
                    toggleHideBtn.textContent = 'Terminer';
                    toggleHideBtn.classList.add('active');
                }
            } else {
                renameBtn.disabled = false;
                deleteBtn.disabled = false;
                toggleHideBtn.disabled = false;
                addChapterBtn.disabled = false;

                const parentLi = document.querySelector(`li[data-id="${selectedItemId}"]`);
                const isPage = parentLi && parentLi.querySelector(':scope > a');
                addItemBtn.disabled = !selectedItemId || isPage;
            }
        }

        const editorMainView = document.getElementById('editor-main-view');
        const editorWorkflowView = document.getElementById('editor-workflow-view');

        function showWorkflowView(innerHTML, onInit) {
            editorMainView.classList.add('hidden');
            editorWorkflowView.innerHTML = innerHTML;
            if (onInit) {
                onInit(editorWorkflowView);
            }
            editorWorkflowView.classList.remove('hidden');
            updateEditorPanelUI();
        }

        function hideWorkflowView() {
            editorMainView.classList.remove('hidden');
            editorWorkflowView.classList.add('hidden');
            editorWorkflowView.innerHTML = '';

            if (currentEditingMode === 'rename') {
                // We were in rename mode, so we need to exit it.
                // toggleEditingMode will handle the UI updates.
                toggleEditingMode('rename');
            } else {
                // Not in a mode that has a workflow, just update the UI.
                updateEditorPanelUI();
            }
        }

        function createNavItem(name, type) {
            const li = document.createElement('li');
            li.dataset.id = Date.now().toString();
            if (type === 'item') {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = name;
                li.appendChild(a);
                wikiPages[li.dataset.id] = `<h2>${name}</h2><p>Contenu à rédiger.</p>`;
            } else { // category
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

        addChapterBtn.addEventListener('click', showAddChapterWorkflow);

        function showAddChapterWorkflow() {
            const formHTML = `
                <h4>Ajouter un nouveau chapitre</h4>
                <div>
                    <label for="workflow-name">Nom du chapitre :</label>
                    <input type="text" id="workflow-name" required>
                </div>
                <div class="workflow-actions">
                    <button id="workflow-confirm">Confirmer</button>
                    <button id="workflow-cancel">Annuler</button>
                </div>
            `;

            showWorkflowView(formHTML, (view) => {
                view.querySelector('#workflow-cancel').addEventListener('click', hideWorkflowView);
                view.querySelector('#workflow-confirm').addEventListener('click', () => {
                    const name = view.querySelector('#workflow-name').value.trim();
                    if (name) {
                        const parentUl = document.querySelector('#side-nav > ul');
                        const newItem = createNavItem(name, 'category');
                        parentUl.appendChild(newItem);
                        saveWiki();
                    }
                    hideWorkflowView();
                });
            });
        }

        function showRenameItemWorkflow(li) {
            const target = li.querySelector(':scope > a, :scope > .category-toggle');
            const icon = target.querySelector('.edit-icon');

            let textNode = null;
            // Find the text node to edit, skipping the icon node
            for (const node of target.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                    textNode = node;
                    break;
                }
            }
            const currentName = textNode ? textNode.textContent.trim() : target.textContent.trim().replace(/[\n\r\s\t]+/g, ' ');

            const formHTML = `
                <h4>Renommer "${currentName}"</h4>
                <div>
                    <label for="workflow-name">Nouveau nom :</label>
                    <input type="text" id="workflow-name" value="${currentName}" required>
                </div>
                <div class="workflow-actions">
                    <button id="workflow-confirm">Confirmer</button>
                    <button id="workflow-cancel">Annuler</button>
                </div>
            `;

            showWorkflowView(formHTML, (view) => {
                view.querySelector('#workflow-cancel').addEventListener('click', hideWorkflowView);
                view.querySelector('#workflow-confirm').addEventListener('click', () => {
                    const newName = view.querySelector('#workflow-name').value.trim();
                    if (newName && newName !== currentName) {
                        if (textNode) {
                            textNode.textContent = newName;
                        } else {
                            // Fallback if text node not found, might mess up the icon
                            target.textContent = newName;
                            if(icon) target.prepend(icon);
                        }
                        saveWiki();
                    }
                    hideWorkflowView();
                });
            });
        }

        function showAddItemWorkflow() {
            if (!selectedItemId) return;
            const parentLi = document.querySelector(`li[data-id="${selectedItemId}"]`);
            const parentName = parentLi.querySelector(':scope > .category-toggle, :scope > a').textContent.trim();

            const formHTML = `
                <h4>Ajouter un élément dans "${parentName}"</h4>
                <div>
                    <label for="workflow-type">Ajouter :</label>
                    <select id="workflow-type">
                        <option value="category">un sous-chapitre</option>
                        <option value="item">une page</option>
                    </select>
                </div>
                <div>
                    <label for="workflow-name">Nom :</label>
                    <input type="text" id="workflow-name" required>
                </div>
                <div class="workflow-actions">
                    <button id="workflow-confirm">Confirmer</button>
                    <button id="workflow-cancel">Annuler</button>
                </div>
            `;

            showWorkflowView(formHTML, (view) => {
                view.querySelector('#workflow-cancel').addEventListener('click', hideWorkflowView);
                view.querySelector('#workflow-confirm').addEventListener('click', () => {
                    const type = view.querySelector('#workflow-type').value;
                    const name = view.querySelector('#workflow-name').value.trim();

                    if (!name) {
                        alert('Le nom ne peut pas être vide.');
                        return;
                    }

                    let parentUl = parentLi.querySelector(':scope > ul');
                    if (!parentUl) {
                        parentUl = document.createElement('ul');
                        parentUl.className = 'submenu open';
                        parentLi.appendChild(parentUl);
                        const toggle = parentLi.querySelector('.category-toggle');
                        if (toggle) toggle.classList.add('open');
                    }
                    const newItem = createNavItem(name, type);
                    parentUl.appendChild(newItem);
                    saveWiki();

                    selectedItemId = null;
                    updateNavSelectionUI();
                    hideWorkflowView();
                });
            });
        }

        addItemBtn.addEventListener('click', () => {
            if (!selectedItemId) return;
            const parentLi = document.querySelector(`li[data-id="${selectedItemId}"]`);
            if (!parentLi || parentLi.querySelector(':scope > a')) {
                alert("Impossible d'ajouter un sous-élément à une page.");
                return;
            }
            showAddItemWorkflow();
        });

        deleteBtn.addEventListener('click', () => toggleEditingMode('delete'));
        renameBtn.addEventListener('click', () => toggleEditingMode('rename'));
        toggleHideBtn.addEventListener('click', () => toggleEditingMode('hide'));

        return setupNavSelection;
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

    function addImageControls(container) {
        const containers = container ? [container] : document.querySelectorAll('#main-content .image-container');
        containers.forEach(container => {
            if (container.querySelector('.delete-image-btn')) return;
            const btn = document.createElement('button');
            btn.innerHTML = '&times;';
            btn.className = 'delete-image-btn';
            btn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
                    container.remove();
                    saveWiki();
                }
            });
            container.appendChild(btn);
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

    function loadPage(id) {
        const mainContent = document.getElementById('main-content');
        const content = wikiPages[id] || `<h2>Page non trouvée</h2><p>Le contenu de cette page n'a pas été trouvé.</p>`;
        mainContent.innerHTML = content;
        currentPageId = id;

        document.querySelectorAll('#side-nav li').forEach(item => {
            item.classList.remove('active');
        });
        const activeLi = document.querySelector(`#side-nav li[data-id="${id}"]`);
        if (activeLi) {
            activeLi.classList.add('active');
        }
    }

    async function loadSavedWiki() {
        const sideNavContainer = document.getElementById('side-nav');

        const renderNav = (navData) => {
            const existingUl = sideNavContainer.querySelector('ul');
            if (existingUl) existingUl.remove();
            renderSideNav(navData, sideNavContainer);
        };

        const loadContent = (pages) => {
            wikiPages = pages || {};
            const firstPageId = document.querySelector('#side-nav li[data-id]')?.dataset.id || '1';
            loadPage(firstPageId);
        };

        try {
            const response = await fetch('data/wiki.json', { cache: 'no-cache' });
            if (response.ok) {
                const data = await response.json();
                if (data.sideNav) {
                    renderNav(data.sideNav);
                } else {
                    const savedNav = localStorage.getItem('sideNav');
                    if (savedNav) renderNav(JSON.parse(savedNav));
                }
                loadContent(data.pages);

                if (data.hiddenItems) {
                    localStorage.setItem('hiddenItems', JSON.stringify(data.hiddenItems));
                }
                return;
            }
        } catch (e) {
            console.warn('Chargement distant impossible, utilisation du stockage local', e);
        }

        const savedNav = localStorage.getItem('sideNav');
        if (savedNav) {
            try {
                renderNav(JSON.parse(savedNav));
            } catch (jsonError) {
                console.error("Could not parse sideNav from localStorage", jsonError);
            }
        }

        const savedPages = localStorage.getItem('wikiPages');
        if (savedPages) {
            loadContent(JSON.parse(savedPages));
        } else {
            // Fallback for old data structure
            const savedContent = localStorage.getItem('mainContent');
            if (savedContent) {
                wikiPages = { '1': savedContent };
                loadPage('1');
            }
        }
    }

    function saveWiki() {
        saveSideNav();
        saveMainContent();
        debouncedSaveOnline();
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
        localStorage.setItem('wikiPages', JSON.stringify(wikiPages));
    }

    function saveMainContent() {
        if (!currentPageId) return;
        const main = document.getElementById('main-content');
        const clone = main.cloneNode(true);
        clone.querySelectorAll('.delete-table-btn, .delete-image-btn').forEach(btn => btn.remove());
        wikiPages[currentPageId] = clone.innerHTML;
    }

    async function logout() {
        await saveOnline();
        disableEditing();
    }

    async function saveOnline() {
        try {
            await saveWikiOnline();
            alert('Sauvegarde manuelle effectuée.');
        } catch (e) {
            alert('Erreur lors de la sauvegarde en ligne');
        }
    }

    function showSaveOverlay() {
        const overlay = document.getElementById('save-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    function hideSaveOverlay() {
        const overlay = document.getElementById('save-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    const debouncedSaveOnline = debounce(async () => {
        try {
            await saveWikiOnline();
            console.log("Sauvegarde automatique réussie.");
        } catch (e) {
            console.error("Erreur lors de la sauvegarde automatique:", e);
            alert("Une erreur est survenue lors de la sauvegarde automatique. Vos dernières modifications n'ont peut-être pas été enregistrées en ligne.");
        }
    }, 2000);

    async function saveWikiOnline() {
        // First, ensure the current page's content is up-to-date in wikiPages
        saveMainContent();

        const data = {
            sideNav: buildSideNavJson(document.getElementById('side-nav')),
            pages: wikiPages,
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

