// Configurações do app no Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBO_nBQg70L-WOby_UDOJc6bt3Yg3I7-Qk",
    authDomain: "bloco-de-notas-b94c4.firebaseapp.com",
    projectId: "bloco-de-notas-b94c4",
    storageBucket: "bloco-de-notas-b94c4.appspot.com",
    messagingSenderId: "515098342854",
    appId: "1:515098342854:web:4b91c903046400c7f96ec7"
};

// Inicia o Firebase
firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', (event) => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Remove a barreira se o usuário estiver logado
            document.getElementById('barreira').style.display = 'none';

            const db = firebase.firestore();
            const userDocRef = db.collection('usuario').doc(user.uid);
                        
            userDocRef.get().then((doc) => {
                if (doc.exists) {
                    // Dados do usuário
                    const userData = doc.data();
                    
                    // Declarações
                    const nome = document.getElementById('nome')
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
                    const configBtn = document.getElementById("config");
                    const configPopup = document.getElementById("config-popup");
                    const nomeInput = document.getElementById('nome-input');
                    const emailInput = document.getElementById('email-input');
                    const closeConfig = document.getElementById('close-config');
                    const email = document.getElementById('email');
                    let currentNoteId = null;

                    // Nome e e-mail do usuário
                    nome.textContent = userData.nome;
                    email.textContent = user.email;

                    // Listeners iniciais
                    menu.addEventListener('click', toggleSidebar);
                    overlaySidebar.addEventListener('click', toggleSidebar);
                    configBtn.addEventListener('click', openConfig);
                    closeConfig.addEventListener('click', closeConfigPop);

                    toggleDark.addEventListener("click", () => {
                        if (document.body.classList.contains('light-mode')) {
                            applyDarkMode();
                            userDocRef.update({
                                modo_escuro: true
                            });
                        } else {
                            applyLightMode();
                            userDocRef.update({
                                modo_escuro: false
                            });
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

                    function applyStoredTheme() {
                        if (userData.modo_escuro) {
                            applyDarkMode();
                        } else {
                            applyLightMode();
                        }
                    }
                    
                    // CRUD do bloco de notas
                    function loadNotes() {             
                        const db = firebase.firestore();
                        
                        db.collection('bloco')
                            .where('usuario', '==', user.uid)
                            .orderBy('ordem', 'asc')
                            .get()
                            .then((querySnapshot) => {
                                notesList.innerHTML = "";
                                
                                querySnapshot.forEach((doc) => {
                                    const note = {
                                        id: doc.id,
                                        ...doc.data()
                                    };
                    
                                    const li = document.createElement("li");
                                    li.innerHTML = `
                                        <div class="dragAndSpan">
                                            <div class="dragNote">
                                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="mdi-drag" width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z" /></svg>
                                            </div>
                                            <span>${note.titulo || "注記"}</span>
                                        </div>
                                        <div class="note-actions">
                                            <button class="delete-note light-mode" title="メモの削除"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="mdi-trash-can-outline" width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg></button>
                                        </div>`;
                                    li.dataset.id = note.id;
                    
                                    const deleteButton = li.querySelector('.delete-note');
                                    deleteButton.addEventListener("click", (event) => {
                                        event.stopPropagation();
                                        deleteNote(note.id);
                                    });
                    
                                    li.addEventListener("click", () => selectNote(note.id));
                    
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
                            })
                            .catch((error) => {
                                console.error("メモの読み込みエラー:", error);
                            });
                    }
                    
                    function deleteNote(id) {
                        const db = firebase.firestore();
                        
                        db.collection('bloco').doc(id).get()
                            .then((doc) => {
                                if (doc.exists) {
                                    const note = doc.data();
                                    noteToDeleteSpan.textContent = note.titulo || "新しいメモ";
                                    deleteConfirmation.classList.remove("hidden");
                                    currentNoteId = id;
                                }
                            })
                            .catch((error) => {
                                console.error("削除するメモを検索中にエラーが発生しました:", error);
                            });
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
                        const user = firebase.auth().currentUser;
                        if (!user) return;
                    
                        const db = firebase.firestore();
                        const batch = db.batch();
                        
                        const noteElements = notesList.querySelectorAll('li');
                        
                        noteElements.forEach((element, index) => {
                            const noteId = element.dataset.id;
                            const noteRef = db.collection('bloco').doc(noteId);
                            batch.update(noteRef, { ordem: index });
                        });
                    
                        batch.commit()
                            .catch((error) => {
                                console.error("メモの順序の更新中にエラーが発生しました:", error);
                            });
                    }
                    
                    function selectNote(id) {
                        const user = firebase.auth().currentUser;
                        if (!user) return;
                    
                        const db = firebase.firestore();
                        currentNoteId = id;
                        
                        db.collection('bloco').doc(id).get()
                            .then((doc) => {
                                if (doc.exists) {
                                    const note = doc.data();
                                    noteTitle.value = note.titulo || '';
                                    noteBody.innerHTML = note.conteudo || '';
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
                            })
                            .catch((error) => {
                                console.error("注意してください:", error);
                            });
                    }
                    
                    function saveNote() {
                        const user = firebase.auth().currentUser;
                        if (!user) return;
                    
                        const db = firebase.firestore();
                        const noteData = {
                            titulo: noteTitle.value,
                            conteudo: noteBody.innerHTML,
                            usuario: user.uid
                        };
                    
                        if (currentNoteId) {
                            db.collection('bloco').doc(currentNoteId).update(noteData)
                                .then(() => {
                                    loadNotes();
                                })
                                .catch((error) => {
                                    console.error("注記の保存中にエラーが発生しました:", error);
                                });
                        }
                    }

                    // Event listeners
                    noteTitle.addEventListener("input", debounce(saveNote, 500));
                    noteBody.addEventListener("blur", saveNote);
                    noteBody.addEventListener('paste', function(e) {
                        e.preventDefault();
                        let text = (e.originalEvent || e).clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                    });

                    function addNote() {
                        const db = firebase.firestore();

                        db.collection('bloco')
                            .where('usuario', '==', user.uid)
                            .orderBy('ordem', 'desc')
                            .limit(1)
                            .get()
                            .then((querySnapshot) => {
                                const maxOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().ordem + 1;
                                
                                return db.collection('bloco').add({
                                    titulo: "New note",
                                    conteudo: "",
                                    ordem: maxOrder,
                                    usuario: user.uid
                                });
                            })
                            .then((docRef) => {
                                currentNoteId = docRef.id;
                                loadNotes();
                                selectNote(docRef.id);
                            })
                    }

                    addNoteButton.addEventListener("click", addNote);

                    confirmDeleteButton.addEventListener("click", () => {
                        const db = firebase.firestore();
                        
                        db.collection('bloco').doc(currentNoteId).delete()
                            .then(() => {
                                currentNoteId = null;
                                deleteConfirmation.classList.add("hidden");
                                noteDetails.classList.add("hidden");
                                home.classList.remove("hidden");
                                loadNotes();
                            })
                    });

                    cancelDeleteButton.addEventListener("click", () => {
                        deleteConfirmation.classList.add("hidden");
                    });

                    // Função utilitária para debounce
                    function debounce(func, wait) {
                        let timeout;
                        return function executedFunction(...args) {
                            const later = () => {
                                clearTimeout(timeout);
                                func(...args);
                            };
                            clearTimeout(timeout);
                            timeout = setTimeout(later, wait);
                        };
                    }

                    // Menu de seleção
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
                        const url = prompt('リンクを挿入', 'https://');
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

                    // Menu lateral e fundo de popup
                    function toggleSidebar(){
                        document.getElementById("sidebar").classList.toggle('active');
                        overlaySidebar.classList.toggle('active');
                    }

                    // Dark mode
                    function applyDarkMode() {
                        const items = document.querySelectorAll('#sidebar ul li');
                        const botoes = document.querySelectorAll('.note-actions button');
                        const botaoDark = document.getElementById('dark-mode');
                        const h32 = document.getElementById('h3-2');
                        const sidebar = document.getElementById('sidebar');
                        const textEditor = document.getElementById('text-editor');
                        
                        document.body.classList.remove('light-mode');
                        document.body.classList.add('dark-mode');
                        textEditor.classList.remove('light-mode');
                        textEditor.classList.add('dark-mode');
                        noteBody.classList.remove('light-mode');
                        noteBody.classList.add('dark-mode');
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
                        const textEditor = document.getElementById('text-editor');
                        
                        document.body.classList.remove('dark-mode');
                        document.body.classList.add('light-mode');
                        textEditor.classList.remove('dark-mode');
                        textEditor.classList.add('light-mode');
                        noteBody.classList.remove('dark-mode');
                        noteBody.classList.add('light-mode');
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
                    
                    // Popup Config
                    function openConfig(){
                        userDocRef.get().then((doc) => {
                            if (doc.exists) {
                                const userData = doc.data();
                                nomeInput.value = userData.nome;
                            }
                        });
                        configPopup.classList.remove("hidden");
                    }

                    function closeConfigPop(){
                        configPopup.classList.add("hidden");
                    }

                    // Evento de submissão do formulário de nome
                    document.getElementById('nome-form').addEventListener('submit', (e) => {
                        e.preventDefault();
                        const novoNome = nomeInput.value.trim();
                        userDocRef.update({
                                nome: novoNome
                            }).then(() => {
                                document.getElementById('config-popup').classList.add('hidden');
                                userDocRef.get().then((doc) => {
                                    if (doc.exists) {
                                        const userData = doc.data();
                                        nome.textContent = userData.nome;
                                        alert('名前は正常に保存されました。')
                                    }
                                });
                            })
                    });

                    // Evento de submissão do formulário de e-mail
                    document.getElementById('email-form').addEventListener('submit', (e) => {
                        e.preventDefault();
                        const newEmail = emailInput.value.trim();
                        user.verifyBeforeUpdateEmail(newEmail)
                    .then(() => {
                        alert('確認メールが送信されました ' + newEmail);
                    })
                    .catch((error) => {
                        alert('メールアドレスを変更するには、ログアウトして再度ログインしてください。');
                    });
                    });

                    // Evento de envio de redefinição de senha
                    document.getElementById('botaoTrocarSenha').addEventListener('click', () => {
                        firebase.auth().sendPasswordResetEmail(user.email)
                        .then(() => {
                            alert('パスワードリセットメールが送信されました ' + user.email);
                        })
                        .catch((error) => {
                            alert('パスワード リセット メールの送信中にエラーが発生しました。メールが正しいことを確認して、もう一度お試しください。');
                        });
                    });

                    // Inicialização
                    applyStoredTheme();
                    loadNotes();
                    initializeSidebarSortable();
                    loadingMessage.style.display = "none";

                    document.getElementById('sair').addEventListener('click', function() {
                        firebase.auth().signOut();
                    });

                }
            });

        } else {
            // Se o usuário não estiver logado, redireciona para a página raiz
            window.location.href = '/ja';
        }
    });
});
