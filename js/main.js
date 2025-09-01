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
    }

    function addNavEditButtons() {
        // Clear existing buttons
        document.querySelectorAll('#side-nav .edit-btn').forEach(btn => btn.remove());
        const sideNav = document.getElementById('side-nav');
        const mainUl = sideNav.querySelector('ul');

        const addChapterBtn = document.createElement('button');
        addChapterBtn.textContent = 'Ajouter un chapitre';
        addChapterBtn.className = 'edit-btn';
        addChapterBtn.style.marginLeft = '10px'; // Add some style to position it nicely
        addChapterBtn.addEventListener('click', () => {
            const title = prompt('Nom du chapitre:');
            if (title) {
                const id = Date.now().toString();
                const li = document.createElement('li');
                li.dataset.id = id;

                const span = document.createElement('span');
                span.className = 'category-toggle';
                span.textContent = title;
                li.appendChild(span);

                mainUl.appendChild(li);

                // Re-initialize edit buttons for the new element and its children
                addNavEditButtons();
                initializeNavigation();
                saveWiki();
            }
        });
        const h3 = sideNav.querySelector('h3');
        h3.insertAdjacentElement('afterend', addChapterBtn);

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
                if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
                    li.remove();
                    updateHiddenItems(id, false);
                    saveWiki();
                }
            });

            li.appendChild(renameBtn);
            li.appendChild(hideBtn);
            li.appendChild(deleteBtn);

            if (target.matches('.category-toggle')) {
                const addSubItemBtn = document.createElement('button');
                addSubItemBtn.textContent = 'Ajouter Elément';
                addSubItemBtn.className = 'edit-btn';
                addSubItemBtn.addEventListener('click', () => {
                    const title = prompt('Nom de l\'élément:');
                    if (title) {
                        const newId = Date.now().toString();
                        let submenu = li.querySelector('ul.submenu');
                        if (!submenu) {
                            submenu = document.createElement('ul');
                            submenu.className = 'submenu open';
                            li.appendChild(submenu);
                            // Make sure the parent toggle is open
                            target.classList.add('open');
                        }

                        const newItemLi = document.createElement('li');
                        newItemLi.dataset.id = newId;

                        const a = document.createElement('a');
                        a.href = '#';
                        a.textContent = title;
                        newItemLi.appendChild(a);

                        submenu.appendChild(newItemLi);

                        // Re-initialize buttons to cover the new element
                        addNavEditButtons();
                        initializeNavigation();
                        saveWiki();
                    }
                });

                const addSubChapterBtn = document.createElement('button');
                addSubChapterBtn.textContent = 'Ajouter Sous-chapitre';
                addSubChapterBtn.className = 'edit-btn';
                addSubChapterBtn.addEventListener('click', () => {
                    const title = prompt('Nom du sous-chapitre:');
                    if (title) {
                        const newId = Date.now().toString();
                        let submenu = li.querySelector('ul.submenu');
                        if (!submenu) {
                            submenu = document.createElement('ul');
                            submenu.className = 'submenu open';
                            li.appendChild(submenu);
                             // Make sure the parent toggle is open
                            target.classList.add('open');
                        }

                        const newSubChapterLi = document.createElement('li');
                        newSubChapterLi.dataset.id = newId;

                        const span = document.createElement('span');
                        span.className = 'category-toggle';
                        span.textContent = title;
                        newSubChapterLi.appendChild(span);

                        submenu.appendChild(newSubChapterLi);

                        // Re-initialize buttons to cover the new element
                        addNavEditButtons();
                        initializeNavigation();
                        saveWiki();
                    }
                });

                li.appendChild(addSubItemBtn);
                li.appendChild(addSubChapterBtn);
            }
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

