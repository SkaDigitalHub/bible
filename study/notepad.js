// notepad.js - Study Notepad Application
class StudyNotepad {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.currentNote = null;
        this.categories = ['bible-study', 'sermon', 'prayer', 'devotional', 'personal'];
        this.isRichTextMode = true;
        this.autoSaveInterval = null;
        
        // DOM elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            // Load saved data
            this.loadSavedData();
            
            // Initialize DOM elements
            this.initializeDOMElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup auto-save
            this.setupAutoSave();
            
            // Update UI
            this.updateUI();
            
            // Create first note if none exist
            if (this.notes.length === 0) {
                this.createNewNote();
            } else {
                this.loadNote(this.notes[0].id);
            }
            
            this.showToast('Study Notepad loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize Study Notepad:', error);
            this.showToast('Error loading notepad', 'error');
        }
    }
    
    initializeDOMElements() {
        // Side menu elements
        this.elements = {
            sideMenu: document.getElementById('sideMenu'),
            menuOverlay: document.getElementById('menuOverlay'),
            menuToggle: document.getElementById('menuToggle'),
            closeMenu: document.getElementById('closeMenu'),
            
            // Note management
            newNoteBtn: document.getElementById('new-note-btn'),
            importNotesBtn: document.getElementById('import-notes-btn'),
            exportNotesBtn: document.getElementById('export-notes-btn'),
            notesList: document.getElementById('notes-list'),
            notesSearch: document.getElementById('notes-search'),
            
            // Editor elements
            noteTitle: document.getElementById('note-title'),
            noteCategory: document.getElementById('note-category'),
            richTextEditor: document.getElementById('richTextEditor'),
            plainTextEditor: document.getElementById('plainTextEditor'),
            saveNoteBtn: document.getElementById('saveNoteBtn'),
            
            // Formatting
            formattingBtn: document.getElementById('formattingBtn'),
            boldBtn: document.getElementById('bold-btn'),
            italicBtn: document.getElementById('italic-btn'),
            underlineBtn: document.getElementById('underline-btn'),
            listBtn: document.getElementById('list-btn'),
            
            // Toolbar
            editorToolbar: document.getElementById('editorToolbar'),
            toolbarBtns: document.querySelectorAll('.toolbar-btn'),
            fontSizeSelect: document.querySelector('.font-size-select'),
            fontFamilySelect: document.querySelector('.font-family-select'),
            insertLinkBtn: document.getElementById('insertLinkBtn'),
            insertImageBtn: document.getElementById('insertImageBtn'),
            insertVerseBtn: document.getElementById('insertVerseBtn'),
            
            // Modals
            linkModal: document.getElementById('linkModal'),
            verseModal: document.getElementById('verseModal'),
            linkUrl: document.getElementById('link-url'),
            linkText: document.getElementById('link-text'),
            verseReference: document.getElementById('verse-reference'),
            verseText: document.getElementById('verse-text'),
            
            // Tags
            tagsInput: document.getElementById('tags-input'),
            tagsList: document.getElementById('tags-list'),
            
            // Stats
            currentNoteTitle: document.getElementById('current-note-title'),
            noteStats: document.getElementById('note-stats'),
            wordCount: document.getElementById('word-count'),
            charCount: document.getElementById('char-count'),
            noteCreated: document.getElementById('note-created'),
            noteModified: document.getElementById('note-modified'),
            totalNotes: document.getElementById('total-notes'),
            storageProgress: document.getElementById('storage-progress'),
            storageUsed: document.getElementById('storage-used'),
            autoSaveStatus: document.getElementById('auto-save-status'),
            
            // Settings
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            autoSaveToggle: document.getElementById('auto-save-toggle'),
            spellCheckToggle: document.getElementById('spell-check-toggle'),
            richTextToggle: document.getElementById('rich-text-toggle'),
            themeToggle: document.getElementById('themeToggle'),
            
            // Actions
            printNoteBtn: document.getElementById('printNoteBtn'),
            shareNoteBtn: document.getElementById('share-note-btn'),
            duplicateNoteBtn: document.getElementById('duplicate-note-btn'),
            exportNoteBtn: document.getElementById('export-note-btn'),
            prevNoteBtn: document.getElementById('prev-note-btn'),
            nextNoteBtn: document.getElementById('next-note-btn'),
            
            // Categories
            categoryTags: document.querySelectorAll('.category-tag'),
            newCategory: document.getElementById('new-category'),
            addCategoryBtn: document.getElementById('add-category-btn'),
            
            // Backup
            backupNotesBtn: document.getElementById('backup-notes-btn'),
            restoreNotesBtn: document.getElementById('restore-notes-btn'),
            clearAllNotesBtn: document.getElementById('clear-all-notes-btn'),
            
            // Toast
            toast: document.getElementById('toast')
        };
    }
    
    setupEventListeners() {
        // Side menu
        this.elements.menuToggle.addEventListener('click', () => this.openSideMenu());
        this.elements.closeMenu.addEventListener('click', () => this.closeSideMenu());
        this.elements.menuOverlay.addEventListener('click', () => this.closeSideMenu());
        
        // Note management
        this.elements.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.elements.importNotesBtn.addEventListener('click', () => this.importNotes());
        this.elements.exportNotesBtn.addEventListener('click', () => this.exportAllNotes());
        this.elements.saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        
        // Editor input events
        this.elements.noteTitle.addEventListener('input', () => this.updateNoteTitle());
        this.elements.noteCategory.addEventListener('change', () => this.updateNoteCategory());
        this.elements.richTextEditor.addEventListener('input', () => this.updateNoteContent());
        this.elements.plainTextEditor.addEventListener('input', () => this.updateNoteContent());
        
        // Search
        this.elements.notesSearch.addEventListener('input', (e) => this.filterNotes(e.target.value));
        
        // Formatting buttons
        this.elements.boldBtn.addEventListener('click', () => this.formatText('bold'));
        this.elements.italicBtn.addEventListener('click', () => this.formatText('italic'));
        this.elements.underlineBtn.addEventListener('click', () => this.formatText('underline'));
        this.elements.listBtn.addEventListener('click', () => this.formatText('insertUnorderedList'));
        
        // Toolbar buttons
        this.elements.toolbarBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.closest('button').dataset.command;
                this.executeCommand(command);
            });
        });
        
        // Font controls
        this.elements.fontSizeSelect.addEventListener('change', (e) => {
            this.executeCommand('fontSize', e.target.value);
        });
        
        this.elements.fontFamilySelect.addEventListener('change', (e) => {
            this.executeCommand('fontName', e.target.value);
        });
        
        // Modals
        this.elements.insertLinkBtn.addEventListener('click', () => this.openLinkModal());
        this.elements.insertVerseBtn.addEventListener('click', () => this.openVerseModal());
        
        document.getElementById('insert-link-btn').addEventListener('click', () => this.insertLink());
        document.getElementById('insert-verse-btn').addEventListener('click', () => this.insertVerse());
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Tags
        this.elements.tagsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.elements.tagsInput.value.trim()) {
                this.addTag(this.elements.tagsInput.value.trim());
                this.elements.tagsInput.value = '';
            }
        });
        
        // Settings
        this.elements.darkModeToggle.addEventListener('change', (e) => {
            this.setTheme(e.target.checked ? 'dark' : 'light');
        });
        
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        this.elements.autoSaveToggle.addEventListener('change', (e) => {
            this.toggleAutoSave(e.target.checked);
        });
        
        this.elements.richTextToggle.addEventListener('change', (e) => {
            this.toggleEditorMode(e.target.checked);
        });
        
        // Note navigation
        this.elements.prevNoteBtn.addEventListener('click', () => this.navigateToPrevNote());
        this.elements.nextNoteBtn.addEventListener('click', () => this.navigateToNextNote());
        
        // Actions
        this.elements.printNoteBtn.addEventListener('click', () => this.printNote());
        this.elements.shareNoteBtn.addEventListener('click', () => this.shareNote());
        this.elements.duplicateNoteBtn.addEventListener('click', () => this.duplicateNote());
        this.elements.exportNoteBtn.addEventListener('click', () => this.exportCurrentNote());
        
        // Categories
        this.elements.categoryTags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
                
                // Update active state
                this.elements.categoryTags.forEach(t => 
                    t.classList.toggle('active', t === e.target)
                );
            });
        });
        
        this.elements.addCategoryBtn.addEventListener('click', () => this.addNewCategory());
        
        // Backup
        this.elements.backupNotesBtn.addEventListener('click', () => this.backupNotes());
        this.elements.restoreNotesBtn.addEventListener('click', () => this.restoreNotes());
        this.elements.clearAllNotesBtn.addEventListener('click', () => this.clearAllNotes());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Save: Ctrl+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            }
            
            // New note: Ctrl+N
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewNote();
            }
            
            // Bold: Ctrl+B
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.formatText('bold');
            }
            
            // Italic: Ctrl+I
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.formatText('italic');
            }
            
            // Underline: Ctrl+U
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                this.formatText('underline');
            }
            
            // Escape: Close modals and side menu
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeSideMenu();
            }
        });
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => this.saveCurrentNote());
    }
    
    // Note Management
    createNewNote() {
        const noteId = Date.now().toString();
        const newNote = {
            id: noteId,
            title: 'Untitled Note',
            content: '<p>Start typing your notes here...</p>',
            category: 'bible-study',
            tags: [],
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            wordCount: 0,
            charCount: 0
        };
        
        this.notes.unshift(newNote);
        this.currentNoteId = noteId;
        this.currentNote = newNote;
        
        this.saveNotes();
        this.updateNotesList();
        this.loadNote(noteId);
        
        this.showToast('New note created', 'success');
    }
    
    loadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        this.currentNoteId = noteId;
        this.currentNote = note;
        
        // Update form fields
        this.elements.noteTitle.value = note.title;
        this.elements.noteCategory.value = note.category;
        
        // Update editor content
        if (this.isRichTextMode) {
            this.elements.richTextEditor.innerHTML = note.content || '<p>Start typing...</p>';
            this.elements.richTextEditor.style.display = 'block';
            this.elements.plainTextEditor.style.display = 'none';
        } else {
            this.elements.plainTextEditor.value = this.stripHtml(note.content);
            this.elements.plainTextEditor.style.display = 'block';
            this.elements.richTextEditor.style.display = 'none';
        }
        
        // Update tags
        this.updateTagsList(note.tags);
        
        // Update stats
        this.updateNoteStats();
        this.updateHeaderInfo();
        
        // Update notes list selection
        this.updateNotesListSelection();
    }
    
    saveCurrentNote() {
        if (!this.currentNote) return;
        
        const title = this.elements.noteTitle.value.trim() || 'Untitled Note';
        let content = '';
        
        if (this.isRichTextMode) {
            content = this.elements.richTextEditor.innerHTML;
        } else {
            content = this.elements.plainTextEditor.value;
            // Convert plain text to HTML for storage
            content = content.replace(/\n/g, '<br>');
        }
        
        // Update note
        this.currentNote.title = title;
        this.currentNote.content = content;
        this.currentNote.modified = new Date().toISOString();
        
        // Update word and character counts
        const text = this.stripHtml(content);
        this.currentNote.wordCount = this.countWords(text);
        this.currentNote.charCount = text.length;
        
        // Save to storage
        this.saveNotes();
        
        // Update UI
        this.updateNotesList();
        this.updateNoteStats();
        this.updateHeaderInfo();
        
        this.showToast('Note saved', 'success');
    }
    
    updateNoteTitle() {
        if (this.currentNote) {
            this.currentNote.title = this.elements.noteTitle.value.trim() || 'Untitled Note';
            this.updateHeaderInfo();
            this.updateNotesList();
        }
    }
    
    updateNoteCategory() {
        if (this.currentNote) {
            this.currentNote.category = this.elements.noteCategory.value;
        }
    }
    
    updateNoteContent() {
        // Update stats in real-time
        this.updateNoteStats();
    }
    
    // Editor Functions
    formatText(command) {
        if (this.isRichTextMode) {
            document.execCommand(command, false, null);
            this.elements.richTextEditor.focus();
        }
    }
    
    executeCommand(command, value = null) {
        if (this.isRichTextMode) {
            document.execCommand(command, false, value);
            this.elements.richTextEditor.focus();
        }
    }
    
    toggleEditorMode(useRichText) {
        this.isRichTextMode = useRichText;
        
        if (this.currentNote) {
            if (useRichText) {
                // Convert plain text to HTML
                const plainText = this.elements.plainTextEditor.value;
                this.elements.richTextEditor.innerHTML = plainText.replace(/\n/g, '<br>');
                this.elements.richTextEditor.style.display = 'block';
                this.elements.plainTextEditor.style.display = 'none';
            } else {
                // Convert HTML to plain text
                const html = this.elements.richTextEditor.innerHTML;
                this.elements.plainTextEditor.value = this.stripHtml(html);
                this.elements.plainTextEditor.style.display = 'block';
                this.elements.richTextEditor.style.display = 'none';
            }
        }
        
        // Show/hide toolbar
        this.elements.editorToolbar.style.display = useRichText ? 'flex' : 'none';
        
        this.showToast(`Switched to ${useRichText ? 'Rich Text' : 'Plain Text'} editor`, 'info');
    }
    
    // Modals
    openLinkModal() {
        this.elements.linkModal.classList.add('active');
        this.elements.linkUrl.value = '';
        this.elements.linkText.value = '';
        this.elements.linkUrl.focus();
    }
    
    openVerseModal() {
        this.elements.verseModal.classList.add('active');
        this.elements.verseReference.value = '';
        this.elements.verseText.value = '';
        this.elements.verseReference.focus();
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    insertLink() {
        const url = this.elements.linkUrl.value.trim();
        const text = this.elements.linkText.value.trim() || url;
        
        if (url) {
            if (this.isRichTextMode) {
                document.execCommand('createLink', false, url);
                // Update link text if provided
                if (text !== url) {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(document.createTextNode(text));
                    }
                }
            } else {
                const linkMarkdown = `[${text}](${url})`;
                this.insertAtCursor(linkMarkdown);
            }
            
            this.closeAllModals();
            this.showToast('Link inserted', 'success');
        }
    }
    
    insertVerse() {
        const reference = this.elements.verseReference.value.trim();
        const text = this.elements.verseText.value.trim();
        
        if (reference) {
            let verseHtml = '';
            
            if (this.isRichTextMode) {
                verseHtml = `<div class="bible-verse">
                    <div class="verse-reference">${reference}</div>
                    ${text ? `<div class="verse-text">${text}</div>` : ''}
                </div>`;
                
                document.execCommand('insertHTML', false, verseHtml);
            } else {
                const verseText = text ? `${reference}\n${text}` : reference;
                this.insertAtCursor(verseText);
            }
            
            this.closeAllModals();
            this.showToast('Verse inserted', 'success');
        }
    }
    
    // Tags
    addTag(tag) {
        if (!this.currentNote) return;
        
        if (!this.currentNote.tags.includes(tag)) {
            this.currentNote.tags.push(tag);
            this.updateTagsList(this.currentNote.tags);
            this.saveNotes();
        }
    }
    
    removeTag(tag) {
        if (!this.currentNote) return;
        
        this.currentNote.tags = this.currentNote.tags.filter(t => t !== tag);
        this.updateTagsList(this.currentNote.tags);
        this.saveNotes();
    }
    
    updateTagsList(tags) {
        this.elements.tagsList.innerHTML = '';
        
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <button class="remove-tag" data-tag="${tag}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            tagElement.querySelector('.remove-tag').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTag(tag);
            });
            
            this.elements.tagsList.appendChild(tagElement);
        });
    }
    
    // UI Updates
        updateNotesList() {
        if (!this.elements.notesList) return;
        
        const searchTerm = this.elements.notesSearch ? this.elements.notesSearch.value.toLowerCase() : '';
        
        // Filter notes based on search
        const filteredNotes = this.notes.filter(note => {
            const matchesSearch = searchTerm === '' || 
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            return matchesSearch;
        });
        
        // Clear notes list
        this.elements.notesList.innerHTML = '';
        
        if (filteredNotes.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No notes found';
            this.elements.notesList.appendChild(emptyState);
            return;
        }
        
        // Add notes to list
        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            if (this.currentNoteId === note.id) {
                noteElement.classList.add('active');
            }
            
            // Format date
            const modifiedDate = new Date(note.modified);
            const dateStr = modifiedDate.toLocaleDateString();
            
            // Get category label
            const categoryLabels = {
                'bible-study': 'Bible Study',
                'sermon': 'Sermon',
                'prayer': 'Prayer',
                'devotional': 'Devotional',
                'personal': 'Personal'
            };
            
            noteElement.innerHTML = `
                <div class="note-item-content">
                    <div class="note-item-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-item-meta">
                        <span class="note-category-badge ${note.category}">
                            ${categoryLabels[note.category] || note.category}
                        </span>
                        <span class="note-date">${dateStr}</span>
                    </div>
                    <div class="note-item-preview">
                        ${this.stripHtml(note.content).substring(0, 60)}...
                    </div>
                </div>
                <button class="delete-note-btn" data-id="${note.id}" title="Delete note">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Add click event to load note
            noteElement.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-note-btn')) {
                    this.loadNote(note.id);
                    this.closeSideMenu();
                }
            });
            
            // Add delete button event
            const deleteBtn = noteElement.querySelector('.delete-note-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(note.id);
            });
            
            this.elements.notesList.appendChild(noteElement);
        });
        
        // Update total notes count
        this.updateStats();
    }
    
    updateNotesListSelection() {
        document.querySelectorAll('.note-item').forEach(item => {
            const noteId = item.querySelector('.delete-note-btn')?.dataset.id;
            item.classList.toggle('active', noteId === this.currentNoteId);
        });
    }
    
    updateNoteStats() {
        if (!this.currentNote) return;
        
        let text = '';
        if (this.isRichTextMode) {
            text = this.stripHtml(this.elements.richTextEditor.innerHTML);
        } else {
            text = this.elements.plainTextEditor.value;
        }
        
        const wordCount = this.countWords(text);
        const charCount = text.length;
        
        // Update stats displays
        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = `${wordCount} words`;
        }
        
        if (this.elements.charCount) {
            this.elements.charCount.textContent = `${charCount} characters`;
        }
        
        if (this.elements.noteStats) {
            this.elements.noteStats.textContent = `${wordCount} words • ${charCount} characters`;
        }
        
        // Update note in memory
        if (this.currentNote) {
            this.currentNote.wordCount = wordCount;
            this.currentNote.charCount = charCount;
        }
    }
    
    updateHeaderInfo() {
        if (!this.currentNote) return;
        
        if (this.elements.currentNoteTitle) {
            this.elements.currentNoteTitle.textContent = this.currentNote.title;
        }
        
        if (this.elements.noteCreated && this.currentNote.created) {
            const createdDate = new Date(this.currentNote.created);
            this.elements.noteCreated.textContent = `Created: ${createdDate.toLocaleString()}`;
        }
        
        if (this.elements.noteModified && this.currentNote.modified) {
            const modifiedDate = new Date(this.currentNote.modified);
            this.elements.noteModified.textContent = `Modified: ${modifiedDate.toLocaleString()}`;
        }
    }
    
    updateStats() {
        // Update total notes count
        if (this.elements.totalNotes) {
            this.elements.totalNotes.textContent = `${this.notes.length} ${this.notes.length === 1 ? 'note' : 'notes'}`;
        }
        
        // Update storage usage
        const notesData = JSON.stringify(this.notes);
        const storageSize = new Blob([notesData]).size;
        const maxStorage = 5 * 1024 * 1024; // 5MB
        const usagePercent = Math.min(100, (storageSize / maxStorage) * 100);
        
        if (this.elements.storageProgress) {
            this.elements.storageProgress.style.width = `${usagePercent}%`;
        }
        
        if (this.elements.storageUsed) {
            this.elements.storageUsed.textContent = `${Math.round(usagePercent)}% storage used`;
        }
    }
    
    // Navigation
    navigateToPrevNote() {
        if (!this.currentNoteId || this.notes.length <= 1) return;
        
        const currentIndex = this.notes.findIndex(note => note.id === this.currentNoteId);
        const prevIndex = (currentIndex - 1 + this.notes.length) % this.notes.length;
        
        this.loadNote(this.notes[prevIndex].id);
        this.showToast('Previous note loaded', 'info');
    }
    
    navigateToNextNote() {
        if (!this.currentNoteId || this.notes.length <= 1) return;
        
        const currentIndex = this.notes.findIndex(note => note.id === this.currentNoteId);
        const nextIndex = (currentIndex + 1) % this.notes.length;
        
        this.loadNote(this.notes[nextIndex].id);
        this.showToast('Next note loaded', 'info');
    }
    
    // Note Actions
    deleteNote(noteId) {
        if (this.notes.length <= 1) {
            this.showToast('Cannot delete the only note', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            const noteIndex = this.notes.findIndex(note => note.id === noteId);
            
            if (noteIndex !== -1) {
                // If deleting current note, load another one
                if (noteId === this.currentNoteId) {
                    const newIndex = noteIndex === 0 ? 1 : noteIndex - 1;
                    this.loadNote(this.notes[newIndex].id);
                }
                
                // Remove the note
                this.notes.splice(noteIndex, 1);
                this.saveNotes();
                this.updateNotesList();
                this.updateStats();
                
                this.showToast('Note deleted', 'success');
            }
        }
    }
    
    duplicateNote() {
        if (!this.currentNote) return;
        
        const noteId = Date.now().toString();
        const duplicatedNote = {
            ...this.currentNote,
            id: noteId,
            title: `${this.currentNote.title} (Copy)`,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        this.notes.unshift(duplicatedNote);
        this.currentNoteId = noteId;
        this.currentNote = duplicatedNote;
        
        this.saveNotes();
        this.updateNotesList();
        this.loadNote(noteId);
        
        this.showToast('Note duplicated', 'success');
    }
    
    exportCurrentNote() {
        if (!this.currentNote) return;
        
        const noteData = {
            ...this.currentNote,
            exported: new Date().toISOString(),
            app: "Ska Study Notepad"
        };
        
        const dataStr = JSON.stringify(noteData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Note exported successfully', 'success');
    }
    
    exportAllNotes() {
        if (this.notes.length === 0) {
            this.showToast('No notes to export', 'error');
            return;
        }
        
        const exportData = {
            notes: this.notes,
            exported: new Date().toISOString(),
            app: "Ska Study Notepad",
            version: "1.0"
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `study_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast(`Exported ${this.notes.length} notes`, 'success');
    }
    
    importNotes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importData = JSON.parse(event.target.result);
                    let importedNotes = [];
                    
                    // Handle different import formats
                    if (Array.isArray(importData)) {
                        // Array of notes
                        importedNotes = importData;
                    } else if (importData.notes && Array.isArray(importData.notes)) {
                        // Full backup format
                        importedNotes = importData.notes;
                    } else if (importData.id && importData.title) {
                        // Single note
                        importedNotes = [importData];
                    }
                    
                    // Validate and import notes
                    let count = 0;
                    importedNotes.forEach(note => {
                        if (note.title && note.content !== undefined) {
                            const newNote = {
                                id: Date.now().toString() + count,
                                title: note.title,
                                content: note.content || '',
                                category: note.category || 'bible-study',
                                tags: note.tags || [],
                                created: note.created || new Date().toISOString(),
                                modified: new Date().toISOString(),
                                wordCount: note.wordCount || 0,
                                charCount: note.charCount || 0
                            };
                            
                            this.notes.unshift(newNote);
                            count++;
                        }
                    });
                    
                    if (count > 0) {
                        this.saveNotes();
                        this.updateNotesList();
                        this.updateStats();
                        this.showToast(`Imported ${count} notes successfully`, 'success');
                    } else {
                        this.showToast('No valid notes found in file', 'error');
                    }
                    
                } catch (error) {
                    console.error('Import error:', error);
                    this.showToast('Failed to import notes. Invalid file format.', 'error');
                }
            };
            
            reader.readAsText(file);
        });
        
        input.click();
    }
    
    // Categories
    filterByCategory(category) {
        const categoryLabels = {
            'all': 'All Notes',
            'bible-study': 'Bible Study',
            'sermon': 'Sermon Notes',
            'prayer': 'Prayer',
            'devotional': 'Devotional',
            'personal': 'Personal'
        };
        
        // Update notes list based on category
        this.updateNotesList();
        
        if (category !== 'all') {
            // Filter notes in UI
            document.querySelectorAll('.note-item').forEach(item => {
                const categoryBadge = item.querySelector('.note-category-badge');
                const isVisible = !categoryBadge || categoryBadge.classList.contains(category);
                item.style.display = isVisible ? 'flex' : 'none';
            });
        }
    }
    
    addNewCategory() {
        const newCategory = this.elements.newCategory.value.trim().toLowerCase();
        
        if (newCategory && !this.categories.includes(newCategory)) {
            this.categories.push(newCategory);
            
            // Add to UI
            const tagElement = document.createElement('button');
            tagElement.className = 'category-tag';
            tagElement.dataset.category = newCategory;
            tagElement.textContent = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);
            
            tagElement.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
                
                // Update active state
                document.querySelectorAll('.category-tag').forEach(t => 
                    t.classList.toggle('active', t === e.target)
                );
            });
            
            // Insert before the add category input
            const categoriesContainer = document.querySelector('.category-tags');
            categoriesContainer.appendChild(tagElement);
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = newCategory;
            option.textContent = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);
            this.elements.noteCategory.appendChild(option);
            
            // Clear input
            this.elements.newCategory.value = '';
            
            this.showToast(`Category "${newCategory}" added`, 'success');
        }
    }
    
    // Settings
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('notepad-theme', theme);
        
        // Update toggle state
        if (this.elements.darkModeToggle) {
            this.elements.darkModeToggle.checked = theme === 'dark';
        }
        
        // Update theme toggle icon
        const themeIcon = this.elements.themeToggle?.querySelector('i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    toggleAutoSave(enabled) {
        if (enabled) {
            this.setupAutoSave();
            this.elements.autoSaveStatus.innerHTML = '<i class="fas fa-sync-alt"></i> Auto-save: <span>Enabled</span>';
            this.showToast('Auto-save enabled', 'success');
        } else {
            this.clearAutoSave();
            this.elements.autoSaveStatus.innerHTML = '<i class="fas fa-sync-alt"></i> Auto-save: <span>Disabled</span>';
            this.showToast('Auto-save disabled', 'warning');
        }
    }
    
    setupAutoSave() {
        this.clearAutoSave();
        this.autoSaveInterval = setInterval(() => {
            if (this.currentNote) {
                this.saveCurrentNote();
            }
        }, 30000); // Save every 30 seconds
    }
    
    clearAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    // Backup & Restore
    backupNotes() {
        const backupData = {
            notes: this.notes,
            categories: this.categories,
            settings: {
                theme: document.body.getAttribute('data-theme') || 'light',
                autoSave: this.elements.autoSaveToggle?.checked || true,
                richText: this.isRichTextMode
            },
            backupDate: new Date().toISOString(),
            app: "Ska Study Notepad"
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        localStorage.setItem('notepad-backup', dataStr);
        
        this.showToast('Backup created successfully', 'success');
    }
    
    restoreNotes() {
        const backupData = localStorage.getItem('notepad-backup');
        
        if (!backupData) {
            this.showToast('No backup found', 'error');
            return;
        }
        
        if (confirm('Restore from backup? This will replace all current notes.')) {
            try {
                const backup = JSON.parse(backupData);
                
                // Restore notes
                if (backup.notes && Array.isArray(backup.notes)) {
                    this.notes = backup.notes;
                }
                
                // Restore categories
                if (backup.categories && Array.isArray(backup.categories)) {
                    this.categories = backup.categories;
                }
                
                // Restore settings
                if (backup.settings) {
                    if (backup.settings.theme) {
                        this.setTheme(backup.settings.theme);
                    }
                    
                    if (this.elements.autoSaveToggle) {
                        this.elements.autoSaveToggle.checked = backup.settings.autoSave !== false;
                        this.toggleAutoSave(backup.settings.autoSave !== false);
                    }
                    
                    if (this.elements.richTextToggle) {
                        this.elements.richTextToggle.checked = backup.settings.richText !== false;
                        this.toggleEditorMode(backup.settings.richText !== false);
                    }
                }
                
                this.saveNotes();
                this.updateUI();
                
                if (this.notes.length > 0) {
                    this.loadNote(this.notes[0].id);
                } else {
                    this.createNewNote();
                }
                
                this.showToast('Backup restored successfully', 'success');
                
            } catch (error) {
                console.error('Restore error:', error);
                this.showToast('Failed to restore backup', 'error');
            }
        }
    }
    
    clearAllNotes() {
        if (this.notes.length === 0) {
            this.showToast('No notes to clear', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) {
            this.notes = [];
            this.currentNoteId = null;
            this.currentNote = null;
            
            this.saveNotes();
            this.updateUI();
            this.createNewNote();
            
            this.showToast('All notes cleared', 'success');
        }
    }
    
    // UI Controls
    openSideMenu() {
        this.elements.sideMenu.classList.add('active');
        this.elements.menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeSideMenu() {
        this.elements.sideMenu.classList.remove('active');
        this.elements.menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    printNote() {
        if (!this.currentNote) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>${this.currentNote.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    .note-meta { color: #666; margin-bottom: 20px; }
                    .note-content { margin-top: 20px; }
                    .bible-verse { background: #f8f9fa; padding: 10px; border-left: 4px solid #3498db; margin: 10px 0; }
                    .verse-reference { font-weight: bold; color: #2c3e50; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>${this.escapeHtml(this.currentNote.title)}</h1>
                <div class="note-meta">
                    Category: ${this.currentNote.category}<br>
                    Created: ${new Date(this.currentNote.created).toLocaleString()}<br>
                    Modified: ${new Date(this.currentNote.modified).toLocaleString()}<br>
                    Tags: ${this.currentNote.tags.join(', ')}
                </div>
                <div class="note-content">
                    ${this.currentNote.content}
                </div>
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    shareNote() {
        if (!this.currentNote) return;
        
        const noteData = {
            title: this.currentNote.title,
            content: this.stripHtml(this.currentNote.content),
            url: window.location.href,
            app: "Ska Study Notepad"
        };
        
        const text = `${noteData.title}\n\n${noteData.content.substring(0, 200)}...\n\nShared from Ska Study Notepad`;
        
        if (navigator.share) {
            navigator.share({
                title: noteData.title,
                text: text,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Note copied to clipboard', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            this.showToast('Failed to copy to clipboard', 'error');
        });
    }
    
    // Utility Functions
    stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    insertAtCursor(text) {
        if (this.isRichTextMode) {
            document.execCommand('insertText', false, text);
        } else {
            const textarea = this.elements.plainTextEditor;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            textarea.value = textarea.value.substring(0, start) + 
                           text + 
                           textarea.value.substring(end);
            
            // Move cursor to after inserted text
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
            
            this.updateNoteContent();
        }
    }
    
    // Storage
    loadSavedData() {
        try {
            // Load notes
            const savedNotes = localStorage.getItem('study-notes');
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes);
            }
            
            // Load settings
            const savedTheme = localStorage.getItem('notepad-theme');
            if (savedTheme) {
                this.setTheme(savedTheme);
            }
            
            // Load categories
            const savedCategories = localStorage.getItem('notepad-categories');
            if (savedCategories) {
                this.categories = JSON.parse(savedCategories);
            }
            
        } catch (error) {
            console.error('Error loading saved data:', error);
            this.notes = [];
        }
    }
    
    saveNotes() {
        try {
            localStorage.setItem('study-notes', JSON.stringify(this.notes));
            localStorage.setItem('notepad-categories', JSON.stringify(this.categories));
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showToast('Error saving notes', 'error');
        }
    }
    
    // Toast Notifications
    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = 'toast show';
        toast.classList.add(type);
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Final UI Update
    updateUI() {
        this.updateNotesList();
        this.updateStats();
        this.updateHeaderInfo();
        
        // Set initial theme
        if (!document.body.getAttribute('data-theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
        
        // Set initial auto-save state
        if (this.elements.autoSaveToggle) {
            this.toggleAutoSave(this.elements.autoSaveToggle.checked);
        }
        
        // Set initial editor mode
        if (this.elements.richTextToggle) {
            this.toggleEditorMode(this.elements.richTextToggle.checked);
        }
    }
    
    filterNotes(searchTerm) {
        this.updateNotesList();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studyNotepad = new StudyNotepad();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}