// Enhanced Bible Web App with Multiple Features
// Includes: Multiple translations, dark mode, bookmarks, search, sharing, progress tracking
// NEW: Verse-level bookmarking and clickable bookmarks

const fonts = {
    'serif': "'Times New Roman', serif",
    'sans-serif': "'Segoe UI', sans-serif",
    'modern': "'Inter', sans-serif",
    'traditional': "'Merriweather', serif"
};

class BibleApp {
    constructor() {
        // App state
        this.bibleData = null;
        this.currentBookIndex = 0;
        this.currentChapterIndex = 0;
        this.currentBook = null;
        this.currentTranslation = 'kjv';
        this.highlightedVerses = new Set();
        this.bookmarkedChapters = new Set();
        this.readChapters = new Set();
        
        // NEW: Verse bookmarks
        this.bookmarkedVerses = new Set();
        this.currentVerseIndex = 0;
        
        // Translation URLs
        this.translationUrls = {
            'kjv': 'https://skadigitalhub.github.io/NKJVBible/bible-kjv.json',
            'bbe': 'https://skadigitalhub.github.io/NKJVBible/bbe.json',
            'amp': 'https://skadigitalhub.github.io/NKJVBible/amp.json',
            'nlt': 'https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/refs/heads/master/asv.json'
        };
        
        // Translation names
        this.translationNames = {
            'kjv': 'KJV - King James Version',
            'bbe': 'BBE - Bible in Basic English',
            'amp': 'AMP - Amplified Bible',
            'nlt': 'NLT - New Living Translation'
        };
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            // Load saved state
            this.loadSavedState();
            
            // Initialize DOM elements
            this.initializeDOMElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial Bible data
            await this.loadBibleData();
            
            // Initialize UI
            this.updateUI();
            
            this.showToast('Bible App loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize Bible App:', error);
            this.showToast('Error loading Bible data', 'error');
        }
    }
    
    initializeDOMElements() {
        // Core elements
        this.bookSelect = document.getElementById('book-select');
        this.chapterSelect = document.getElementById('chapter-select');
        this.textDisplay = document.getElementById('text-display');
        this.currentBookElement = document.getElementById('current-book');
        this.currentChapterElement = document.getElementById('current-chapter');
        this.verseCountElement = document.getElementById('verse-count');
        
        // Side menu elements
        this.sideMenu = document.getElementById('sideMenu');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeMenu = document.getElementById('closeMenu');
        this.translationSelect = document.getElementById('translation-select');
        
        // Search elements
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.searchResults = document.getElementById('search-results');
        
        // Bookmark elements
        this.bookmarkBtn = document.getElementById('bookmarkBtn');
        
        // NEW: Enhanced bookmark elements
        this.bookmarkTabs = document.querySelectorAll('.bookmark-tab');
        this.chapterBookmarksList = document.getElementById('chapter-bookmarks');
        this.verseBookmarksList = document.getElementById('verse-bookmarks');
        this.addCurrentVerseBtn = document.getElementById('add-current-verse');
        
        // Progress elements
        this.chaptersReadElement = document.getElementById('chapters-read');
        this.booksStartedElement = document.getElementById('books-started');
        this.clearProgressBtn = document.getElementById('clear-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressBarText = document.getElementById('progress-bar-text');
        this.totalStatsElement = document.getElementById('total-stats');
        
        // Settings elements
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.autoSaveToggle = document.getElementById('auto-save-toggle');
        this.verseNumbersToggle = document.getElementById('verse-numbers-toggle');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Sharing elements
        this.shareBtn = document.getElementById('shareBtn');
        this.shareModal = document.getElementById('shareModal');
        this.copyVerseBtn = document.getElementById('copyVerseBtn');
        this.copyChapterBtn = document.getElementById('copyChapterBtn');
        this.shareNativeBtn = document.getElementById('shareNativeBtn');
        this.shareTwitterBtn = document.getElementById('shareTwitterBtn');
        this.shareText = document.getElementById('share-text');
        this.copyTextBtn = document.getElementById('copy-text-btn');
        
        // Navigation elements
        this.prevButtons = document.querySelectorAll('#prev-chapter, #prev-bottom');
        this.nextButtons = document.querySelectorAll('#next-chapter, #next-bottom');
        
        // Header elements
        this.currentTranslationElement = document.getElementById('current-translation');
        this.currentBookHeader = document.getElementById('current-book-header');
        this.currentChapterHeader = document.getElementById('current-chapter-header');
        
        // Toast
        this.toast = document.getElementById('toast');
    }
    
    async loadBibleData() {
        try {
            const url = this.translationUrls[this.currentTranslation];
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            this.bibleData = await response.json();
            this.currentBook = this.bibleData[this.currentBookIndex];
            
            // Mark chapter as read
            this.markChapterAsRead();
            
        } catch (error) {
            console.error('Error loading Bible data:', error);
            throw error;
        }
    }
    
    updateUI() {
        this.populateBookDropdown();
        this.populateChapterDropdown();
        this.loadCurrentChapter();
        this.updateCurrentLocationDisplay();
        this.updateBookmarksUI(); // UPDATED: Changed from updateBookmarksList
        this.updateProgress();
        this.applyTheme();
        this.updateTranslationDisplay();
    }
    
    populateBookDropdown() {
        if (!this.bibleData) return;
        
        this.bookSelect.innerHTML = '';
        
        this.bibleData.forEach((book, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = book.name;
            if (index === this.currentBookIndex) {
                option.selected = true;
            }
            this.bookSelect.appendChild(option);
        });
    }
    
    populateChapterDropdown() {
        if (!this.currentBook) return;
        
        this.chapterSelect.innerHTML = '';
        const chapterCount = this.currentBook.chapters.length;
        
        for (let i = 0; i < chapterCount; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Chapter ${i + 1}`;
            if (i === this.currentChapterIndex) {
                option.selected = true;
            }
            this.chapterSelect.appendChild(option);
        }
        
        this.chapterSelect.disabled = chapterCount === 0;
    }
    
    loadCurrentChapter() {
        if (!this.currentBook) return;
        
        const chapter = this.currentBook.chapters[this.currentChapterIndex];
        
        if (!chapter || chapter.length === 0) {
            this.textDisplay.innerHTML = '<p class="empty-state">No text available for this chapter.</p>';
            return;
        }
        
        this.textDisplay.innerHTML = '';
        
        const showVerseNumbers = this.verseNumbersToggle?.checked ?? true;
        
        chapter.forEach((verseText, verseIndex) => {
            const verseElement = this.createVerseElement(verseIndex + 1, verseText, showVerseNumbers);
            this.textDisplay.appendChild(verseElement);
        });
        
        this.populateChapterDropdown();
        this.updateCurrentLocationDisplay();
        this.updateNavigationButtons();
        this.markChapterAsRead();
    }
    
    createVerseElement(verseNumber, verseText, showVerseNumbers) {
        const verseElement = document.createElement('div');
        verseElement.className = 'verse';
        verseElement.dataset.verseNumber = verseNumber;
        
        // Check if verse is highlighted or bookmarked
        const verseKey = this.getVerseKey(verseNumber);
        if (this.highlightedVerses.has(verseKey)) {
            verseElement.classList.add('highlighted');
        }
        if (this.bookmarkedVerses.has(verseKey)) {
            verseElement.classList.add('bookmarked');
        }
        
        // Verse number
        if (showVerseNumbers) {
            const verseNum = document.createElement('div');
            verseNum.className = 'verse-num';
            verseNum.textContent = verseNumber;
            verseElement.appendChild(verseNum);
        }
        
        // Verse text
        const textDiv = document.createElement('div');
        textDiv.className = 'verse-text';
        textDiv.textContent = verseText;
        verseElement.appendChild(textDiv);
        
        // Verse actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'verse-actions';
        
        // Highlight button
        const highlightBtn = document.createElement('button');
        highlightBtn.className = 'verse-action-btn';
        highlightBtn.innerHTML = '<i class="fas fa-highlighter"></i>';
        highlightBtn.title = 'Highlight verse';
        highlightBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleHighlightVerse(verseNumber);
        };
        actionsDiv.appendChild(highlightBtn);
        
        // NEW: Verse bookmark button
        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = 'verse-action-btn';
        bookmarkBtn.innerHTML = this.bookmarkedVerses.has(verseKey) ? 
            '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
        bookmarkBtn.title = this.bookmarkedVerses.has(verseKey) ? 
            'Remove verse bookmark' : 'Bookmark verse';
        bookmarkBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleVerseBookmark(verseNumber);
        };
        actionsDiv.appendChild(bookmarkBtn);
        
        // Copy verse button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'verse-action-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy verse';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            this.copyVerseToClipboard(verseNumber, verseText);
        };
        actionsDiv.appendChild(copyBtn);
        
        verseElement.appendChild(actionsDiv);
        
        return verseElement;
    }
    
    updateCurrentLocationDisplay() {
        if (!this.currentBook) return;
        
        const chapterNumber = this.currentChapterIndex + 1;
        
        if (this.currentChapterElement) {
            this.currentChapterElement.textContent = chapterNumber;
        }
        
        if (this.currentChapterHeader) {
            this.currentChapterHeader.textContent = chapterNumber;
        }
        
        if (this.currentBookElement) {
            this.currentBookElement.textContent = this.currentBook.name;
        }
        
        if (this.currentBookHeader) {
            this.currentBookHeader.textContent = this.currentBook.name;
        }
        
        const currentChapter = this.currentBook.chapters[this.currentChapterIndex];
        if (currentChapter && this.verseCountElement) {
            this.verseCountElement.textContent = currentChapter.length;
        }
        
        this.updateBookmarkButton();
        document.title = `${this.currentBook.name} ${chapterNumber} - Bible App`;
    }
    
    updateNavigationButtons() {
        if (!this.currentBook) return;
        
        const totalChapters = this.currentBook.chapters.length;
        const prevDisabled = this.currentChapterIndex === 0;
        const nextDisabled = this.currentChapterIndex === totalChapters - 1;
        
        this.prevButtons.forEach(btn => {
            btn.disabled = prevDisabled;
            btn.title = prevDisabled ? '' : 'Previous Chapter (←)';
        });
        
        this.nextButtons.forEach(btn => {
            btn.disabled = nextDisabled;
            btn.title = nextDisabled ? '' : 'Next Chapter (→)';
        });
    }
    
    // Navigation methods
    goToPrevChapter() {
        if (this.currentChapterIndex > 0) {
            this.currentChapterIndex--;
            this.updateCurrentLocationDisplay();
            this.loadCurrentChapter();
            this.saveState();
        }
    }
    
    goToNextChapter() {
        if (this.currentBook && 
            this.currentChapterIndex < this.currentBook.chapters.length - 1) {
            this.currentChapterIndex++;
            this.updateCurrentLocationDisplay();
            this.loadCurrentChapter();
            this.saveState();
        }
    }
    
    goToBook(bookIndex) {
    if (bookIndex >= 0 && bookIndex < this.bibleData.length) {
        this.currentBookIndex = bookIndex;
        this.currentBook = this.bibleData[bookIndex];
        this.currentChapterIndex = 0; // Reset to first chapter
        
        // Update ALL dropdowns and UI elements
        this.populateBookDropdown();
        this.populateChapterDropdown();
        this.updateCurrentLocationDisplay();
        this.loadCurrentChapter();
        this.saveState();
        
        console.log(`Switched to book: ${this.currentBook.name}`);
    }
}
    
    goToChapter(chapterIndex) {
    if (this.currentBook && 
        chapterIndex >= 0 && 
        chapterIndex < this.currentBook.chapters.length) {
        
        this.currentChapterIndex = chapterIndex;
        
        // Update UI immediately
        this.updateCurrentLocationDisplay();
        this.populateChapterDropdown(); // Ensure dropdown updates
        this.loadCurrentChapter();
        this.saveState();
        
        this.showToast(`${this.currentBook.name} ${chapterIndex + 1}`, 'success');
    }
}
    
    // NEW: Navigate to specific verse
    goToVerse(bookIndex, chapterIndex, verseNumber) {
        if (bookIndex >= 0 && bookIndex < this.bibleData.length) {
            this.currentBookIndex = bookIndex;
            this.currentBook = this.bibleData[bookIndex];
            
            if (chapterIndex >= 0 && chapterIndex < this.currentBook.chapters.length) {
                this.currentChapterIndex = chapterIndex;
                
                this.populateBookDropdown();
                this.populateChapterDropdown();
                this.updateCurrentLocationDisplay();
                this.loadCurrentChapter();
                
                // Scroll to verse
                setTimeout(() => {
                    const verseElement = this.textDisplay.querySelector(`[data-verse-number="${verseNumber}"]`);
                    if (verseElement) {
                        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        verseElement.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
                        verseElement.style.transition = 'background-color 0.5s';
                        setTimeout(() => {
                            verseElement.style.backgroundColor = '';
                        }, 2000);
                    }
                }, 300);
                
                this.saveState();
                this.showToast(`Navigated to ${this.currentBook.name} ${chapterIndex + 1}:${verseNumber}`, 'success');
            }
        }
    }
    
    // Translation methods
    async changeTranslation(translation) {
        if (translation === this.currentTranslation) return;
        
        try {
            this.currentTranslation = translation;
            await this.loadBibleData();
            this.updateUI();
            this.updateTranslationDisplay();
            this.showToast(`Switched to ${this.translationNames[translation]}`, 'success');
        } catch (error) {
            console.error('Error changing translation:', error);
            this.showToast('Error changing translation', 'error');
        }
    }
    
    updateTranslationDisplay() {
        const translationName = this.translationNames[this.currentTranslation];
        this.currentTranslationElement.textContent = translationName.split(' ')[0];
    }
    
    // Theme methods
    setupTheme() {
        const savedTheme = localStorage.getItem('bible-theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('bible-theme', theme);
        
        if (this.darkModeToggle) {
            this.darkModeToggle.checked = theme === 'dark';
        }
        
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            this.themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
    }
    
    applyTheme() {
        const savedTheme = localStorage.getItem('bible-theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    // Bookmark methods - ENHANCED
    toggleBookmark() {
        const bookmarkKey = this.getChapterKey();
        
        if (this.bookmarkedChapters.has(bookmarkKey)) {
            this.bookmarkedChapters.delete(bookmarkKey);
            this.showToast('Chapter removed from bookmarks', 'success');
        } else {
            this.bookmarkedChapters.add(bookmarkKey);
            this.showToast('Chapter bookmarked', 'success');
        }
        
        this.updateBookmarkButton();
        this.updateBookmarksUI();
        this.saveState();
    }
    
    // NEW: Verse bookmark methods
    toggleVerseBookmark(verseNumber) {
        const verseKey = this.getVerseKey(verseNumber);
        
        if (this.bookmarkedVerses.has(verseKey)) {
            this.bookmarkedVerses.delete(verseKey);
            this.showToast('Verse bookmark removed', 'success');
        } else {
            this.bookmarkedVerses.add(verseKey);
            this.showToast('Verse bookmarked', 'success');
        }
        
        // Update the verse display to show bookmark icon
        this.loadCurrentChapter();
        this.updateBookmarksUI();
        this.saveState();
    }
    
    updateBookmarkButton() {
        if (!this.bookmarkBtn) return;
        
        const bookmarkKey = this.getChapterKey();
        const isBookmarked = this.bookmarkedChapters.has(bookmarkKey);
        
        const icon = this.bookmarkBtn.querySelector('i');
        icon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
        this.bookmarkBtn.title = isBookmarked ? 'Remove Chapter Bookmark' : 'Bookmark Chapter';
    }
    
    // UPDATED: Combined bookmark UI update
    updateBookmarksUI() {
        this.updateChapterBookmarksList();
        this.updateVerseBookmarksList();
    }
    
    updateChapterBookmarksList() {
        if (!this.chapterBookmarksList) return;
        
        this.chapterBookmarksList.innerHTML = '';
        
        if (this.bookmarkedChapters.size === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No chapter bookmarks yet';
            this.chapterBookmarksList.appendChild(emptyState);
            return;
        }
        
        Array.from(this.bookmarkedChapters).forEach(bookmarkKey => {
            const [bookIndex, chapterIndex] = bookmarkKey.split('-').map(Number);
            const book = this.bibleData[bookIndex];
            const chapter = book.chapters[chapterIndex];
            
            const bookmarkItem = this.createChapterBookmarkItem(
                bookmarkKey, 
                book, 
                bookIndex, 
                chapterIndex, 
                chapter
            );
            
            this.chapterBookmarksList.appendChild(bookmarkItem);
        });
    }
    
    updateVerseBookmarksList() {
        if (!this.verseBookmarksList) return;
        
        this.verseBookmarksList.innerHTML = '';
        
        if (this.bookmarkedVerses.size === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No verse bookmarks yet';
            this.verseBookmarksList.appendChild(emptyState);
            return;
        }
        
        Array.from(this.bookmarkedVerses).forEach(verseKey => {
            const [bookIndex, chapterIndex, verseNumber] = verseKey.split('-').map(Number);
            const book = this.bibleData[bookIndex];
            const verseText = book.chapters[chapterIndex][verseNumber - 1];
            
            const bookmarkItem = this.createVerseBookmarkItem(
                verseKey,
                book,
                bookIndex,
                chapterIndex,
                verseNumber,
                verseText
            );
            
            this.verseBookmarksList.appendChild(bookmarkItem);
        });
    }
    
    createChapterBookmarkItem(bookmarkKey, book, bookIndex, chapterIndex, chapter) {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.dataset.key = bookmarkKey;
        item.dataset.type = 'chapter';
        
        const content = document.createElement('div');
        content.className = 'bookmark-item-content';
        
        const title = document.createElement('div');
        title.className = 'bookmark-item-title';
        title.textContent = `${book.name} ${chapterIndex + 1}`;
        
        const meta = document.createElement('div');
        meta.className = 'bookmark-item-meta';
        meta.innerHTML = `
            <span>${chapter.length} verses</span>
            <span>•</span>
            <span>${this.translationNames[this.currentTranslation]}</span>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'bookmark-item-actions';
        
        const gotoBtn = document.createElement('button');
        gotoBtn.className = 'bookmark-action-btn';
        gotoBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        gotoBtn.title = 'Go to chapter';
        gotoBtn.onclick = (e) => {
            e.stopPropagation();
            this.goToBook(bookIndex);
            this.goToChapter(chapterIndex);
            this.closeSideMenu();
        };
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'bookmark-action-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remove bookmark';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            this.bookmarkedChapters.delete(bookmarkKey);
            this.updateBookmarksUI();
            this.updateBookmarkButton();
            this.saveState();
            this.showToast('Chapter bookmark removed', 'success');
        };
        
        actions.appendChild(gotoBtn);
        actions.appendChild(removeBtn);
        
        content.appendChild(title);
        content.appendChild(meta);
        item.appendChild(content);
        item.appendChild(actions);
        
        // Click on item to navigate
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.bookmark-item-actions')) {
                this.goToBook(bookIndex);
                this.goToChapter(chapterIndex);
                this.closeSideMenu();
            }
        });
        
        return item;
    }
    
    createVerseBookmarkItem(verseKey, book, bookIndex, chapterIndex, verseNumber, verseText) {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.dataset.key = verseKey;
        item.dataset.type = 'verse';
        
        const content = document.createElement('div');
        content.className = 'bookmark-item-content';
        
        const title = document.createElement('div');
        title.className = 'bookmark-item-title';
        title.textContent = `${book.name} ${chapterIndex + 1}:${verseNumber}`;
        
        const text = document.createElement('div');
        text.className = 'bookmark-item-text';
        text.textContent = verseText.length > 100 ? verseText.substring(0, 100) + '...' : verseText;
        
        const meta = document.createElement('div');
        meta.className = 'bookmark-item-meta';
        meta.innerHTML = `
            <span>${this.translationNames[this.currentTranslation]}</span>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'bookmark-item-actions';
        
        const gotoBtn = document.createElement('button');
        gotoBtn.className = 'bookmark-action-btn';
        gotoBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        gotoBtn.title = 'Go to verse';
        gotoBtn.onclick = (e) => {
            e.stopPropagation();
            this.goToVerse(bookIndex, chapterIndex, verseNumber);
            this.closeSideMenu();
        };
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'bookmark-action-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remove bookmark';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            this.bookmarkedVerses.delete(verseKey);
            this.updateBookmarksUI();
            this.loadCurrentChapter(); // Update verse display
            this.saveState();
            this.showToast('Verse bookmark removed', 'success');
        };
        
        actions.appendChild(gotoBtn);
        actions.appendChild(removeBtn);
        
        content.appendChild(title);
        content.appendChild(text);
        content.appendChild(meta);
        item.appendChild(content);
        item.appendChild(actions);
        
        // Click on item to navigate
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.bookmark-item-actions')) {
                this.goToVerse(bookIndex, chapterIndex, verseNumber);
                this.closeSideMenu();
            }
        });
        
        return item;
    }
    
    // Highlight methods
    toggleHighlightVerse(verseNumber) {
        const verseKey = this.getVerseKey(verseNumber);
        
        if (this.highlightedVerses.has(verseKey)) {
            this.highlightedVerses.delete(verseKey);
        } else {
            this.highlightedVerses.add(verseKey);
        }
        
        this.loadCurrentChapter();
        this.saveState();
    }
    
    // Search methods
    async searchBible(query) {
        if (!query.trim() || !this.bibleData) return;
        
        const results = [];
        const searchQuery = query.toLowerCase();
        
        this.bibleData.forEach((book, bookIndex) => {
            book.chapters.forEach((chapter, chapterIndex) => {
                chapter.forEach((verseText, verseIndex) => {
                    if (verseText.toLowerCase().includes(searchQuery)) {
                        results.push({
                            bookIndex,
                            chapterIndex,
                            verseIndex,
                            bookName: book.name,
                            verseText: verseText.substring(0, 1000) + '...'
                        });
                    }
                });
            });
        });
        
        this.displaySearchResults(results);
    }
    
    displaySearchResults(results) {
    this.searchResults.innerHTML = '';
    
    if (results.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'empty-state';
        noResults.textContent = 'No results found';
        this.searchResults.appendChild(noResults);
        return;
    }
    
    results.slice(0, 1000).forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <strong>${result.bookName} ${result.chapterIndex + 1}:${result.verseIndex + 1}</strong>
            <p>${result.verseText}</p>
        `;
        
        resultItem.onclick = () => {
            // Navigate to the book and chapter
            this.goToBook(result.bookIndex);
            this.goToChapter(result.chapterIndex);
            this.closeSideMenu();
            
            // Scroll to verse after a short delay
            setTimeout(() => {
                const verseElement = this.textDisplay.querySelector(`[data-verse-number="${result.verseIndex + 1}"]`);
                if (verseElement) {
                    verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Highlight the verse temporarily
                    verseElement.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
                    verseElement.style.transition = 'background-color 0.5s';
                    setTimeout(() => {
                        verseElement.style.backgroundColor = '';
                    }, 2000);
                }
            }, 300);
        };
        
        this.searchResults.appendChild(resultItem);
    });
}
    
    // Progress tracking
    markChapterAsRead() {
        const chapterKey = this.getChapterKey();
        this.readChapters.add(chapterKey);
        this.updateProgress();
        this.saveState();
    }
    
    updateProgress() {
        const totalChapters = this.bibleData ? 
            this.bibleData.reduce((sum, book) => sum + book.chapters.length, 0) : 0;
        
        const readCount = this.readChapters.size;
        const percentage = totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }
        
        if (this.progressBarText) {
            this.progressBarText.textContent = `${percentage}% read`;
        }
        
        if (this.chaptersReadElement) {
            this.chaptersReadElement.textContent = readCount;
        }
        
        if (this.totalStatsElement) {
            this.totalStatsElement.textContent = `${readCount} chapters • ${this.getBooksStartedCount()} books`;
        }
        
        const booksStarted = this.getBooksStartedCount();
        if (this.booksStartedElement) {
            this.booksStartedElement.textContent = booksStarted;
        }
    }
    
    getBooksStartedCount() {
        const bookMap = new Map();
        
        this.readChapters.forEach(chapterKey => {
            const [bookIndex] = chapterKey.split('-').map(Number);
            bookMap.set(bookIndex, true);
        });
        
        return bookMap.size;
    }
    
    clearProgress() {
        if (confirm('Are you sure you want to clear all reading progress?')) {
            this.readChapters.clear();
            this.updateProgress();
            this.saveState();
            this.showToast('Progress cleared', 'success');
        }
    }
    
    // Sharing methods
    openShareModal() {
        this.shareModal.classList.add('active');
        const shareText = this.generateShareText();
        this.shareText.value = shareText;
    }
    
    closeShareModal() {
        this.shareModal.classList.remove('active');
    }
    
    generateShareText() {
        const bookName = this.currentBook?.name || 'Unknown Book';
        const chapterNum = this.currentChapterIndex + 1;
        const verses = this.currentBook?.chapters[this.currentChapterIndex] || [];
        
        let text = `${bookName} ${chapterNum} (${this.translationNames[this.currentTranslation]})\n\n`;
        
        verses.forEach((verse, index) => {
            text += `${index + 1}. ${verse}\n`;
        });
        
        return text;
    }
    
    copyVerseToClipboard(verseNumber, verseText) {
        const bookName = this.currentBook?.name || 'Unknown Book';
        const chapterNum = this.currentChapterIndex + 1;
        const text = `${bookName} ${chapterNum}:${verseNumber} - ${verseText}`;
        
        this.copyToClipboard(text);
        this.showToast('Verse copied to clipboard!', 'success');
    }
    
    copyChapterToClipboard() {
        const text = this.generateShareText();
        this.copyToClipboard(text);
        this.showToast('Chapter copied to clipboard!', 'success');
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy:', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }
    
    async shareViaNative() {
        const text = this.generateShareText();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${this.currentBook.name} ${this.currentChapterIndex + 1}`,
                    text: text.substring(0, 100) + '...',
                    url: window.location.href
                });
            } catch (error) {
                console.log('Share cancelled:', error);
            }
        } else {
            this.copyChapterToClipboard();
        }
    }
    
    shareViaTwitter() {
        const bookName = this.currentBook?.name || 'Unknown Book';
        const chapterNum = this.currentChapterIndex + 1;
        const firstVerse = this.currentBook?.chapters[this.currentChapterIndex][0] || '';
        const text = `${bookName} ${chapterNum}:1 - ${firstVerse.substring(0, 100)}...`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
        
        window.open(url, '_blank', 'width=550,height=420');
    }
    
    // Side menu methods
    openSideMenu() {
        this.sideMenu.classList.add('active');
        this.menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeSideMenu() {
        this.sideMenu.classList.remove('active');
        this.menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // NEW: Bookmark tab switching
    switchBookmarkTab(tabName) {
        this.bookmarkTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        if (tabName === 'chapters') {
            this.chapterBookmarksList.classList.add('active');
            this.verseBookmarksList.classList.remove('active');
        } else {
            this.chapterBookmarksList.classList.remove('active');
            this.verseBookmarksList.classList.add('active');
        }
    }
    
    // NEW: Bookmark current verse
    bookmarkCurrentVerse() {
        // For now, bookmark the first verse of current chapter
        // You could enhance this to track which verse is currently selected/visible
        this.toggleVerseBookmark(1);
    }
    
    // Utility methods
    getChapterKey() {
        return `${this.currentBookIndex}-${this.currentChapterIndex}`;
    }
    
    getVerseKey(verseNumber) {
        return `${this.currentBookIndex}-${this.currentChapterIndex}-${verseNumber}`;
    }
    
    // State management - UPDATED
    loadSavedState() {
        try {
            const savedTheme = localStorage.getItem('bible-theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
            
            const savedTranslation = localStorage.getItem('bible-translation');
            if (savedTranslation && this.translationUrls[savedTranslation]) {
                this.currentTranslation = savedTranslation;
            }
            
            const savedBookmarks = localStorage.getItem('bible-bookmarks');
            if (savedBookmarks) {
                this.bookmarkedChapters = new Set(JSON.parse(savedBookmarks));
            }
            
            // NEW: Load verse bookmarks
            const savedVerseBookmarks = localStorage.getItem('bible-verse-bookmarks');
            if (savedVerseBookmarks) {
                this.bookmarkedVerses = new Set(JSON.parse(savedVerseBookmarks));
            }
            
            const savedHighlights = localStorage.getItem('bible-highlights');
            if (savedHighlights) {
                this.highlightedVerses = new Set(JSON.parse(savedHighlights));
            }
            
            const savedProgress = localStorage.getItem('bible-progress');
            if (savedProgress) {
                this.readChapters = new Set(JSON.parse(savedProgress));
            }
            
            const savedPosition = localStorage.getItem('bible-position');
            if (savedPosition) {
                const { bookIndex, chapterIndex } = JSON.parse(savedPosition);
                if (bookIndex !== undefined && chapterIndex !== undefined) {
                    this.currentBookIndex = bookIndex;
                    this.currentChapterIndex = chapterIndex;
                }
            }
            
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('bible-translation', this.currentTranslation);
            localStorage.setItem('bible-bookmarks', JSON.stringify(Array.from(this.bookmarkedChapters)));
            // NEW: Save verse bookmarks
            localStorage.setItem('bible-verse-bookmarks', JSON.stringify(Array.from(this.bookmarkedVerses)));
            localStorage.setItem('bible-highlights', JSON.stringify(Array.from(this.highlightedVerses)));
            localStorage.setItem('bible-progress', JSON.stringify(Array.from(this.readChapters)));
            
            const position = {
                bookIndex: this.currentBookIndex,
                chapterIndex: this.currentChapterIndex
            };
            localStorage.setItem('bible-position', JSON.stringify(position));
            
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }
    
    // Toast notification
    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    // Event listeners - UPDATED
    setupEventListeners() {
        // Book dropdown change
        this.bookSelect.addEventListener('change', (e) => {
            const bookIndex = parseInt(e.target.value);
            if (!isNaN(bookIndex) && this.bibleData) {
                this.goToBook(bookIndex);
            }
        });
        
        // Chapter dropdown change
        this.chapterSelect.addEventListener('change', (e) => {
            const chapterIndex = parseInt(e.target.value);
            if (!isNaN(chapterIndex) && this.currentBook) {
                this.goToChapter(chapterIndex);
            }
        });
        
        // Navigation buttons
        this.prevButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPrevChapter();
            });
        });
        
        this.nextButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToNextChapter();
            });
        });
        
        // Side menu
        this.menuToggle.addEventListener('click', () => this.openSideMenu());
        this.closeMenu.addEventListener('click', () => this.closeSideMenu());
        this.menuOverlay.addEventListener('click', () => this.closeSideMenu());
        
        // Translation
        this.translationSelect.addEventListener('change', (e) => {
            this.changeTranslation(e.target.value);
        });
        
        // Search
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchBible(this.searchInput.value);
            }
        });
        
        this.searchBtn.addEventListener('click', () => {
            this.searchBible(this.searchInput.value);
        });
        
        // Bookmarks
        this.bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        
        // NEW: Bookmark tab switching
        this.bookmarkTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchBookmarkTab(tabName);
            });
        });
        
        // NEW: Add current verse button
        if (this.addCurrentVerseBtn) {
            this.addCurrentVerseBtn.addEventListener('click', () => {
                this.bookmarkCurrentVerse();
            });
        }
        
        // Progress
        if (this.clearProgressBtn) {
            this.clearProgressBtn.addEventListener('click', () => this.clearProgress());
        }
        
        // Theme
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', (e) => {
                this.setTheme(e.target.checked ? 'dark' : 'light');
            });
        }
        
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Settings toggles
        if (this.verseNumbersToggle) {
            this.verseNumbersToggle.addEventListener('change', () => {
                this.loadCurrentChapter();
                this.saveState();
            });
        }
        
        if (this.autoSaveToggle) {
            this.autoSaveToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.saveState();
                }
            });
        }
        
        // Sharing
        this.shareBtn.addEventListener('click', () => this.openShareModal());
        
        // Share modal buttons
        this.copyVerseBtn.addEventListener('click', () => {
            const firstVerse = this.currentBook?.chapters[this.currentChapterIndex][0];
            if (firstVerse) {
                this.copyVerseToClipboard(1, firstVerse);
            }
        });
        
        this.copyChapterBtn.addEventListener('click', () => this.copyChapterToClipboard());
        this.shareNativeBtn.addEventListener('click', () => this.shareViaNative());
        this.shareTwitterBtn.addEventListener('click', () => this.shareViaTwitter());
        this.copyTextBtn.addEventListener('click', () => this.copyToClipboard(this.shareText.value));
        
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeShareModal());
        });
        
        // Close modal when clicking outside
        this.shareModal.addEventListener('click', (e) => {
            if (e.target === this.shareModal) {
                this.closeShareModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('input, textarea, select')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case ',':
                    e.preventDefault();
                    this.goToPrevChapter();
                    break;
                    
                case 'ArrowRight':
                case '.':
                    e.preventDefault();
                    this.goToNextChapter();
                    break;
                    
                case 'Escape':
                    this.closeSideMenu();
                    this.closeShareModal();
                    break;
                    
                case 'b':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleBookmark();
                    }
                    break;
                    
                case 'd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleTheme();
                    }
                    break;
                    
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.openSideMenu();
                        this.searchInput.focus();
                    }
                    break;
                    
                // NEW: Verse bookmark shortcut
                case 'v':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.bookmarkCurrentVerse();
                    }
                    break;
            }
        });
        
        // Save state on page unload
        window.addEventListener('beforeunload', () => this.saveState());
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new BibleApp();
    window.bibleApp = app;
});
