// Enhanced Bible Web App with Multiple Features
// Includes: Multiple translations, dark mode, bookmarks, search, sharing, progress tracking

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
        
        // Translation URLs
        this.translationUrls = {
            'kjv': 'https://skadigitalhub.github.io/NKJVBible/bible-kjv.json',
            'bbe': 'https://skadigitalhub.github.io/NKJVBible/bbe.json', // Placeholder - update with actual BBE URL
            'amp': 'https://skadigitalhub.github.io/NKJVBible/amp.json',
            'nlt': 'https://skadigitalhub.github.io/NKJVBible/nlt.json'
        };
        
        // Translation names
        this.translationNames = {
            'kjv': 'King James Version',
            'bbe': 'Bible in Basic English',
            'amp': 'Amplified Bible',
            'nlt': 'New Living Translation'
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
        this.bookmarksList = document.getElementById('bookmarks-list');
        this.bookmarkBtn = document.getElementById('bookmarkBtn');
        
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
        this.updateBookmarksList();
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
    }
    
    loadCurrentChapter() {
        if (!this.currentBook) return;
        
        const chapter = this.currentBook.chapters[this.currentChapterIndex];
        
        if (!chapter || chapter.length === 0) {
            this.textDisplay.innerHTML = '<p class="empty-state">No text available for this chapter.</p>';
            return;
        }
        
        // Clear previous text
        this.textDisplay.innerHTML = '';
        
        // Check if verse numbers should be shown
        const showVerseNumbers = this.verseNumbersToggle?.checked ?? true;
        
        // Display each verse
        chapter.forEach((verseText, verseIndex) => {
            const verseElement = this.createVerseElement(verseIndex + 1, verseText, showVerseNumbers);
            this.textDisplay.appendChild(verseElement);
        });
        
        // Mark chapter as read
        this.markChapterAsRead();
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
    
    createVerseElement(verseNumber, verseText, showVerseNumbers) {
        const verseElement = document.createElement('div');
        verseElement.className = 'verse';
        verseElement.dataset.verseNumber = verseNumber;
        
        // Check if verse is highlighted
        const verseKey = this.getVerseKey(verseNumber);
        if (this.highlightedVerses.has(verseKey)) {
            verseElement.classList.add('highlighted');
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
        
        // Update main display
        this.currentBookElement.textContent = this.currentBook.name;
        this.currentChapterElement.textContent = this.currentChapterIndex + 1;
        
        // Update header
        this.currentBookHeader.textContent = this.currentBook.name;
        this.currentChapterHeader.textContent = this.currentChapterIndex + 1;
        
        // Update verse count
        const currentChapter = this.currentBook.chapters[this.currentChapterIndex];
        if (currentChapter) {
            this.verseCountElement.textContent = currentChapter.length;
        }
        
        // Update bookmark button state
        this.updateBookmarkButton();
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
            this.loadCurrentChapter();
        }
    }
    
    goToNextChapter() {
        if (this.currentBook && 
            this.currentChapterIndex < this.currentBook.chapters.length - 1) {
            this.currentChapterIndex++;
            this.loadCurrentChapter();
        }
    }
    
    goToBook(bookIndex) {
        if (bookIndex >= 0 && bookIndex < this.bibleData.length) {
            this.currentBookIndex = bookIndex;
            this.currentBook = this.bibleData[bookIndex];
            this.currentChapterIndex = 0;
            this.loadCurrentChapter();
        }
    }
    
    goToChapter(chapterIndex) {
        if (this.currentBook && 
            chapterIndex >= 0 && 
            chapterIndex < this.currentBook.chapters.length) {
            this.currentChapterIndex = chapterIndex;
            this.loadCurrentChapter();
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
        this.currentTranslationElement.textContent = translationName.split(' ')[0]; // Show abbreviation
    }
    
    // Theme methods
    setupTheme() {
        const savedTheme = localStorage.getItem('bible-theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('bible-theme', theme);
        
        // Update toggle state
        if (this.darkModeToggle) {
            this.darkModeToggle.checked = theme === 'dark';
        }
        
        // Update theme toggle button icon
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
    
    // Bookmark methods
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
        this.updateBookmarksList();
        this.saveState();
    }
    
    updateBookmarkButton() {
        if (!this.bookmarkBtn) return;
        
        const bookmarkKey = this.getChapterKey();
        const isBookmarked = this.bookmarkedChapters.has(bookmarkKey);
        
        const icon = this.bookmarkBtn.querySelector('i');
        icon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
        this.bookmarkBtn.title = isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter';
    }
    
    updateBookmarksList() {
        if (!this.bookmarksList) return;
        
        this.bookmarksList.innerHTML = '';
        
        if (this.bookmarkedChapters.size === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No bookmarks yet';
            this.bookmarksList.appendChild(emptyState);
            return;
        }
        
        Array.from(this.bookmarkedChapters).forEach(bookmarkKey => {
            const [bookIndex, chapterIndex] = bookmarkKey.split('-').map(Number);
            const book = this.bibleData[bookIndex];
            
            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'bookmark-item';
            
            const bookmarkText = document.createElement('span');
            bookmarkText.textContent = `${book.name} ${chapterIndex + 1}`;
            bookmarkText.style.cursor = 'pointer';
            bookmarkText.onclick = () => {
                this.goToBook(bookIndex);
                this.goToChapter(chapterIndex);
                this.closeSideMenu();
            };
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'bookmark-remove';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove bookmark';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.bookmarkedChapters.delete(bookmarkKey);
                this.updateBookmarksList();
                this.updateBookmarkButton();
                this.saveState();
                this.showToast('Bookmark removed', 'success');
            };
            
            bookmarkItem.appendChild(bookmarkText);
            bookmarkItem.appendChild(removeBtn);
            this.bookmarksList.appendChild(bookmarkItem);
        });
    }
    
    // Highlight methods
    toggleHighlightVerse(verseNumber) {
        const verseKey = this.getVerseKey(verseNumber);
        
        if (this.highlightedVerses.has(verseKey)) {
            this.highlightedVerses.delete(verseKey);
        } else {
            this.highlightedVerses.add(verseKey);
        }
        
        // Re-render current chapter to update highlights
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
                            verseText: verseText.substring(0, 100) + '...'
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
        
        results.slice(0, 20).forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <strong>${result.bookName} ${result.chapterIndex + 1}:${result.verseIndex + 1}</strong>
                <p>${result.verseText}</p>
            `;
            
            resultItem.onclick = () => {
                this.goToBook(result.bookIndex);
                this.goToChapter(result.chapterIndex);
                this.closeSideMenu();
                
                // Scroll to verse
                setTimeout(() => {
                    const verseElement = this.textDisplay.querySelector(`[data-verse-number="${result.verseIndex + 1}"]`);
                    if (verseElement) {
                        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        verseElement.style.animation = 'pulse 1s';
                        setTimeout(() => verseElement.style.animation = '', 1000);
                    }
                }, 100);
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
        
        // Update progress bar
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }
        
        if (this.progressBarText) {
            this.progressBarText.textContent = `${percentage}% read`;
        }
        
        // Update stats
        if (this.chaptersReadElement) {
            this.chaptersReadElement.textContent = readCount;
        }
        
        if (this.totalStatsElement) {
            this.totalStatsElement.textContent = `${readCount} chapters • ${this.getBooksStartedCount()} books`;
        }
        
        // Calculate books started
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
        
        // Generate share text
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
            // Fallback for older browsers
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
    
    // Utility methods
    getChapterKey() {
        return `${this.currentBookIndex}-${this.currentChapterIndex}`;
    }
    
    getVerseKey(verseNumber) {
        return `${this.currentBookIndex}-${this.currentChapterIndex}-${verseNumber}`;
    }
    
    // State management
    loadSavedState() {
        try {
            // Load theme
            const savedTheme = localStorage.getItem('bible-theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
            
            // Load translation
            const savedTranslation = localStorage.getItem('bible-translation');
            if (savedTranslation && this.translationUrls[savedTranslation]) {
                this.currentTranslation = savedTranslation;
            }
            
            // Load bookmarks
            const savedBookmarks = localStorage.getItem('bible-bookmarks');
            if (savedBookmarks) {
                this.bookmarkedChapters = new Set(JSON.parse(savedBookmarks));
            }
            
            // Load highlighted verses
            const savedHighlights = localStorage.getItem('bible-highlights');
            if (savedHighlights) {
                this.highlightedVerses = new Set(JSON.parse(savedHighlights));
            }
            
            // Load reading progress
            const savedProgress = localStorage.getItem('bible-progress');
            if (savedProgress) {
                this.readChapters = new Set(JSON.parse(savedProgress));
            }
            
            // Load last position
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
            // Save translation
            localStorage.setItem('bible-translation', this.currentTranslation);
            
            // Save bookmarks
            localStorage.setItem('bible-bookmarks', JSON.stringify(Array.from(this.bookmarkedChapters)));
            
            // Save highlighted verses
            localStorage.setItem('bible-highlights', JSON.stringify(Array.from(this.highlightedVerses)));
            
            // Save reading progress
            localStorage.setItem('bible-progress', JSON.stringify(Array.from(this.readChapters)));
            
            // Save current position
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
    
    // Event listeners
    setupEventListeners() {
        // Book and chapter selection
        this.bookSelect.addEventListener('change', (e) => {
            const bookIndex = parseInt(e.target.value);
            if (!isNaN(bookIndex)) {
                this.goToBook(bookIndex);
            }
        });
        
        this.chapterSelect.addEventListener('change', (e) => {
            const chapterIndex = parseInt(e.target.value);
            if (!isNaN(chapterIndex)) {
                this.goToChapter(chapterIndex);
            }
        });
        
        // Navigation buttons
        this.prevButtons.forEach(btn => {
            btn.addEventListener('click', () => this.goToPrevChapter());
        });
        
        this.nextButtons.forEach(btn => {
            btn.addEventListener('click', () => this.goToNextChapter());
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
            // Copy first verse as example
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
            // Don't trigger if user is typing in an input
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
            }
        });
        
        // Save state on page unload
        window.addEventListener('beforeunload', () => this.saveState());
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new BibleApp();
    window.bibleApp = app; // For debugging
});