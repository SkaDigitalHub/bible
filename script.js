// Enhanced Bible Web App with Multiple Features

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

        // NEW: Search highlighting properties
        this.currentSearchTerm = '';
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.totalMatches = 0;
        this.searchResultsCount = 0;
    
       // NEW: Search DOM elements
       this.searchStats = null;
       this.clearSearchBtn = null;
       this.prevMatchBtn = null;
       this.nextMatchBtn = null;
        
        // Translation URLs
        this.translationUrls = {
            'kjv': 'https://skadigitalhub.github.io/NKJVBible/bible-kjv.json',
            'bbe': 'https://skadigitalhub.github.io/NKJVBible/bbe.json',
            'amp': '/bible/versions/amp.json',
            'nlt': '/bible/versions/nlt.json',
            'niv': '/bible/versions/niv.json',
            'msg': 'bible/versions/msg.json',
            'gn': '/bible/versions/gn.json',
            'asv': '/bible/versions/asv.json',
            
        };
        
        // Translation names
        this.translationNames = {
            'kjv': 'KJV - King James Version',
            'bbe': 'BBE - Bible in Basic English',
            'amp': 'AMP - Amplified Bible',
            'nlt': 'NLT - New Living Translation',
            'asv': 'ASV - America Standard Version',
            'gn': 'GNT - GoodNews Bible',
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
            
            // Parse the JSON data
            const jsonData = await response.json();
            
            // Check if data needs conversion (new structure vs old structure)
            if (this.isNewJsonStructure(jsonData)) {
                console.log('Converting new JSON structure to app format...');
                this.bibleData = this.convertJsonStructure(jsonData);
            } else {
                console.log('Using existing JSON structure...');
                this.bibleData = jsonData;
            }
            
            // Set initial book
            this.currentBook = this.bibleData[this.currentBookIndex];
            
            // Mark chapter as read
            this.markChapterAsRead();
            
            console.log(`Loaded ${this.bibleData.length} books`);
            
        } catch (error) {
            console.error('Error loading Bible data:', error);
            throw error;
        }
    }
    
    // Check if JSON has the new structure
    isNewJsonStructure(jsonData) {
        // New structure: { "Genesis": { "1": { "1": "text" } } }
        // Old structure: [ { "name": "Genesis", "chapters": [ ["v1", "v2"] ] } ]
        
        const firstKey = Object.keys(jsonData)[0];
        if (Array.isArray(jsonData)) {
            return false; // Old structure (array)
        }
        
        // Check if first key is a book name
        const firstItem = jsonData[firstKey];
        return firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem);
    }
    
    // Convert new JSON structure to app format
    convertJsonStructure(jsonData) {
        const bibleArray = [];
        const bookNames = Object.keys(jsonData);
        
        bookNames.forEach((bookName, bookIndex) => {
            const bookData = jsonData[bookName];
            const chapters = [];
            
            // Get all chapter numbers and sort them numerically
            const chapterNumbers = Object.keys(bookData)
                .map(num => parseInt(num))
                .filter(num => !isNaN(num))
                .sort((a, b) => a - b);
            
            chapterNumbers.forEach(chapterNum => {
                const chapterData = bookData[chapterNum.toString()];
                const verses = [];
                
                // Get all verse numbers and sort them numerically
                const verseNumbers = Object.keys(chapterData)
                    .map(num => parseInt(num))
                    .filter(num => !isNaN(num))
                    .sort((a, b) => a - b);
                
                verseNumbers.forEach(verseNum => {
                    const verseText = chapterData[verseNum.toString()];
                    if (verseText) {
                        verses.push(verseText);
                    }
                });
                
                if (verses.length > 0) {
                    chapters.push(verses);
                }
            });
            
            // Add book to array in the expected format
            bibleArray.push({
                abbrev: this.getBookAbbreviation(bookName),
                name: bookName,
                chapters: chapters
            });
        });
        
        console.log(`Converted ${bibleArray.length} books with new structure`);
        return bibleArray;
    }
    
    // Helper: Get book abbreviation
    getBookAbbreviation(bookName) {
        const abbreviations = {
            'Genesis': 'gn', 'Exodus': 'ex', 'Leviticus': 'lev', 'Numbers': 'num',
            'Deuteronomy': 'deut', 'Joshua': 'josh', 'Judges': 'judg', 'Ruth': 'ruth',
            '1 Samuel': '1sam', '2 Samuel': '2sam', '1 Kings': '1kgs', '2 Kings': '2kgs',
            '1 Chronicles': '1chr', '2 Chronicles': '2chr', 'Ezra': 'ezra', 'Nehemiah': 'neh',
            'Esther': 'esth', 'Job': 'job', 'Psalms': 'ps', 'Psalm': 'ps', 'Proverbs': 'prov',
            'Ecclesiastes': 'eccl', 'Song of Solomon': 'song', 'Isaiah': 'isa', 'Jeremiah': 'jer',
            'Lamentations': 'lam', 'Ezekiel': 'ezek', 'Daniel': 'dan', 'Hosea': 'hos',
            'Joel': 'joel', 'Amos': 'amos', 'Obadiah': 'obad', 'Jonah': 'jonah',
            'Micah': 'mic', 'Nahum': 'nah', 'Habakkuk': 'hab', 'Zephaniah': 'zeph',
            'Haggai': 'hag', 'Zechariah': 'zech', 'Malachi': 'mal',
            'Matthew': 'matt', 'Mark': 'mark', 'Luke': 'luke', 'John': 'john',
            'Acts': 'acts', 'Romans': 'rom', '1 Corinthians': '1cor', '2 Corinthians': '2cor',
            'Galatians': 'gal', 'Ephesians': 'eph', 'Philippians': 'phil', 'Colossians': 'col',
            '1 Thessalonians': '1thes', '2 Thessalonians': '2thes', '1 Timothy': '1tim',
            '2 Timothy': '2tim', 'Titus': 'titus', 'Philemon': 'philem', 'Hebrews': 'heb',
            'James': 'jas', '1 Peter': '1pet', '2 Peter': '2pet', '1 John': '1jn',
            '2 John': '2jn', '3 John': '3jn', 'Jude': 'jude', 'Revelation': 'rev'
        };
        
        return abbreviations[bookName] || bookName.toLowerCase().substring(0, 2);
    }
    
    updateUI() {
        this.populateBookDropdown();
        this.populateChapterDropdown();
        this.loadCurrentChapter();
        this.updateCurrentLocationDisplay();
        this.updateBookmarksUI();
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
        
        // Re-apply search highlights if there's an active search
        if (this.currentSearchTerm && this.searchMatches.length > 0) {
            this.highlightSearchTerms();
            this.updateSearchNavigation();
        }
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
        
        // Verse text - check if we need to highlight search terms
        const textDiv = document.createElement('div');
        textDiv.className = 'verse-text';
        
        if (this.currentSearchTerm && verseText.toLowerCase().includes(this.currentSearchTerm.toLowerCase())) {
            // Apply search highlighting
            const regex = new RegExp(`(${this.escapeRegExp(this.currentSearchTerm)})`, 'gi');
            
            // Escape HTML first, then apply highlighting
            const escapedText = this.escapeHtml(verseText);
            textDiv.innerHTML = escapedText.replace(regex, '<span class="search-highlight">$1</span>');
        } else {
            textDiv.textContent = verseText;
        }
        
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
    
    // ===== SEARCH METHODS =====
    
    async searchBible(query) {
        if (!query || !query.trim() || !this.bibleData) {
            this.clearSearchHighlights();
            return;
        }
        
        const searchTerm = query.trim();
        console.log(`Searching for: "${searchTerm}"`);
        
        // Reset search state
        this.currentSearchTerm = searchTerm;
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.totalMatches = 0;
        this.searchResultsCount = 0;
        
        // Clear previous highlights
        this.clearSearchHighlights();
        
        const results = [];
        const searchTermLower = searchTerm.toLowerCase();
        
        // Search through all books
        for (let bookIndex = 0; bookIndex < this.bibleData.length; bookIndex++) {
            const book = this.bibleData[bookIndex];
            
            // Search through all chapters in this book
            for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
                const chapter = book.chapters[chapterIndex];
                
                // Search through all verses in this chapter
                for (let verseIndex = 0; verseIndex < chapter.length; verseIndex++) {
                    const verseText = chapter[verseIndex];
                    const verseTextLower = verseText.toLowerCase();
                    
                    // Check if verse contains the search term
                    if (verseTextLower.includes(searchTermLower)) {
                        // Count exact occurrences
                        const occurrences = this.countOccurrences(verseText, searchTerm);
                        this.totalMatches += occurrences;
                        
                        // Store each occurrence for highlighting
                        for (let matchIndex = 0; matchIndex < occurrences; matchIndex++) {
                            this.searchMatches.push({
                                bookIndex,
                                chapterIndex,
                                verseIndex,
                                bookName: book.name,
                                verseText: verseText,
                                matchIndex: matchIndex
                            });
                        }
                        
                        // Store for search results list
                        results.push({
                            bookIndex,
                            chapterIndex,
                            verseIndex,
                            bookName: book.name,
                            verseText: verseText,
                            occurrences: occurrences
                        });
                        
                        this.searchResultsCount++;
                    }
                }
            }
        }
        
        console.log(`Found ${results.length} verses with ${this.totalMatches} total matches`);
        
        // Display search results
        this.displaySearchResults(results);
        
        // Update search stats
        this.updateSearchStats();
        
        // If we have matches and we're on a matching chapter, highlight them
        if (this.searchMatches.length > 0) {
            // Check if current chapter has matches
            const currentChapterMatches = this.searchMatches.filter(match => 
                match.bookIndex === this.currentBookIndex && 
                match.chapterIndex === this.currentChapterIndex
            );
            
            if (currentChapterMatches.length > 0) {
                // Highlight terms in current chapter
                this.highlightSearchTerms();
                
                // Set first match as active
                this.currentMatchIndex = this.searchMatches.indexOf(currentChapterMatches[0]);
                this.highlightCurrentMatch();
            }
            
            this.showToast(`Found ${results.length} verses with ${this.totalMatches} matches`, 'success');
        } else {
            this.showToast('No matches found', 'info');
        }
    }
    
    countOccurrences(text, searchTerm) {
        const textLower = text.toLowerCase();
        const termLower = searchTerm.toLowerCase();
        let count = 0;
        let position = 0;
        
        // Simple loop to count occurrences
        while ((position = textLower.indexOf(termLower, position)) !== -1) {
            count++;
            position += termLower.length;
        }
        
        return count;
    }
    
    highlightSearchTerms() {
        if (!this.currentSearchTerm || this.currentSearchTerm.length < 1) return;
        
        const verses = this.textDisplay.querySelectorAll('.verse-text');
        const searchTerm = this.currentSearchTerm;
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        
        verses.forEach((verseElement, verseIndex) => {
            const originalText = this.currentBook.chapters[this.currentChapterIndex][verseIndex];
            if (!originalText) return;
            
            // Check if this verse contains the search term
            if (originalText.toLowerCase().includes(searchTerm.toLowerCase())) {
                // Escape HTML and apply highlighting
                const escapedText = this.escapeHtml(originalText);
                verseElement.innerHTML = escapedText.replace(regex, '<span class="search-highlight">$1</span>');
            }
        });
        
        // Add match counters
        this.addMatchCounters();
    }
    
    addMatchCounters() {
        // Remove any existing counters
        const existingCounters = this.textDisplay.querySelectorAll('.search-match-counter');
        existingCounters.forEach(counter => counter.remove());
        
        // Get verses with multiple matches in current chapter
        const verses = this.textDisplay.querySelectorAll('.verse');
        
        verses.forEach((verseElement, verseIndex) => {
            const verseMatches = this.searchMatches.filter(match => 
                match.bookIndex === this.currentBookIndex && 
                match.chapterIndex === this.currentChapterIndex && 
                match.verseIndex === verseIndex
            );
            
            if (verseMatches.length > 1) {
                const firstHighlight = verseElement.querySelector('.search-highlight');
                if (firstHighlight) {
                    const counter = document.createElement('span');
                    counter.className = 'search-match-counter';
                    counter.textContent = verseMatches.length;
                    counter.title = `${verseMatches.length} matches in this verse`;
                    firstHighlight.appendChild(counter);
                }
            }
        });
    }
    
    clearSearchHighlights() {
        // Get all verse text elements
        const verseTexts = this.textDisplay.querySelectorAll('.verse-text');
        
        verseTexts.forEach((verseElement, index) => {
            const originalText = this.currentBook?.chapters[this.currentChapterIndex]?.[index];
            if (originalText) {
                // Simply set text content (removes any HTML including highlights)
                verseElement.textContent = originalText;
            }
        });
        
        // Remove match counters
        const counters = this.textDisplay.querySelectorAll('.search-match-counter');
        counters.forEach(counter => counter.remove());
        
        // Remove search navigation
        const navContainer = document.querySelector('.search-navigation');
        if (navContainer) {
            navContainer.remove();
        }
        
        // Clear search stats
        if (this.searchStats) {
            this.searchStats.innerHTML = '';
        }
        
        // Reset search state
        this.currentSearchTerm = '';
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.totalMatches = 0;
        this.searchResultsCount = 0;
        
        // Clear search input
        if (this.searchInput) {
            this.searchInput.value = '';
        }
    }
    
    updateSearchStats() {
        // Find or create search stats element
        const searchSection = document.querySelector('.menu-section:nth-child(2)');
        if (!searchSection) return;
        
        // Remove existing search stats
        const existingStats = document.getElementById('search-stats');
        if (existingStats) {
            existingStats.remove();
        }
        
        // Create new search stats if we have results
        if (this.currentSearchTerm && this.searchResultsCount > 0) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'search-stats';
            statsDiv.id = 'search-stats';
            
            statsDiv.innerHTML = `
                <div>
                    Found <strong>${this.searchResultsCount}</strong> verse${this.searchResultsCount !== 1 ? 's' : ''} 
                    with <strong>${this.totalMatches}</strong> match${this.totalMatches !== 1 ? 'es' : ''} 
                    for "<strong>${this.currentSearchTerm}</strong>"
                </div>
                <button id="clear-search-btn" class="clear-search-btn" title="Clear search highlights">
                    <i class="fas fa-times"></i> Clear
                </button>
            `;
            
            // Insert after search box
            const searchBox = searchSection.querySelector('.search-box');
            if (searchBox) {
                searchBox.parentNode.insertBefore(statsDiv, searchBox.nextSibling);
            }
            
            // Add search navigation if we have matches
            if (this.searchMatches.length > 0) {
                this.updateSearchNavigation();
            }
            
            // Add event listener for clear button
            const clearBtn = document.getElementById('clear-search-btn');
            if (clearBtn) {
                clearBtn.onclick = () => this.clearSearchHighlights();
            }
        }
    }
    
    updateSearchNavigation() {
        if (this.searchMatches.length === 0) return;
        
        // Remove existing navigation
        const existingNav = document.querySelector('.search-navigation');
        if (existingNav) {
            existingNav.remove();
        }
        
        // Create navigation container
        const navContainer = document.createElement('div');
        navContainer.className = 'search-navigation';
        
        navContainer.innerHTML = `
            <button id="prev-match-btn" class="search-nav-btn" ${this.searchMatches.length <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
            <button id="next-match-btn" class="search-nav-btn" ${this.searchMatches.length <= 1 ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // Insert after search stats
        const searchStats = document.getElementById('search-stats');
        if (searchStats) {
            searchStats.parentNode.insertBefore(navContainer, searchStats.nextSibling);
        }
        
        // Add event listeners
        const prevBtn = document.getElementById('prev-match-btn');
        const nextBtn = document.getElementById('next-match-btn');
        
        if (prevBtn) {
            prevBtn.onclick = () => this.goToPrevMatch();
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => this.goToNextMatch();
        }
    }
    
    goToNextMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
        this.highlightCurrentMatch();
    }
    
    goToPrevMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = this.currentMatchIndex <= 0 ? 
            this.searchMatches.length - 1 : this.currentMatchIndex - 1;
        this.highlightCurrentMatch();
    }
    
    highlightCurrentMatch() {
        if (this.currentMatchIndex < 0 || this.currentMatchIndex >= this.searchMatches.length) return;
        
        const match = this.searchMatches[this.currentMatchIndex];
        
        // Navigate to the match if it's in a different chapter
        if (match.bookIndex !== this.currentBookIndex || 
            match.chapterIndex !== this.currentChapterIndex) {
            this.goToBook(match.bookIndex);
            this.goToChapter(match.chapterIndex);
            
            // Wait for chapter to load, then highlight
            setTimeout(() => {
                this.highlightSpecificMatch(match);
            }, 300);
        } else {
            // Highlight in current chapter
            this.highlightSpecificMatch(match);
        }
    }
    
    highlightSpecificMatch(match) {
        const verseElement = this.textDisplay.querySelector(`[data-verse-number="${match.verseIndex + 1}"]`);
        if (!verseElement) return;
        
        // Find all highlights in this verse
        const highlights = verseElement.querySelectorAll('.search-highlight');
        
        // Remove active class from all highlights
        const allHighlights = this.textDisplay.querySelectorAll('.search-highlight');
        allHighlights.forEach(highlight => highlight.classList.remove('active'));
        
        // Add active class to the correct highlight
        if (highlights.length > match.matchIndex) {
            const targetHighlight = highlights[match.matchIndex];
            targetHighlight.classList.add('active');
            
            // Scroll to the highlight
            targetHighlight.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });
            
            // Pulse animation
            targetHighlight.style.animation = 'pulse 1s';
            setTimeout(() => {
                targetHighlight.style.animation = '';
            }, 1000);
        }
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
        
        // Sort by book and chapter order
        results.sort((a, b) => {
            if (a.bookIndex !== b.bookIndex) return a.bookIndex - b.bookIndex;
            if (a.chapterIndex !== b.chapterIndex) return a.chapterIndex - b.chapterIndex;
            return a.verseIndex - b.verseIndex;
        });
        
        // Add total results count header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px;
            background: var(--hover-bg);
            border-radius: 6px;
            margin-bottom: 10px;
            font-size: 0.9rem;
            color: var(--text-light);
        `;
        
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${results.length}</strong> verse${results.length !== 1 ? 's' : ''} 
                    with <strong>${this.totalMatches}</strong> match${this.totalMatches !== 1 ? 'es' : ''}
                </div>
                <div style="font-size: 0.8rem;">
                    "${this.currentSearchTerm}"
                </div>
            </div>
        `;
        
        this.searchResults.appendChild(header);
        
        // Display each result
        results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.index = index;
            
            resultItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                    <strong>${result.bookName} ${result.chapterIndex + 1}:${result.verseIndex + 1}</strong>
                    ${result.occurrences > 1 ? `<span style="background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.8rem;">${result.occurrences}</span>` : ''}
                </div>
                <p>${this.highlightTextInResult(result.verseText.substring(0, 200), this.currentSearchTerm)}${result.verseText.length > 200 ? '...' : ''}</p>
            `;
            
            resultItem.onclick = () => {
                // Find the first match in this verse
                const verseMatches = this.searchMatches.filter(match => 
                    match.bookIndex === result.bookIndex && 
                    match.chapterIndex === result.chapterIndex && 
                    match.verseIndex === result.verseIndex
                );
                
                if (verseMatches.length > 0) {
                    this.currentMatchIndex = this.searchMatches.indexOf(verseMatches[0]);
                    this.goToBook(result.bookIndex);
                    this.goToChapter(result.chapterIndex);
                    this.closeSideMenu();
                }
            };
            
            this.searchResults.appendChild(resultItem);
        });
    }
    
    highlightTextInResult(text, searchTerm) {
        if (!searchTerm || searchTerm.length < 1) return this.escapeHtml(text);
        
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        const escapedText = this.escapeHtml(text);
        return escapedText.replace(regex, '<span style="background: rgba(52, 152, 219, 0.3); font-weight: 600; padding: 0 2px; border-radius: 2px;">$1</span>');
    }
    
    // Utility methods
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
                    if (this.currentSearchTerm) {
                        this.clearSearchHighlights();
                    }
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

                case 'F3':
                case 'f':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.openSideMenu();
                        this.searchInput.focus();
                        this.searchInput.select();
                    }
                    break;
                    
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.goToNextMatch();
                    }
                    break;
                    
                case 'p':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.goToPrevMatch();
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
