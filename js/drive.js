const CLIENT_ID = '946316739966-eeu7fgp9u1ljt670ie7kh2lip1emqfcv.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file profile email';
const FOLDER_NAME = 'Nottepad';
const JSON_FILENAME = 'Nottepad.json';
let API_KEY = '';
let tokenClient;
let gapiInited = false;
let gisInited = false;
let jsonFileId = null;
let nottepadFolderId = null;
let debounceTimer;
const wall = document.getElementById('wall');
const userNameSpan = document.getElementById('name');
const logoutButton = document.getElementById('logout')

async function fetchApiKey() {
    try {
        const response = await fetch('https://660c58ltn3.execute-api.us-east-1.amazonaws.com/prod/api', {
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        API_KEY = data.apiKey;
        await initializeGapiClient();
    } catch (error) {
        console.error("Error fetching API_KEY:", error);
    }
}

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        gapiInited = true;
        maybeEnableAuth();
    } catch (error) {
        console.error('Error when initializing gapi.client:', error);
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableAuth();
}

function maybeEnableAuth() {
    if (gapiInited && gisInited) {
        checkLoginStatus();
    }
}

async function checkLoginStatus() {
    const savedToken = localStorage.getItem('gapi_token');
    const savedUser = localStorage.getItem('googleUser');
    
    if (savedToken && savedUser) {
        try {
            const token = JSON.parse(savedToken);
            gapi.client.setToken(token);
            await gapi.client.drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder'",
                pageSize: 1,
                fields: 'files(id, name)'
            });
            const userInfo = JSON.parse(savedUser);
            onSuccessfulAuth(userInfo);
        } catch (error) {
            console.log('Invalid or expired token:', error);
            handleSignOut();
        }
    } else {
        showLoginView();
    }
}

function onSuccessfulAuth(userInfo) {
    userNameSpan.textContent = userInfo.name || 'User';
    const userAvatar = document.getElementById('user-avatar');
    if (userInfo.picture) {
        userAvatar.src = userInfo.picture;
        userAvatar.style.display = 'block'
    } else {
        const initials = userInfo.name ? userInfo.name.split(' ').map(n => n[0]).join('') : 'U';
        userAvatar.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23666'/><text x='50' y='60' font-size='50' text-anchor='middle' fill='white'>${initials}</text></svg>`;
    }
    if (wall) wall.remove();
    findOrCreateJsonFile();
}

function showLoginView() {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length === 2 && pathParts[1] === 'app') {
        window.location.href = '/';
    } else {
        const basePath = pathParts[1];
        window.location.href = `/${basePath}/`;
    }
}

function handleSignOut() {
    const token = gapi.client.getToken();
    if (token) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    
    localStorage.removeItem('gapi_token');
    localStorage.removeItem('googleUser');
    showLoginView();
}

logoutButton.addEventListener('click', handleSignOut);

const logo = document.querySelector(".logo");
const notesList = document.getElementById("notes-list");
const loadingMessage = document.getElementById("loading-message");
const addNoteButton = document.getElementById("add");
const noteDetails = document.getElementById("note-details");
const noteTitle = document.getElementById("note-title");
const noteBody = document.getElementById("note-body");
const formatacao = document.getElementById('formatacao');
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const underlineBtn = document.getElementById('underlineBtn');
const markerBtn = document.getElementById('markerBtn');
const listOrderBtn = document.getElementById('listOrderBtn');
const listBtn = document.getElementById('listBtn');
const linkBtn = document.getElementById('linkBtn');
const removeBtn = document.getElementById('removeBtn');
const deleteConfirmation = document.getElementById("delete-confirmation");
const confirmDeleteButton = document.getElementById("confirm-delete");
const cancelDeleteButton = document.getElementById("cancel-delete");
const noteToDeleteSpan = document.getElementById("note-to-delete");
const home = document.getElementById("home");
const toggleDark = document.getElementById("dark-mode");
const menu = document.getElementById("menu");
const overlaySidebar = document.getElementById("overlay-sidebar"); 
const closeSidebar = document.getElementById("toggle-sidebar");
const content = document.querySelector(".content");

let notes = [];
let currentNoteId = null;

menu.addEventListener('click', toggleSidebar);
overlaySidebar.addEventListener('click', toggleSidebar);
closeSidebar.addEventListener('click', toggleSidebarDesktop);

toggleDark.addEventListener("click", () => {
    if (document.body.classList.contains('light-mode')) {
        applyDarkMode();
        localStorage.setItem('theme', 'dark-mode');
    } else {
        applyLightMode();
        localStorage.setItem('theme', 'light-mode');
    }
});

logo.addEventListener("click", () => {
    if (currentNoteId) {
        saveNote();
    }
    noteDetails.classList.add("hidden");
    home.classList.remove("hidden");
    const selectedNote = notesList.querySelector(".selected-note");
    if (selectedNote) {
        selectedNote.classList.remove("selected-note");
    }
    currentNoteId = null;
});

async function ensureNottepadFolderExists() {
    if (nottepadFolderId) return;

    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        if (response.result.files && response.result.files.length > 0) {
            nottepadFolderId = response.result.files[0].id;
            return;
        }
        const createResponse = await gapi.client.drive.files.create({
            resource: {
                name: FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });
        nottepadFolderId = createResponse.result.id;
    } catch (error) {
        console.error('Error checking/creating Nottepad folder:', error);
        throw error;
    }
}

async function findOrCreateJsonFile() {
    loadingMessage.style.display = "flex";  
    try {
        await ensureNottepadFolderExists();
        if (jsonFileId) {
            await loadNotesFromDrive();
            return;
        }
        const response = await gapi.client.drive.files.list({
            q: `name='${JSON_FILENAME}' and '${nottepadFolderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        if (response.result.files && response.result.files.length > 0) {
            jsonFileId = response.result.files[0].id;
            await loadNotesFromDrive();
        } else {
            await createNewJsonFile();
        }
    } catch (error) {
        console.error('Error fetching/creating JSON file:', error);
        alert('Error accessing Google Drive. Please try again.');
    } finally {
        loadingMessage.style.display = "none";
    }
}

async function createNewJsonFile() {
    const fileMetadata = {
        name: JSON_FILENAME,
        mimeType: 'application/json',
        parents: [nottepadFolderId]
    };
    const fileContent = JSON.stringify({ notes: [] }, null, 2);
    const response = await gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary=boundary' },
        body: [
            '--boundary',
            'Content-Type: application/json; charset=UTF-8',
            '',
            JSON.stringify(fileMetadata),
            '--boundary',
            'Content-Type: application/json',
            '',
            fileContent,
            '--boundary--'
        ].join('\r\n')
    });
    jsonFileId = response.result.id;
    notes = [];
    renderNotesList();
}

async function loadNotesFromDrive() {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: jsonFileId,
            alt: 'media'
        });
        notes = response.result.notes || [];
        renderNotesList();
    } catch (error) {
        console.error('Error loading notes:', error);
        throw error;
    }
}

async function saveNotesToDrive() {
    if (!jsonFileId) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            const fileContent = JSON.stringify({ notes }, null, 2);
            await gapi.client.request({
                path: `https://www.googleapis.com/upload/drive/v3/files/${jsonFileId}`,
                method: 'PATCH',
                params: { uploadType: 'media' },
                body: fileContent
            });
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }, 1000);
}

function saveNotes() {
    saveNotesToDrive();
}

function applyStoredTheme() {
    const storedMode = localStorage.getItem('theme');
    if (storedMode === 'dark-mode') {
        applyDarkMode();
    } else {
        applyLightMode();
    }
}          

function applyDarkMode() {
    const items = document.querySelectorAll('#sidebar ul li');
    const botoes = document.querySelectorAll('.note-actions button');
    const botaoDark = document.getElementById('dark-mode');
    const h32 = document.getElementById('h3-2');
    const sidebar = document.getElementById('sidebar');
    const notebody = document.getElementById('note-body');
    const textEditor = document.getElementById('text-editor');
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    notebody.classList.remove('light-mode');
    notebody.classList.add('dark-mode');
    textEditor.classList.remove('light-mode');
    textEditor.classList.add('dark-mode');
    sidebar.classList.remove('light-mode');
    sidebar.classList.add('dark-mode');
    noteDetails.classList.remove('light-mode');
    noteDetails.classList.add('dark-mode');
    botaoDark.classList.remove('light-mode');
    botaoDark.classList.add('dark-mode');
    menu.classList.remove('light-mode');
    menu.classList.add('dark-mode');
    h32.style.color = "#DBDBDB";
    items.forEach(item => {
        item.classList.remove('light-mode');
        item.classList.add('dark-mode');
    });
    botoes.forEach(item => {
        item.classList.remove('light-mode');
        item.classList.add('dark-mode');
    });
}

function applyLightMode() {
    const items = document.querySelectorAll('#sidebar ul li');
    const botoes = document.querySelectorAll('.note-actions button');
    const botaoDark = document.getElementById('dark-mode');
    const h32 = document.getElementById('h3-2');
    const sidebar = document.getElementById('sidebar');
    const notebody = document.getElementById('note-body');
    const textEditor = document.getElementById('text-editor');
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    notebody.classList.remove('dark-mode');
    notebody.classList.add('light-mode');
    textEditor.classList.remove('dark-mode');
    textEditor.classList.add('light-mode');
    sidebar.classList.remove('dark-mode');
    sidebar.classList.add('light-mode');
    noteDetails.classList.remove('dark-mode');
    noteDetails.classList.add('light-mode');
    botaoDark.classList.remove('dark-mode');
    botaoDark.classList.add('light-mode');
    menu.classList.remove('dark-mode');
    menu.classList.add('light-mode');
    h32.style.color = "#111";
    items.forEach(item => {
        item.classList.remove('dark-mode');
        item.classList.add('light-mode');
    });
    botoes.forEach(item => {
        item.classList.remove('dark-mode');
        item.classList.add('light-mode');
    });
}

function renderNotesList() {
    notes.forEach((note, index) => {
        if (note.order === undefined) {
            note.order = index;
        }
    });
    notes.sort((a, b) => (a.order || 0) - (b.order || 0));
    notesList.innerHTML = "";
    notes.forEach(note => {
        const li = document.createElement("li");
        li.innerHTML = `
        <div class="dragAndSpan">
            <div class="dragNote">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="mdi-drag" width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z" /></svg>
            </div>
                <span>${note.title || window.i18n.note}</span>
        </div>
        <div class="note-actions">
            <button class="delete-note light-mode" data-id="${note.id}" title="${window.i18n.deleteNote}"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="mdi-trash-can-outline" width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg></button>
        </div>`;
        li.dataset.id = note.id;
        li.addEventListener("click", (event) => {
            if (!event.target.closest('.delete-note')) {
                selectNote(note.id);
            }
        });
        const deleteButton = li.querySelector('.delete-note');
        if (deleteButton) {
            deleteButton.addEventListener("click", (event) => {
                event.stopPropagation();
                const noteId = deleteButton.getAttribute('data-id');
                deleteNote(noteId);
            });
        }
        if (note.id === currentNoteId) {
            li.classList.add("selected-note");
        }
        notesList.appendChild(li);
    });
    const items = document.querySelectorAll('#sidebar ul li');
    if (document.body.classList.contains('light-mode')) {
        items.forEach(item => {
            item.classList.add('light-mode');
        });
    } else {
        items.forEach(item => {
            item.classList.add('dark-mode');
        });
    }
    initializeSidebarSortable();
}

function deleteNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        noteToDeleteSpan.textContent = note.title || "New note";
        deleteConfirmation.classList.remove("hidden");
        currentNoteId = id;
    }
}

function initializeSidebarSortable() {
    new Sortable(notesList, {
        animation: 150,
        handle: 'svg',
        ghostClass: 'sortable-ghost',
        onStart: function(evt) {
            const notes = notesList.querySelectorAll('li');
            notes.forEach((note, index) => {
                if (index !== evt.oldIndex) {
                    note.classList.add('faded');
                }
            });
        },
        onEnd: function(evt) {
            const notes = notesList.querySelectorAll('li');
            notes.forEach((note) => {
                note.classList.remove('faded');
            });
            updateNotesOrder();
        }
    });
}

function updateNotesOrder() {
    const noteElements = notesList.querySelectorAll('li');
    notes = Array.from(noteElements).map((el, index) => {
        const note = notes.find(note => note.id === el.dataset.id);
        return { ...note, order: index };
    });
    saveNotes();
}

function selectNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);
    if (note) {
        noteTitle.value = note.title || '';
        noteBody.innerHTML = note.body || '';
        home.classList.add("hidden");
        noteDetails.classList.remove("hidden");

        const selectedNote = notesList.querySelector(".selected-note");
        if (selectedNote) {
            selectedNote.classList.remove("selected-note");
        }

        const li = notesList.querySelector(`li[data-id="${id}"]`);
        if (li) {
            li.classList.add("selected-note");
        }
    }
}

function saveNote() {
    const note = {
        id: currentNoteId,
        title: noteTitle.value,
        body: noteBody.innerHTML,
        updatedAt: new Date().toISOString()
    };
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
        note.createdAt = notes[index].createdAt || new Date().toISOString();
        note.order = notes[index].order || 0;
        notes[index] = note;
    } else {
        note.createdAt = new Date().toISOString();
        note.order = notes.length;
        notes.push(note);
    }
    saveNotes();
    renderNotesList();
}

noteTitle.addEventListener("input", saveNote);
noteBody.addEventListener("blur", saveNote);
noteBody.addEventListener('paste', function(e) {
    e.preventDefault();
    let text = (e.originalEvent || e).clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
});

function addNote() {
    const newNote = {
        id: Date.now().toString(),
        title: window.i18n.newNote,
        body: "",
        order: notes.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    notes.push(newNote);
    currentNoteId = newNote.id;
    saveNotes();
    renderNotesList();
    selectNote(newNote.id);
}

addNoteButton.addEventListener("click", addNote);

confirmDeleteButton.addEventListener("click", () => {
    notes = notes.filter(note => note.id !== currentNoteId);
    saveNotes();
    currentNoteId = null;
    deleteConfirmation.classList.add("hidden");
    noteDetails.classList.add("hidden");
    home.classList.remove("hidden");
    renderNotesList();
});

cancelDeleteButton.addEventListener("click", () => {
    deleteConfirmation.classList.add("hidden");
});

noteBody.addEventListener('mouseup', function(event) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().length > 0) {
        savedSelection = selection.getRangeAt(0);
        const range = savedSelection.cloneRange();
        range.collapse(false);
        const span = document.createElement('span');
        range.insertNode(span);
        const rect = span.getBoundingClientRect();
        span.parentNode.removeChild(span);
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        formatacao.style.left = `${rect.left + window.scrollX}px`;
        formatacao.style.top = `${rect.top - 30 + window.scrollY - formatacao.offsetHeight}px`;
        formatacao.style.display = 'flex';
    } else {
        formatacao.style.display = 'none';
    }
});

document.addEventListener('click', function(event) {
    if (!noteBody.contains(event.target) && !formatacao.contains(event.target)) {
        formatacao.style.display = 'none';
    }
});

function restoreSelectionAndApplyCommand(command, value = null) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedSelection);
    document.execCommand(command, false, value);
    formatacao.style.display = 'none';
}

boldBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('bold');
});

italicBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('italic');
});

underlineBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('underline');
});

listOrderBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('insertOrderedList');
});

listBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('insertUnorderedList');
});

linkBtn.addEventListener('click', function() {
    const range = saveSelection();
    const url = prompt(window.i18n.insertLink, 'https://');
    if (url) {
        noteBody.focus();
        restoreSelection(range);
        
        document.execCommand('createLink', false, url);
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const linkElement = selection.anchorNode.parentElement;
            if (linkElement.tagName === 'A') {
                linkElement.setAttribute('contenteditable', 'false');
                linkElement.setAttribute('target', '_blank');
            }
        }
    }
});

markerBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('hiliteColor', 'yellow');
});

removeBtn.addEventListener('click', function() {
    restoreSelectionAndApplyCommand('removeFormat');
});

function saveSelection() {
    const selection = getSelection();
    if (selection.rangeCount > 0) {
        return selection.getRangeAt(0);
    }
    return null;
}

function restoreSelection(range) {
    if (range) {
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle('active');
    overlaySidebar.classList.toggle('active');
}

function toggleSidebarDesktop() {
    const sidebar = document.getElementById('sidebar');
    const sidebarStyle = window.getComputedStyle(sidebar).display;
    if (sidebarStyle === 'flex') {
      sidebar.style.display = 'none';
      closeSidebar.style.left = '20px';
      closeSidebar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19,13H3V11H19L15,7L16.4,5.6L22.8,12L16.4,18.4L15,17L19,13M3,6H13V8H3V6M13,16V18H3V16H13Z" /></svg>`;
      content.style.width = '1060px';
    } else {
      sidebar.style.display = 'flex';
      closeSidebar.style.left = '250px';
      closeSidebar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5,13L9,17L7.6,18.42L1.18,12L7.6,5.58L9,7L5,11H21V13H5M21,6V8H11V6H21M21,16V18H11V16H21Z" /></svg>`;
      content.style.width = '860px';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkAPIs = setInterval(() => {
        if (window.gapi && window.google) {
            clearInterval(checkAPIs);
            initializeApp();
        }
    }, 100);
});

function initializeApp() {
    fetchApiKey();
    gapiLoaded();
    gisLoaded();
    applyStoredTheme();
    renderNotesList();
    initializeSidebarSortable();
    loadingMessage.style.display = "none";
}
